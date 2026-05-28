// ============================================================================
// LinkedIn DOM — single source of truth for every selector.
//
// LinkedIn ships two renderers (legacy Ember: artdeco / ql-editor, and the new
// React stack: tiptap / ProseMirror / componentkey) and frequently renames
// hashed classes. To stay resilient across versions AND future changes, every
// lookup tries multiple independent strategies, in order of reliability:
//
//   1. Stable class / attribute (fast, exact when present)
//   2. aria-label / visible text (FR + EN)
//   3. SVG icon identity (language-independent: thumbs-up / comment glyph)
//   4. Structural position inside the social action bar (last resort)
//
// Both the Assisted and Agent modes import from here so a LinkedIn change only
// ever needs to be fixed in this one file.
// ============================================================================

const POST_SELECTORS = [
  'div.feed-shared-update-v2',
  'div.update-components-update-v2',
  'article[data-urn]',
];

const ACTION_BAR_SELECTOR =
  '.feed-shared-social-action-bar, .social-actions-buttons, ' +
  '.feed-shared-social-actions, [class*="social-action"]';

// ─── Icon identity (language-independent) ───────────────────────────────────

function svgMatches(btn: Element, pattern: RegExp): boolean {
  // data-test-icon attribute (React stack)
  for (const svg of btn.querySelectorAll('svg[data-test-icon]')) {
    if (pattern.test(svg.getAttribute('data-test-icon') || '')) return true;
  }
  // <use href> / <use xlink:href> (Ember sprite icons)
  for (const use of btn.querySelectorAll('use')) {
    const href = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
    if (pattern.test(href)) return true;
  }
  return false;
}

function hasLikeIcon(btn: Element): boolean {
  if (btn.querySelector('[class*="reactions-icon"], .react-button__icon')) return true;
  return svgMatches(btn, /thumbs-up|like|reaction/i);
}

function hasCommentIcon(btn: Element): boolean {
  if (btn.querySelector('.comment-button__icon')) return true;
  return svgMatches(btn, /comment|speech-bubble/i);
}

// ─── Post discovery ─────────────────────────────────────────────────────────

export function hasLikeButton(el: Element): boolean {
  return Array.from(el.querySelectorAll('button')).some((b) => {
    const label = b.getAttribute('aria-label') || '';
    const text = b.textContent?.trim() || '';
    return (
      /réaction|réagir|j.aime|like/i.test(label) ||
      /^j.aime$/i.test(text) ||
      b.classList.contains('react-button__trigger') ||
      hasLikeIcon(b)
    );
  });
}

function collectPosts(): Set<Element> {
  const posts = new Set<Element>();
  for (const sel of POST_SELECTORS) {
    document.querySelectorAll(sel).forEach((p) => posts.add(p));
  }
  document.querySelectorAll('div[role="listitem"]').forEach((p) => {
    if (hasLikeButton(p)) posts.add(p);
  });
  return posts;
}

/** Every post currently in the DOM (used by Assisted mode highlighting). */
export function getAllPosts(): Element[] {
  return Array.from(collectPosts());
}

/** Posts within / near the viewport (used by Agent mode acting loop). */
export function getVisiblePosts(): Element[] {
  return Array.from(collectPosts()).filter((p) => {
    const r = p.getBoundingClientRect();
    return r.top < innerHeight + 500 && r.bottom > -200;
  });
}

export function findPostContainer(el: Element): Element | null {
  return el.closest(
    'div.feed-shared-update-v2, div.update-components-update-v2, article[data-urn], div[role="listitem"]'
  );
}

// ─── Comment-section guard ──────────────────────────────────────────────────
// Buttons inside an existing comment / reply thread must never be mistaken for
// the post-level like or comment actions.

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

function actionBarButtons(post: Element): HTMLButtonElement[] {
  const bar = post.querySelector(ACTION_BAR_SELECTOR);
  if (!bar) return [];
  return Array.from(bar.querySelectorAll('button')).filter(
    (b) => !isInsideCommentSection(b)
  ) as HTMLButtonElement[];
}

// ─── Like ───────────────────────────────────────────────────────────────────

export function findLikeButton(post: Element): HTMLButtonElement | null {
  // 1. Stable Ember class
  const classBtn = post.querySelector('button.react-button__trigger') as HTMLButtonElement | null;
  if (classBtn && !isInsideCommentSection(classBtn)) return classBtn;

  // 2. aria-label / text (FR + EN)
  const buttons = Array.from(post.querySelectorAll('button')) as HTMLButtonElement[];
  for (const btn of buttons) {
    if (isInsideCommentSection(btn)) continue;
    const label = btn.getAttribute('aria-label') || '';
    const text = btn.textContent?.trim() || '';
    if (/réaction|réagir|j.aime/i.test(label)) return btn;
    if (/^j.aime$/i.test(text)) return btn;
    if (/^like$/i.test(text) || /\blike\b/i.test(label)) return btn;
  }

  // 3. Icon identity (language-independent)
  for (const btn of buttons) {
    if (isInsideCommentSection(btn)) continue;
    if (hasLikeIcon(btn)) return btn;
  }

  // 4. Structural: first button in the social action bar
  const bar = actionBarButtons(post);
  if (bar.length) return bar[0];

  return null;
}

export function isLiked(btn: HTMLButtonElement | null): boolean {
  if (!btn) return true;
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

// ─── Comment ─────────────────────────────────────────────────────────────────

export function findCommentButton(post: Element): HTMLButtonElement | null {
  // 1. Stable Ember class
  const classBtn = post.querySelector('button.comment-button') as HTMLButtonElement | null;
  if (classBtn && !isInsideCommentSection(classBtn)) return classBtn;

  // 2. aria-label
  const ariaBtn = post.querySelector('button[aria-label="Commenter" i]') as HTMLButtonElement | null;
  if (ariaBtn && !isInsideCommentSection(ariaBtn)) return ariaBtn;

  const buttons = Array.from(post.querySelectorAll('button')) as HTMLButtonElement[];

  // 3. Text scan (exclude submit buttons)
  for (const btn of buttons) {
    if (isInsideCommentSection(btn)) continue;
    const text = btn.textContent?.trim() || '';
    const label = btn.getAttribute('aria-label') || '';
    const ck = btn.getAttribute('componentkey') || '';
    if ((/^commenter$/i.test(text) || /^comment$/i.test(text)) && !ck.includes('commentButtonSection')) {
      return btn;
    }
    if (/\bcommenter\b|\bcomment\b/i.test(label) && !ck.includes('commentButtonSection')) {
      return btn;
    }
  }

  // 4. Icon identity (language-independent)
  for (const btn of buttons) {
    if (isInsideCommentSection(btn)) continue;
    const ck = btn.getAttribute('componentkey') || '';
    if (ck.includes('commentButtonSection')) continue; // that's the submit button
    if (hasCommentIcon(btn)) return btn;
  }

  // 5. Structural: second button in the social action bar (after like)
  const bar = actionBarButtons(post);
  if (bar.length >= 2) return bar[1];

  return null;
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export function findEditor(post: Element): HTMLElement | null {
  const qlEd = post.querySelector('.ql-editor[contenteditable="true"]') as HTMLElement | null;
  if (qlEd) return qlEd;
  const tiptap = post.querySelector('.tiptap.ProseMirror[contenteditable="true"]') as HTMLElement | null;
  if (tiptap) return tiptap;
  const ariaEd = post.querySelector(
    '[contenteditable="true"][aria-label*="commentaire" i], ' +
      '[contenteditable="true"][aria-label*="comment" i], ' +
      '[contenteditable="true"][role="textbox"]'
  ) as HTMLElement | null;
  if (ariaEd) return ariaEd;
  return null;
}

// ─── Send / submit ────────────────────────────────────────────────────────────

export function findSendButton(post: Element): HTMLButtonElement | null {
  // 1. Stable Ember submit class
  let btn = post.querySelector('button.comments-comment-box__submit-button--cr') as HTMLButtonElement | null;
  if (btn) return btn;
  // 2. Primary button inside the Ember comment form
  btn = post.querySelector('form.comments-comment-box__form button.artdeco-button--primary') as HTMLButtonElement | null;
  if (btn) return btn;

  const buttons = Array.from(post.querySelectorAll('button')) as HTMLButtonElement[];

  // 3. React: componentkey marker
  for (const b of buttons) {
    const ck = b.getAttribute('componentkey') || '';
    if (ck.includes('commentButtonSection')) return b;
  }

  // 4. Text / label scan inside a comment area (FR + EN)
  for (const b of buttons) {
    const label = b.getAttribute('aria-label') || '';
    const text = b.textContent?.trim() || '';
    if (/publier|poster|envoyer|^post$|^reply$|submit/i.test(label) || /publier|poster|envoyer|^post$/i.test(text)) {
      const inCommentArea = b.closest(
        '.comments-comment-box, .comments-comment-box--cr, [componentkey*="commentBox" i], form'
      );
      if (inCommentArea) return b;
    }
  }
  return null;
}

// ─── Identity & metadata ──────────────────────────────────────────────────────

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
  for (const para of allPs) {
    const text = para.textContent?.trim();
    if (!text || text.length < 2 || text.length > 60) continue;
    if (/abonné|follower|^\d|commentaire|réaction|republication|^http|^#|^…|Ajouter un|Post du/i.test(text)) continue;
    return text;
  }
  return 'Utilisateur';
}
