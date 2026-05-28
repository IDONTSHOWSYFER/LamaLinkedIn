// Detects extension-context invalidation (extension disabled, reloaded, or
// silently auto-updated by Chrome while a LinkedIn tab stays open) and tears
// down every side effect, so a dead content script never keeps firing timers
// or spamming the page with `chrome-extension://invalid/` requests.
import { warn } from '@/lib/log';

type Teardown = () => void;

const teardowns = new Set<Teardown>();
let watchdog: number | null = null;
let dead = false;

export function contextAlive(): boolean {
  try {
    return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

function ensureWatchdog(): void {
  if (watchdog !== null) return;
  watchdog = window.setInterval(() => {
    if (dead) return;
    if (!contextAlive()) {
      dead = true;
      warn('Extension context invalidated — tearing down content script');
      runTeardowns();
    }
  }, 2000);
}

function runTeardowns(): void {
  for (const fn of Array.from(teardowns)) {
    try { fn(); } catch {}
  }
  teardowns.clear();
  if (watchdog !== null) { clearInterval(watchdog); watchdog = null; }
}

export function registerTeardown(fn: Teardown): () => void {
  teardowns.add(fn);
  ensureWatchdog();
  return () => { teardowns.delete(fn); };
}

export function isDead(): boolean {
  return dead;
}

/** Fire-and-forget message that no-ops once the context is dead. */
export function safeSendMessage(msg: unknown): void {
  if (!contextAlive()) return;
  try {
    chrome.runtime.sendMessage(msg, () => {
      // Reading lastError suppresses the "Unchecked runtime.lastError" noise
      // that Chrome logs when the receiving end has gone away.
      void chrome.runtime.lastError;
    });
  } catch {
    // Context died between the check and the call — ignore.
  }
}
