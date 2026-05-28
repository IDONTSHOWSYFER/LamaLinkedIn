import { UserConfig } from '@/types';
import { getSession, setSession, getVisitedIds, addVisitedId } from '@/lib/storage';
import { log, warn, error } from '@/lib/log';
import {
  getVisiblePosts as getPosts,
  findLikeButton,
  isLiked,
  findCommentButton,
  findEditor,
  findSendButton,
  getPostId,
  getAuthorName,
} from './linkedin';

type ActionCallback = (type: 'like' | 'comment', postId: string, content: string, authorName: string) => void;

const baseMsgs = [
  "Merci pour ce partage \ud83d\ude4c","Excellent post \ud83d\udc4f","Très inspirant \ud83d\ude0a",
  "Super contenu, merci \ud83d\ude4f","Top, j'aime beaucoup \ud83d\udca1",
  "Très bonne analyse \ud83d\udc4c","C'est exactement ça \u2705",
  "Merci pour ce contenu de qualité","Très clair et pertinent",
  "Bravo pour ce post \ud83d\udcaa","Super intéressant, merci \ud83d\ude4c",
  "Bonne réflexion \ud83d\udcad","Merci pour la transparence",
  "Excellente approche \ud83d\udc4c","Contenu utile et concret",
  "Je partage totalement ton avis \ud83d\udcac","Très instructif \ud83d\udd25",
  "Simple et efficace \u26a1","Toujours pertinent \ud83d\udc4f",
  "Belle leçon à retenir","Un rappel important \ud83d\udca1",
  "Inspiration du jour \u2600\ufe0f","Merci pour cette vision claire",
  "Un contenu qui motive \ud83d\udcaa","On adore ce genre de partage \ud83d\udc4f",
  "Très bon point de vue \ud83d\udc40","Totalement d'accord \u2705",
  "Toujours un plaisir de te lire","Une belle réflexion \ud83d\udc4c",
  "Ça fait réfléchir \ud83d\udcad","Merci pour cette pépite \ud83d\udc8e",
  "Très juste !","J'aime cette énergie \ud83d\udcab",
  "Excellent résumé \ud83d\udc4f","Super clair, merci \ud83d\ude4c",
  "C'est tellement vrai \ud83d\udc40","Bravo pour la qualité du contenu",
  "Je valide totalement \u2705","Merci pour l'inspiration \ud83d\ude4f",
  "Du bon sens comme toujours","Une analyse fine \ud83d\udc4c",
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
function jitter(ms: number, level: number): number {
  const mult = [1.15, 1.05, 1.0, 0.92, 0.85, 0.78][clamp(level, 0, 5)];
  const base = Math.max(80, ms * mult);
  return base + Math.random() * base * 0.35;
}
function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
function speedLevel(cfg: UserConfig): number {
  const raw = cfg.botSpeed ?? 3;
  if (raw <= 5) return clamp(raw, 0, 5);
  return clamp(Math.round((raw - 1) / 9 * 5), 0, 5);
}

// ========== Virtual Cursor ==========
let cursorEl: HTMLElement | null = null;
let cursorTimer: number | null = null;
let cursorIdle = { x: 0, y: 0 };
let isTyping = false;
let scrollPaused = false;

function injectCursor() {
  if (document.getElementById('lbp-cursor')) return;
  const style = document.createElement('style');
  style.id = 'lbp-cursor-styles';
  style.textContent = `
    #lbp-cursor {
      position: fixed;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(10, 102, 194, 0.8), rgba(10, 102, 194, 0.4));
      pointer-events: none;
      z-index: 2147483646;
      box-shadow: 0 0 12px rgba(10, 102, 194, 0.5), 0 0 4px rgba(10, 102, 194, 0.8);
      transform: translate(-50%, -50%);
      transition: left 0.05s linear, top 0.05s linear;
    }
  `;
  document.head.appendChild(style);

  cursorEl = document.createElement('div');
  cursorEl.id = 'lbp-cursor';
  cursorEl.style.left = `${innerWidth / 2}px`;
  cursorEl.style.top = `${Math.round(innerHeight * 0.3)}px`;
  document.body.appendChild(cursorEl);
  cursorIdle = { x: innerWidth / 2, y: innerHeight * 0.3 };
}

function startCursorDrift(level: number) {
  stopCursorDrift();
  injectCursor();
  const base = [95, 85, 75, 65, 56, 48][clamp(level, 0, 5)];
  cursorTimer = window.setInterval(() => {
    const c = document.getElementById('lbp-cursor');
    if (!c || isTyping || scrollPaused) return;
    if (Math.random() < 0.02) {
      const cx = parseFloat(c.style.left) || innerWidth / 2;
      const cy = parseFloat(c.style.top) || innerHeight / 3;
      cursorIdle = {
        x: Math.max(20, Math.min(innerWidth - 20, cx + (Math.random() * 140 - 70))),
        y: Math.max(20, Math.min(innerHeight - 80, cy + (Math.random() * 140 - 70))),
      };
    }
    let x = parseFloat(c.style.left) || innerWidth / 2;
    let y = parseFloat(c.style.top) || innerHeight / 3;
    const ease = 0.048 + level * 0.010;
    x += (cursorIdle.x - x) * ease;
    y += (cursorIdle.y - y) * ease;
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
  }, base);
}

function stopCursorDrift() {
  if (cursorTimer) { clearInterval(cursorTimer); cursorTimer = null; }
}

async function moveCursorTo(el: Element, level: number) {
  const c = document.getElementById('lbp-cursor');
  if (!c) return;
  const rect = el.getBoundingClientRect();
  const tx = rect.left + rect.width / 2 + (Math.random() * 10 - 5);
  const ty = rect.top + rect.height / 2 + (Math.random() * 6 - 3);
  cursorIdle = { x: tx, y: ty };
  // Smooth move
  const steps = 12 + Math.floor(Math.random() * 8);
  const sx = parseFloat(c.style.left) || innerWidth / 2;
  const sy = parseFloat(c.style.top) || innerHeight / 3;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    c.style.left = `${sx + (tx - sx) * t}px`;
    c.style.top = `${sy + (ty - sy) * t}px`;
    await sleep(12 + Math.random() * 6);
  }
  await sleep(jitter(100, level));
}

function removeCursor() {
  stopCursorDrift();
  document.getElementById('lbp-cursor')?.remove();
  document.getElementById('lbp-cursor-styles')?.remove();
  cursorEl = null;
}

// ========== Human Typing ==========
async function typeHuman(el: HTMLElement, text: string, level: number, isRunning: () => boolean, isPaused: () => boolean): Promise<boolean> {
  isTyping = true;
  scrollPaused = true;
  el.focus();

  const thinkTime = Math.min(2000, 400 + text.length * 30);
  await sleep(jitter(thinkTime, level));

  if (!isRunning()) { isTyping = false; scrollPaused = false; return false; }
  while (isPaused() && isRunning()) await sleep(120);
  if (!isRunning()) { isTyping = false; scrollPaused = false; return false; }

  const isQuill = el.classList.contains('ql-editor');

  el.focus();
  const sel = window.getSelection();
  if (sel) { sel.selectAllChildren(el); sel.deleteFromDocument(); }
  await sleep(80);

  el.focus();
  if (isQuill) {
    // Quill: use execCommand — it fires Quill's internal mutation observers
    document.execCommand('insertText', false, text);
    // Fallback if execCommand did nothing
    if (!el.textContent?.trim()) {
      el.textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } else {
    // Tiptap/ProseMirror: ClipboardEvent paste is the only reliable method
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    el.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: dt, bubbles: true, cancelable: true,
    }));
  }

  await sleep(jitter(400, level));
  isTyping = false;
  scrollPaused = false;
  return true;
}

// ========== Scroll Container ==========
// CRITICAL: LinkedIn 2025+ uses <main> as the scroll container with overflow: auto.
// document.body has overflow: hidden, so window.scrollBy() does NOTHING.
// All scrolling must target the <main> element (or fallback to window).

function getScrollContainer(): HTMLElement {
  const main = document.querySelector('main') as HTMLElement;
  if (main && main.scrollHeight > main.clientHeight) return main;
  // Fallback: try to find any scrollable container in the feed
  const candidates = document.querySelectorAll('[role="main"], .scaffold-layout__main');
  for (const c of candidates) {
    const el = c as HTMLElement;
    if (el.scrollHeight > el.clientHeight) return el;
  }
  // Last resort: use documentElement (old behavior)
  return document.documentElement;
}

function scrollBy(container: HTMLElement, amount: number): void {
  container.scrollTop += amount;
  // Dispatch scroll event so LinkedIn's IntersectionObserver fires
  container.dispatchEvent(new Event('scroll', { bubbles: true }));
}

/**
 * Click the "Charger plus" / "Load more" button if present at the bottom of the feed.
 * LinkedIn 2025+ paginates the feed with this button instead of pure infinite scroll.
 */
async function clickLoadMoreIfPresent(): Promise<boolean> {
  const feedList = document.querySelector('[role="list"]');
  if (!feedList) return false;

  // Look for "Charger plus" / "Load more" button inside or near the feed list
  const buttons = Array.from(document.querySelectorAll('button'));
  for (const btn of buttons) {
    const text = btn.textContent?.trim() || '';
    if (/^charger plus$/i.test(text) || /^load more$/i.test(text) || /^voir plus de publications$/i.test(text)) {
      // Check it's near the feed (inside role="list" parent or sibling)
      const nearFeed = btn.closest('[role="list"]') ||
                       btn.parentElement?.closest('[role="list"]') ||
                       btn.parentElement?.querySelector('[role="list"]');
      if (nearFeed || btn.getBoundingClientRect().top > 0) {
        btn.click();
        log('Clicked "Charger plus" to load more posts');
        await sleep(1500 + Math.random() * 1000); // Wait for posts to load
        return true;
      }
    }
  }
  return false;
}

// ========== Smooth Scroll ==========

async function smoothScroll(level: number, isRunning: () => boolean, isPaused: () => boolean, skip = 0): Promise<void> {
  scrollPaused = false;
  isTyping = false;

  if (!isRunning()) return;
  while (isPaused() && isRunning()) await sleep(120);

  const container = getScrollContainer();

  // Phase 1: Skip posts (fast scroll past already-visited posts)
  const skipTimes = clamp(skip, 0, 5);
  for (let k = 0; k < skipTimes; k++) {
    if (!isRunning()) return;
    while (isPaused() && isRunning()) await sleep(120);
    scrollBy(container, 350 + Math.random() * 250);
    await sleep(jitter(80, level));
  }

  // Phase 2: Smooth human-like scroll for ~1.5x viewport height
  const dist = Math.max(900, window.innerHeight * 1.5) + Math.random() * 500;
  const step = 6.0 + (level * 1.5);
  const total = Math.floor(dist / step);
  for (let i = 0; i < total; i++) {
    if (!isRunning()) return;
    while (isPaused() && isRunning()) await sleep(120);
    scrollBy(container, step + Math.random() * 4);
    if (i % 40 === 0) await sleep(jitter(25, level));
    await sleep(5 + Math.random() * 4);
  }

  // Phase 3: Wait for LinkedIn to render new posts
  await sleep(jitter(300, level));

  // Phase 4: Check if we're near the bottom — click "Charger plus" if available
  const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 300;
  if (nearBottom) {
    await clickLoadMoreIfPresent();
  }

  // Phase 5: Small additional scroll
  scrollBy(container, 150 + Math.random() * 150);
  await sleep(jitter(200, level));
}

/**
 * Scroll agressif pour quand aucun post n'est trouvé.
 * Scroll beaucoup plus loin, clique "Charger plus", attend le lazy-load.
 */
async function aggressiveScroll(level: number, isRunning: () => boolean, isPaused: () => boolean): Promise<void> {
  scrollPaused = false;
  isTyping = false;

  if (!isRunning()) return;
  while (isPaused() && isRunning()) await sleep(120);

  const container = getScrollContainer();

  // Scroll rapidly 2-3 viewport heights
  const dist = window.innerHeight * 2.5 + Math.random() * 500;
  const step = 10 + level * 2;
  const total = Math.floor(dist / step);

  for (let i = 0; i < total; i++) {
    if (!isRunning()) return;
    scrollBy(container, step + Math.random() * 5);
    if (i % 25 === 0) await sleep(jitter(15, level));
    await sleep(4 + Math.random() * 3);
  }

  // Try clicking "Charger plus" — this is the KEY for LinkedIn 2025+
  const clicked = await clickLoadMoreIfPresent();

  if (!clicked) {
    // No button found — scroll a bit more and try again
    scrollBy(container, 500 + Math.random() * 300);
    await sleep(800 + Math.random() * 500);
    await clickLoadMoreIfPresent();
  }

  // Final wait for DOM to update
  await sleep(jitter(500, level));
}

// ========== Detect already-commented posts ==========
/** Check if the current user already has a visible comment on this post */
function hasUserAlreadyCommented(post: Element): boolean {
  // Method 1: Check if comment editor already has content (from a previous attempt)
  const editor = post.querySelector('.ql-editor[contenteditable="true"], .tiptap.ProseMirror[contenteditable="true"]');
  if (editor) {
    const editorText = editor.textContent?.trim() || '';
    if (editorText.length > 0 && editorText !== 'Ajouter un commentaire…') return true;
  }

  // Method 2: Look for "Vous" or "Auteur" in comment sections
  const spans = post.querySelectorAll('span');
  for (const s of spans) {
    const text = s.textContent?.trim();
    if (text === 'Vous' || text === 'Auteur') {
      const parent = s.closest('[componentkey*="comment" i], .comments-comment-entity');
      if (parent) return true;
    }
  }

  // Method 3: Check if post has a "J'aime" button under a comment by user
  // (a reply "J'aime" + "Répondre" pattern inside comment thread means user commented)
  const commentBtns = post.querySelectorAll('button');
  for (const btn of commentBtns) {
    const label = btn.getAttribute('aria-label') || '';
    if (/votre commentaire/i.test(label)) return true;
  }

  return false;
}

// ========== Main ==========
export async function agentMode(
  config: UserConfig,
  isRunning: () => boolean,
  isPaused: () => boolean,
  onAction: ActionCallback
): Promise<() => void> {
  const level = speedLevel(config);
  const visitedIds = await getVisitedIds();
  let cancelled = false;

  const targetLikes = config.likesPerSession;
  const targetComments = config.commentsPerSession;
  const actionsTarget = Math.max(targetLikes + targetComments, config.totalResponsesMax || 100);

  const ctx = { likes: 0, comments: 0, actions: 0, targetLikes, targetComments, actionsTarget };

  injectCursor();
  startCursorDrift(level);

  async function actOnPost(post: Element): Promise<boolean> {
    if (!isRunning() || cancelled) return false;
    const id = getPostId(post);
    if (!id || visitedIds.has(id)) return false;
    visitedIds.add(id);
    await addVisitedId(id);

    let did = false;
    // Scroll the post into view within the <main> scroll container
    const container = getScrollContainer();
    const postRect = post.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const targetScroll = container.scrollTop + postRect.top - containerRect.top - (container.clientHeight / 3);
    // Smooth scroll to the post
    const startScroll = container.scrollTop;
    const scrollDist = targetScroll - startScroll;
    const steps = 20 + Math.floor(Math.random() * 10);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      container.scrollTop = startScroll + scrollDist * ease;
      await sleep(10 + Math.random() * 5);
    }
    container.dispatchEvent(new Event('scroll', { bubbles: true }));
    await sleep(jitter(400, level));
    while (isPaused() && isRunning()) await sleep(120);
    if (!isRunning() || cancelled) return false;

    const session = await getSession();
    const canLike = session.dailyLikes < 150 && ctx.likes < ctx.targetLikes;
    const canComment = session.dailyComments < 50 && ctx.comments < ctx.targetComments;
    const alreadyCommented = hasUserAlreadyCommented(post);

    // LIKE
    const lb = findLikeButton(post);
    if (lb && canLike && !isLiked(lb)) {
      await moveCursorTo(lb, level);
      await sleep(jitter(150, level));
      lb.click();
      ctx.likes++;
      ctx.actions++;
      did = true;
      onAction('like', id, 'Like', getAuthorName(post));
      await sleep(jitter(350, level));
    }

    // COMMENT — skip if user already commented on this post
    if (!alreadyCommented && canComment && ctx.actions < ctx.actionsTarget) {
      const cb = findCommentButton(post);
      if (cb) {
        await moveCursorTo(cb, level);
        await sleep(jitter(150, level));
        cb.click();
        await sleep(jitter(800, level));
        while (isPaused() && isRunning()) await sleep(120);
        if (!isRunning() || cancelled) return did;

        // Wait for editor to appear
        let ed: HTMLElement | null = null;
        for (let i = 0; i < 40; i++) {
          ed = findEditor(post);
          if (ed) break;
          await sleep(150);
        }

        if (ed) {
          // Check if editor already has content (post already commented)
          const existingText = ed.textContent?.trim() || '';
          if (existingText.length > 0 && existingText !== 'Ajouter un commentaire…') {
            // Editor has content — skip this post, don't type over it
            log('Editor already has content, skipping:', existingText.substring(0, 30));
            return did; // Return whatever we already did (like)
          }

          await moveCursorTo(ed, level);

          const pool = (config.customMessages?.length) ? config.customMessages : baseMsgs;
          const msg = pool[Math.floor(Math.random() * pool.length)];
          const typed = await typeHuman(ed, msg, level, isRunning, isPaused);

          if (typed) {
            // Wait for submit button to appear after typing
            let sb: HTMLButtonElement | null = null;
            for (let i = 0; i < 40; i++) {
              sb = findSendButton(post);
              if (sb && !sb.disabled) break;
              sb = null;
              await sleep(150);
            }
            if (sb && !sb.disabled) {
              await moveCursorTo(sb, level);
              await sleep(jitter(200, level));
              sb.click();
              ctx.comments++;
              ctx.actions++;
              did = true;
              onAction('comment', id, msg, getAuthorName(post));
              await sleep(jitter(600, level));
            } else {
              // Submit button not found — clear editor and move on
              warn('Submit button not found, skipping comment');
              ed.focus();
              const sel = window.getSelection();
              if (sel) { sel.selectAllChildren(ed); }
              const clearDt = new DataTransfer();
              clearDt.setData('text/plain', '');
              ed.dispatchEvent(new ClipboardEvent('paste', {
                clipboardData: clearDt, bubbles: true, cancelable: true,
              }));
            }
          }
        }
      }
    }

    return did;
  }

  // Main loop
  (async () => {
    try {
    let idleTries = 0;
    const MAX_IDLE = 6;

    const done = () => ctx.likes >= ctx.targetLikes && ctx.comments >= ctx.targetComments;

    // Initial scroll to get into the feed
    await sleep(jitter(500, level));
    await smoothScroll(level, isRunning, isPaused, 1);
    await sleep(jitter(400, level));

    while (isRunning() && !cancelled && ctx.actions < ctx.actionsTarget && !done()) {
      while (isPaused() && isRunning() && !cancelled) await sleep(150);
      if (!isRunning() || cancelled) break;

      const session = await getSession();
      if (session.dailyLikes >= 150 && session.dailyComments >= 50) {
        try {
          chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: 'Quotas journaliers atteints' });
        } catch {}
        break;
      }

      // Always reset flags before looking for posts
      scrollPaused = false;
      isTyping = false;

      const posts = getPosts();
      const unvisited = posts.filter(p => {
        const pid = getPostId(p);
        return pid && !visitedIds.has(pid);
      });

      if (unvisited.length === 0) {
        idleTries++;
        log(`No unvisited posts in viewport (attempt ${idleTries}/${MAX_IDLE}), scrolling...`);

        // Use aggressive scroll when no posts are found
        await aggressiveScroll(level, isRunning, isPaused);

        if (idleTries >= MAX_IDLE) {
          // Refresh the page to get new posts
          if (config.refreshAfterSession !== false) {
            try {
              chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: 'Flux vide, rechargement...', silent: true });
            } catch {}
            await setSession({ botState: 'running' });
            window.location.reload();
            return;
          } else {
            // No refresh allowed — just keep scrolling and reset counter
            idleTries = Math.floor(MAX_IDLE / 2);
          }
        }
        continue;
      }

      idleTries = 0;

      // Act on the first unvisited post
      const did = await actOnPost(unvisited[0]);

      // CRITICAL: Force reset flags after action — typeHuman might have left them stuck
      scrollPaused = false;
      isTyping = false;

      // Small pause to seem human
      await sleep(jitter(400, level));

      // ALWAYS scroll to find the next post — this is the key fix
      // The agent must continuously scroll the feed, never waiting for posts to appear
      log(`Action done (did=${did}), scrolling to next post... [${ctx.likes}L/${ctx.comments}C]`);
      await smoothScroll(level, isRunning, isPaused, Math.max(config.skipPosts || 0, 2));

      // Wait for LinkedIn to lazy-load new posts after scrolling
      await sleep(jitter(600, level));

      // If we still see the same posts, do an extra scroll
      const newPosts = getPosts();
      const newUnvisited = newPosts.filter(p => {
        const pid = getPostId(p);
        return pid && !visitedIds.has(pid);
      });
      if (newUnvisited.length === 0) {
        log('No new posts after scroll, doing extra scroll...');
        await smoothScroll(level, isRunning, isPaused, 3);
        await sleep(jitter(800, level));
      }
    }

    if (!cancelled && isRunning()) {
      try {
        chrome.runtime.sendMessage({
          type: 'LBP_NOTIFY',
          title: 'Lama Linked.In',
          message: `Session terminée : ${ctx.likes} likes, ${ctx.comments} commentaires`,
        });
      } catch {}

      // Session complete — handle pause + refresh cycle
      if (config.sessionsPerDay > 1 && config.refreshAfterSession !== false) {
        const pauseMs = (config.pauseDurationMin || 5) * 60 * 1000;
        log(`Session complete. Pausing ${config.pauseDurationMin || 5}min before next session...`);
        try {
          chrome.runtime.sendMessage({
            type: 'LBP_NOTIFY',
            title: 'Lama Linked.In',
            message: `Pause de ${config.pauseDurationMin || 5} minutes avant la prochaine session...`,
            silent: true,
          });
        } catch {}
        await sleep(pauseMs);
        if (isRunning() && !cancelled) {
          await setSession({ botState: 'running' });
          window.location.reload();
        }
      }
    }
    } catch (err) {
      error('Error in main loop:', err);
    }
  })();

  return () => {
    cancelled = true;
    removeCursor();
  };
}
