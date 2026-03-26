import { UserConfig } from '@/types';
import { getSession, setSession, getVisitedIds, addVisitedId } from '@/lib/storage';

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

// ========== DOM Selectors ==========
const getPosts = () =>
  Array.from(
    document.querySelectorAll('div.feed-shared-update-v2, div.update-components-update-v2, article[data-urn^="urn:li:activity:"]')
  ).filter(p => {
    const r = p.getBoundingClientRect();
    return r.top < innerHeight - 120 && r.bottom > 60;
  });

function isCommentLikeBtn(btn: Element): boolean {
  if (btn.closest('.comments-comment-entity, .comments-comment-social-bar--cr, .comments-comment-social-bar, .comments-comments-list')) return true;
  const label = btn.getAttribute('aria-label') || '';
  if (/au commentaire/i.test(label)) return true;
  return false;
}

function findLikeButton(p: Element): HTMLButtonElement | null {
  // Only get post-level like buttons (not comment likes)
  const btns = p.querySelectorAll('button.react-button__trigger');
  for (const btn of btns) {
    if (isCommentLikeBtn(btn)) continue;
    return btn as HTMLButtonElement;
  }
  // Fallback
  const fb = p.querySelector('button[aria-label*="J\'aime" i], button[aria-label*="Réagir avec" i]');
  if (fb && !isCommentLikeBtn(fb)) return fb as HTMLButtonElement;
  return null;
}

function isLiked(b: HTMLButtonElement | null): boolean {
  if (!b) return true;
  return b.getAttribute('aria-pressed') === 'true' || b.classList.contains('react-button--active');
}

function findCommentButton(p: Element): HTMLButtonElement | null {
  const btn = p.querySelector('button.comment-button, button[aria-label="Commenter" i]');
  if (btn && !btn.closest('.comments-comment-entity')) return btn as HTMLButtonElement;
  return null;
}

function findEditor(p: Element): HTMLElement | null {
  return p.querySelector('form.comments-comment-box__form .ql-editor[contenteditable="true"]') as HTMLElement | null;
}

function findSendButton(p: Element): HTMLButtonElement | null {
  let btn = p.querySelector('form.comments-comment-box__form button.comments-comment-box__submit-button--cr') as HTMLButtonElement | null;
  if (btn) return btn;
  btn = p.querySelector('form.comments-comment-box__form button.artdeco-button--primary') as HTMLButtonElement | null;
  return btn;
}

function getPostId(p: Element): string | null {
  const urn = p.getAttribute('data-urn') || p.getAttribute('data-chameleon-result-urn');
  if (urn) return urn;
  const art = p.closest('article[data-urn]');
  if (art) return art.getAttribute('data-urn');
  const a = p.querySelector('a[href*="/feed/update/"], a[href*="activity"]') as HTMLAnchorElement | null;
  if (a?.href) {
    try { return new URL(a.href, location.origin).pathname + (new URL(a.href, location.origin).search || ''); } catch {}
  }
  const rect = p.getBoundingClientRect();
  const seed = (p.id || '') + Math.round(rect.top) + (p.textContent || '').slice(0, 120);
  return seed ? 'v-' + btoa(unescape(encodeURIComponent(seed))).slice(0, 24) : null;
}

function getAuthorName(p: Element): string {
  const el = p.querySelector('.update-components-actor__name span, .feed-shared-actor__name span');
  return el?.textContent?.trim() || 'Utilisateur';
}

// ========== Human Typing ==========
async function typeHuman(el: HTMLElement, text: string, level: number, isRunning: () => boolean, isPaused: () => boolean): Promise<boolean> {
  isTyping = true;
  scrollPaused = true;
  el.focus();
  await sleep(jitter(160, level));
  document.execCommand('selectAll', false, undefined);
  document.execCommand('delete', false, undefined);

  for (const ch of text) {
    if (!isRunning()) { isTyping = false; scrollPaused = false; return false; }
    while (isPaused() && isRunning()) await sleep(120);
    if (!isRunning()) { isTyping = false; scrollPaused = false; return false; }
    document.execCommand('insertText', false, ch);
    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: ch }));
    await sleep(jitter(70, level));
    if (Math.random() < 0.05) await sleep(jitter(200, level));
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  await sleep(jitter(300, level));
  isTyping = false;
  scrollPaused = false;
  return true;
}

// ========== Smooth Scroll ==========
async function smoothScroll(level: number, isRunning: () => boolean, isPaused: () => boolean, skip = 0): Promise<void> {
  if (!isRunning() || isPaused() || scrollPaused || isTyping) return;
  const skipTimes = clamp(skip, 0, 5);
  for (let k = 0; k < skipTimes; k++) {
    if (!isRunning() || isPaused()) return;
    window.scrollBy(0, 260 + Math.random() * 240);
    await sleep(jitter(120, level));
  }
  const dist = 320 + Math.random() * 260;
  const step = 1.6 + (level * 0.55);
  const total = Math.floor(dist / step);
  for (let i = 0; i < total; i++) {
    if (!isRunning() || isPaused() || scrollPaused || isTyping) return;
    window.scrollBy(0, step + Math.random() * 1.8);
    if (i % 90 === 0) await sleep(jitter(80, level));
    await sleep(12 + Math.random() * 7);
  }
  await sleep(jitter(160, level));
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
  const actionsTarget = Math.min(targetLikes + targetComments, config.totalResponsesMax);
  const cursorEnabled = true; // Always show virtual cursor in agent mode

  const ctx = { likes: 0, comments: 0, actions: 0, targetLikes, targetComments, actionsTarget };

  if (cursorEnabled) {
    injectCursor();
    startCursorDrift(level);
  }

  async function actOnPost(post: Element): Promise<boolean> {
    if (!isRunning() || cancelled) return false;
    const id = getPostId(post);
    if (!id || visitedIds.has(id)) return false;
    visitedIds.add(id);
    await addVisitedId(id);

    let did = false;
    post.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(jitter(340, level));
    while (isPaused() && isRunning()) await sleep(120);
    if (!isRunning() || cancelled) return false;

    const session = await getSession();
    const canLike = session.dailyLikes < 150 && ctx.likes < ctx.targetLikes;
    const canComment = session.dailyComments < 50 && ctx.comments < ctx.targetComments;

    // LIKE
    const lb = findLikeButton(post);
    if (lb && canLike && !isLiked(lb)) {
      if (cursorEnabled) await moveCursorTo(lb, level);
      await sleep(jitter(150, level));
      lb.click();
      ctx.likes++;
      ctx.actions++;
      did = true;
      onAction('like', id, 'Like', getAuthorName(post));
      await sleep(jitter(300, level));
    }

    // COMMENT
    const cb = findCommentButton(post);
    if (cb && canComment && ctx.actions < ctx.actionsTarget) {
      if (cursorEnabled) await moveCursorTo(cb, level);
      await sleep(jitter(150, level));
      cb.click();
      await sleep(jitter(700, level));
      while (isPaused() && isRunning()) await sleep(120);
      if (!isRunning() || cancelled) return did;

      // Wait for editor
      let ed: HTMLElement | null = null;
      for (let i = 0; i < 30; i++) {
        ed = findEditor(post);
        if (ed) break;
        await sleep(120);
      }

      if (ed) {
        if (cursorEnabled) await moveCursorTo(ed, level);

        const pool = (config.customMessages?.length) ? config.customMessages : baseMsgs;
        const msg = pool[Math.floor(Math.random() * pool.length)];
        const typed = await typeHuman(ed, msg, level, isRunning, isPaused);

        if (typed) {
          let sb: HTMLButtonElement | null = null;
          for (let i = 0; i < 30; i++) {
            sb = findSendButton(post);
            if (sb && !sb.disabled) break;
            await sleep(120);
          }
          if (sb && !sb.disabled) {
            if (cursorEnabled) await moveCursorTo(sb, level);
            await sleep(jitter(200, level));
            sb.click();
            ctx.comments++;
            ctx.actions++;
            did = true;
            onAction('comment', id, msg, getAuthorName(post));
            await sleep(jitter(500, level));
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
    const MAX_IDLE = 24;

    const done = () => ctx.likes >= ctx.targetLikes && ctx.comments >= ctx.targetComments;

    while (isRunning() && !cancelled && ctx.actions < ctx.actionsTarget && !done()) {
      while (isPaused() && isRunning() && !cancelled) await sleep(150);
      if (!isRunning() || cancelled) break;

      const session = await getSession();
      if (session.dailyLikes >= 150 && session.dailyComments >= 50) {
        chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: 'Quotas journaliers atteints' });
        break;
      }

      const posts = getPosts();
      const unvisited = posts.filter(p => {
        const pid = getPostId(p);
        return pid && !visitedIds.has(pid);
      });

      if (unvisited.length === 0) {
        idleTries++;
        await smoothScroll(level, isRunning, isPaused, (config.skipPosts || 0) + 1);

        if (idleTries >= MAX_IDLE) {
          // Refresh the page to get new posts
          chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: 'Flux vide, rechargement...' , silent: true });
          // Save state for auto-restart
          await setSession({ botState: 'running' });
          window.location.reload();
          return;
        }
        continue;
      }

      idleTries = 0;
      const did = await actOnPost(unvisited[0]);
      if (!did) {
        await smoothScroll(level, isRunning, isPaused, config.skipPosts || 0);
      } else {
        await sleep(jitter(400, level));
        await smoothScroll(level, isRunning, isPaused, config.skipPosts || 0);
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
    }
    } catch (err) {
      console.error('[Lama Agent] Error in main loop:', err);
    }
  })();

  return () => {
    cancelled = true;
    removeCursor();
  };
}
