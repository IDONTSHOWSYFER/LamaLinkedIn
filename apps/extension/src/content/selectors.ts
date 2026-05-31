// Single source of truth for every LinkedIn DOM query the extension makes.
// LinkedIn ships two renderers in parallel — legacy Ember (artdeco / ql-editor)
// and the new React stack (tiptap / ProseMirror, role="listitem", componentkey)
// — so each lookup tries multiple strategies and works regardless of which
// version a given user is served. Both assist and agent modes import from here
// so selector fixes only ever have to be made in one place.
import { safeSendMessage } from './context';
import { warn } from '@/lib/log';
import { setSelectorAlert } from '@/lib/storage';

export function hasLikeButton(el: Element): boolean {
  return Array.from(el.querySelectorAll('button')).some((b) => {
    const label = b.getAttribute('aria-label') || '';
    const text = b.textContent?.trim() || '';
    return (
      /réaction|réagir|j.aime|like/i.test(label) ||
      /^j.aime$/i.test(text) ||
      b.classList.contains('react-button__trigger')
    );
  });
}

export function findPostContainer(el: Element): Element | null {
  return el.closest(
    'div.feed-shared-update-v2, div.update-components-update-v2, article[data-urn], div[role="listitem"]'
  );
}

export function findAllPosts(): Element[] {
  const posts = new Set<Element>();
  for (const sel of [
    'div.feed-shared-update-v2',
    'div.update-components-update-v2',
    'article[data-urn]',
  ]) {
    document.querySelectorAll(sel).forEach((p) => posts.add(p));
  }
  document.querySelectorAll('div[role="listitem"]').forEach((p) => {
    if (hasLikeButton(p)) posts.add(p);
  });
  return Array.from(posts);
}

/** Posts at or near the viewport — used by the agent so it only acts on what's on screen. */
export function findVisiblePosts(): Element[] {
  return findAllPosts().filter((p) => {
    const r = p.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    return r.top < window.innerHeight + 800 && r.bottom > -400;
  });
}

export function isInsideCommentSection(el: Element): boolean {
  if (el.closest('.comments-comment-entity, .comments-comment-social-bar, .comments-comments-list')) {
    return true;
  }
  const label = el.getAttribute('aria-label') || '';
  if (/au commentaire/i.test(label) || /comment.*like/i.test(label)) return true;
  const ck = el.getAttribute('componentkey') || '';
  const parentCk = el.closest('[componentkey]')?.getAttribute('componentkey') || '';
  if (/reply|commentReply/i.test(ck) || /reply|commentReply/i.test(parentCk)) return true;
  return false;
}

export function findLikeButton(post: Element): HTMLButtonElement | null {
  const classBtn = post.querySelector('button.react-button__trigger') as HTMLButtonElement | null;
  if (classBtn && !isInsideCommentSection(classBtn)) return classBtn;

  const allButtons = post.querySelectorAll('button');
  for (const btn of allButtons) {
    if (isInsideCommentSection(btn)) continue;
    const label = btn.getAttribute('aria-label') || '';
    const text = btn.textContent?.trim() || '';
    if (/réaction|réagir|j.aime/i.test(label)) return btn;
    if (/^j.aime$/i.test(text)) return btn;
    if (/^like$/i.test(text) || /\blike\b/i.test(label)) return btn;
  }
  return null;
}

export function isAlreadyLiked(btn: HTMLButtonElement): boolean {
  if (btn.getAttribute('aria-pressed') === 'true') return true;
  if (btn.classList.contains('react-button--active')) return true;
  const parentSpan = btn.closest('.reactions-react-button');
  if (parentSpan?.querySelector('.react-button--active')) return true;
  const label = btn.getAttribute('aria-label') || '';
  if (/aucune/i.test(label)) return false;
  if (/réaction/i.test(label)) return true;
  const circle = btn.querySelector('svg circle[fill="#378fe9"], svg circle[fill="#0a66c2"]');
  if (circle) return true;
  return false;
}

export function findCommentButton(post: Element): HTMLButtonElement | null {
  const classBtn = post.querySelector('button.comment-button') as HTMLButtonElement | null;
  if (classBtn && !isInsideCommentSection(classBtn)) return classBtn;

  const ariaBtn = post.querySelector('button[aria-label="Commenter" i]') as HTMLButtonElement | null;
  if (ariaBtn && !isInsideCommentSection(ariaBtn)) return ariaBtn;

  const allButtons = post.querySelectorAll('button');
  for (const btn of allButtons) {
    if (isInsideCommentSection(btn)) continue;
    const text = btn.textContent?.trim() || '';
    const ck = btn.getAttribute('componentkey') || '';
    if (/^commenter$/i.test(text) && !ck.includes('commentButtonSection')) {
      return btn;
    }
  }
  return null;
}

export function findEditor(post: Element): HTMLElement | null {
  const qlEd = post.querySelector('.ql-editor[contenteditable="true"]') as HTMLElement;
  if (qlEd) return qlEd;
  const tiptap = post.querySelector('.tiptap.ProseMirror[contenteditable="true"]') as HTMLElement;
  if (tiptap) return tiptap;
  const ariaEd = post.querySelector(
    '[contenteditable="true"][aria-label*="commentaire" i], ' +
      '[contenteditable="true"][aria-label*="comment" i], ' +
      '[contenteditable="true"][role="textbox"]'
  ) as HTMLElement;
  if (ariaEd) return ariaEd;
  return null;
}

export function findSendButton(post: Element): HTMLButtonElement | null {
  let btn = post.querySelector('button.comments-comment-box__submit-button--cr') as HTMLButtonElement | null;
  if (btn) return btn;
  btn = post.querySelector('form.comments-comment-box__form button.artdeco-button--primary') as HTMLButtonElement | null;
  if (btn) return btn;

  const allButtons = post.querySelectorAll('button');
  for (const b of allButtons) {
    const ck = b.getAttribute('componentkey') || '';
    if (ck.includes('commentButtonSection')) return b;
  }
  for (const b of allButtons) {
    const label = b.getAttribute('aria-label') || '';
    const text = b.textContent?.trim() || '';
    if (/publier|poster/i.test(label) || /publier|poster/i.test(text)) {
      const inCommentArea = b.closest(
        '.comments-comment-box, .comments-comment-box--cr, [componentkey*="commentBox" i]'
      );
      if (inCommentArea) return b;
    }
  }
  return null;
}

// Click classification: capture-phase listeners observe a click *before* LinkedIn
// handles it, so we attribute the user's action by inspecting the button that was hit.

export function isSendButtonEl(btn: Element): boolean {
  const ck = btn.getAttribute('componentkey') || '';
  if (ck.includes('commentButtonSection')) return true;
  if (btn.matches('button.comments-comment-box__submit-button--cr')) return true;
  if (btn.matches('form.comments-comment-box__form button.artdeco-button--primary')) return true;
  const label = btn.getAttribute('aria-label') || '';
  const text = btn.textContent?.trim() || '';
  if (/publier|poster/i.test(label) || /publier|poster/i.test(text)) {
    return !!btn.closest('.comments-comment-box, .comments-comment-box--cr, [componentkey*="commentBox" i]');
  }
  return false;
}

export function isCommentOpenButtonEl(btn: Element): boolean {
  if (isInsideCommentSection(btn) || isSendButtonEl(btn)) return false;
  if (btn.matches('button.comment-button')) return true;
  const label = btn.getAttribute('aria-label') || '';
  if (/^commenter$/i.test(label)) return true;
  const text = btn.textContent?.trim() || '';
  const ck = btn.getAttribute('componentkey') || '';
  return /^commenter$/i.test(text) && !ck.includes('commentButtonSection');
}

export function isLikeButtonEl(btn: Element): boolean {
  if (isInsideCommentSection(btn)) return false;
  if (btn.classList.contains('react-button__trigger')) return true;
  const label = btn.getAttribute('aria-label') || '';
  const text = btn.textContent?.trim() || '';
  if (/réaction|réagir|j.aime/i.test(label)) return true;
  if (/^j.aime$/i.test(text)) return true;
  if (/^like$/i.test(text) || /\blike\b/i.test(label)) return true;
  return false;
}

export function getPostId(post: Element): string {
  const cached = post.getAttribute('data-lbp-id');
  if (cached) return cached;

  let id: string | null = null;
  id = post.getAttribute('data-urn') || post.getAttribute('data-chameleon-result-urn') || null;
  if (!id) {
    const art = post.querySelector('article[data-urn]') || post.closest('article[data-urn]');
    if (art) id = art.getAttribute('data-urn');
  }
  if (!id) {
    const emberBtn = post.querySelector('button.react-button__trigger[id]');
    if (emberBtn) id = `ember-${emberBtn.id}`;
  }
  if (!id) id = post.getAttribute('componentkey');
  if (!id) {
    const innerCk = post.querySelector('[componentkey*="commentBox"]')?.getAttribute('componentkey');
    if (innerCk) id = innerCk;
  }
  if (!id) {
    id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  post.setAttribute('data-lbp-id', id);
  return id;
}

export function getAuthorName(post: Element): string {
  for (const sel of [
    '.update-components-actor__name span',
    '.feed-shared-actor__name span',
    'span[dir="ltr"] span[aria-hidden="true"]',
    'a[data-test-app-aware-link] span',
  ]) {
    const el = post.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text && text.length > 1 && text.length < 80) return text;
  }
  const allPs = post.querySelectorAll('p');
  for (const p of allPs) {
    const text = p.textContent?.trim();
    if (!text || text.length < 2 || text.length > 60) continue;
    if (/abonné|follower|^\d|commentaire|réaction|republication|^http|^#|^…|Ajouter un|Post du/i.test(text)) continue;
    return text;
  }
  return 'Utilisateur';
}

// Label-change detection: if we repeatedly see posts on screen but can't locate a single
// like button, LinkedIn has likely renamed/restructured its controls. We surface that once
// so the owner knows a selector update is needed, instead of silently doing nothing.

let consecutiveMisses = 0;
let alerted = false;
const MISS_THRESHOLD = 6;

export function recordSelectorHealth(posts: Element[]): void {
  if (posts.length === 0) return;
  const anyLike = posts.some((p) => !!findLikeButton(p));
  if (anyLike) {
    consecutiveMisses = 0;
    return;
  }
  consecutiveMisses++;
  if (consecutiveMisses >= MISS_THRESHOLD && !alerted) {
    alerted = true;
    warn('Selector health: posts present but no like button found — LinkedIn UI likely changed');
    const detail = { url: location.href, postsSeen: posts.length, ts: Date.now() };
    setSelectorAlert(detail);
    safeSendMessage({
      type: 'LBP_NOTIFY',
      title: 'Lama Linked.In',
      message: "L'interface LinkedIn semble avoir changé — une mise à jour de l'extension est nécessaire.",
    });
    safeSendMessage({ type: 'LBP_SELECTOR_ALERT', detail });
  }
}

export function resetSelectorHealth(): void {
  consecutiveMisses = 0;
  alerted = false;
}
