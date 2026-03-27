import { UserConfig } from '@/types';

type ActionCallback = (type: 'like' | 'comment', postId: string, content: string, authorName: string) => void;

const SUGGESTIONS = [
  'Merci pour ce partage inspirant !',
  'Excellent point de vue, je suis d\'accord.',
  'Super contenu, bravo !',
  'Belle analyse, merci pour la valeur ajoutée.',
  'Très pertinent, merci du partage !',
  'J\'adore cette approche !',
  'Contenu de qualité comme d\'habitude !',
  'Merci pour cette perspective enrichissante.',
];

// ========== LinkedIn 2025+ DOM selectors ==========
// LinkedIn now uses hashed CSS classes and role-based containers.
// Posts are div[role="listitem"], like buttons have aria-label with "réaction",
// the editor is .tiptap.ProseMirror, and the submit button has componentkey
// containing "commentButtonSection".

/** Find the post container from any child element */
function findPostContainer(el: Element): Element | null {
  // New LinkedIn: posts are role="listitem"
  const listItem = el.closest('div[role="listitem"]');
  if (listItem) return listItem;
  // Old LinkedIn fallbacks
  return el.closest(
    'div.feed-shared-update-v2, div.update-components-update-v2, article[data-urn]'
  );
}

/** Find all visible posts on the page */
function findAllPosts(): Element[] {
  const posts = new Set<Element>();

  // LinkedIn 2025+: posts are div[role="listitem"] containing a like button.
  // They may NOT be direct children of div[role="list"] (LinkedIn adds wrapper divs).
  document.querySelectorAll('div[role="listitem"]').forEach(p => {
    const hasReaction = Array.from(p.querySelectorAll('button')).some(
      b => (b.getAttribute('aria-label') || '').includes('réaction') ||
           /^j.aime$/i.test(b.textContent?.trim() || '')
    );
    if (hasReaction) posts.add(p);
  });

  // Old LinkedIn fallbacks
  if (posts.size === 0) {
    const oldSelectors = [
      'div.feed-shared-update-v2',
      'div.update-components-update-v2',
      'article[data-urn]',
    ];
    for (const sel of oldSelectors) {
      document.querySelectorAll(sel).forEach(p => posts.add(p));
    }
  }

  return Array.from(posts);
}

/** Find the like button for a post (NOT comment likes) */
function findLikeButton(post: Element): HTMLButtonElement | null {
  const allButtons = post.querySelectorAll('button');
  for (const btn of allButtons) {
    // Skip buttons inside comment reply areas
    if (isInsideCommentSection(btn)) continue;

    const label = btn.getAttribute('aria-label') || '';
    const text = btn.textContent?.trim() || '';

    // New LinkedIn 2025+: aria-label contains "réaction"
    // e.g. "État du bouton de réaction : aucune réaction"
    if (/réaction/i.test(label)) {
      return btn;
    }

    // Also match by text content "J'aime" (the visible button text)
    if (/^j.aime$/i.test(text)) {
      return btn;
    }

    // Old LinkedIn: aria-label with "J'aime", "réagir", "Like"
    if (/j.aime/i.test(label) || /réagir/i.test(label) || /like/i.test(label)) {
      return btn;
    }
  }

  // Old selector fallback
  const oldBtn = post.querySelector('button.react-button__trigger');
  if (oldBtn && !isInsideCommentSection(oldBtn)) return oldBtn as HTMLButtonElement;

  return null;
}

/** Check if a button is inside a comments section (not post-level) */
function isInsideCommentSection(el: Element): boolean {
  // Old LinkedIn class-based detection
  if (el.closest('.comments-comment-entity, .comments-comment-social-bar, .comments-comments-list')) return true;

  // Check aria-label for comment-specific patterns
  const label = el.getAttribute('aria-label') || '';
  if (/au commentaire/i.test(label) || /comment.*like/i.test(label)) return true;

  // New LinkedIn: check componentkey patterns
  // "commentButtonSection" = the submit button (OK, not a comment-section button)
  // We only want to exclude buttons inside reply threads
  const ck = el.getAttribute('componentkey') || '';
  const parentCk = el.closest('[componentkey]')?.getAttribute('componentkey') || '';

  // Skip if inside a reply/comment entity
  if (/reply|commentReply/i.test(ck) || /reply|commentReply/i.test(parentCk)) return true;

  return false;
}

/** Check if like button is already activated */
function isAlreadyLiked(btn: HTMLButtonElement): boolean {
  // Old LinkedIn
  if (btn.getAttribute('aria-pressed') === 'true') return true;
  if (btn.classList.contains('react-button--active')) return true;

  // New LinkedIn 2025+: aria-label tells the state
  // Not liked: "État du bouton de réaction : aucune réaction"
  // Liked: does NOT contain "aucune réaction"
  const label = btn.getAttribute('aria-label') || '';
  if (/réaction/i.test(label) && !/aucune/i.test(label)) {
    return true;
  }

  // Check for filled like icon (blue circle SVG)
  const svg = btn.querySelector('svg');
  if (svg) {
    const circle = svg.querySelector('circle[fill="#378fe9"], circle[fill="#0a66c2"]');
    if (circle) return true;
  }

  return false;
}

/** Find the comment button for a post (opens the comment editor) */
function findCommentButton(post: Element): HTMLButtonElement | null {
  const allButtons = post.querySelectorAll('button');
  for (const btn of allButtons) {
    if (isInsideCommentSection(btn)) continue;

    const text = btn.textContent?.trim() || '';
    const ck = btn.getAttribute('componentkey') || '';

    // New LinkedIn: "Commenter" text but NOT the submit button
    // Submit button has componentkey containing "commentButtonSection"
    if (/^commenter$/i.test(text) && !ck.includes('commentButtonSection')) {
      return btn;
    }
  }

  // Old selector fallback
  const oldBtn = post.querySelector('button.comment-button, button[aria-label="Commenter" i]');
  if (oldBtn && !isInsideCommentSection(oldBtn)) return oldBtn as HTMLButtonElement;

  return null;
}

/** Find the comment editor (tiptap/ProseMirror or old ql-editor) */
function findEditor(post: Element): HTMLElement | null {
  // New LinkedIn 2025+: tiptap ProseMirror editor
  const tiptap = post.querySelector('.tiptap.ProseMirror[contenteditable="true"]') as HTMLElement;
  if (tiptap) return tiptap;

  // Aria-label based search
  const ariaEd = post.querySelector('[contenteditable="true"][aria-label*="commentaire" i], [contenteditable="true"][aria-label*="comment" i]') as HTMLElement;
  if (ariaEd) return ariaEd;

  // Old LinkedIn: ql-editor
  const qlEd = post.querySelector('.ql-editor[contenteditable="true"]') as HTMLElement;
  if (qlEd) return qlEd;

  return null;
}

/** Find the send/submit button for comments */
function findSendButton(post: Element): HTMLButtonElement | null {
  const allButtons = post.querySelectorAll('button');
  for (const btn of allButtons) {
    const ck = btn.getAttribute('componentkey') || '';
    const text = btn.textContent?.trim() || '';
    const label = btn.getAttribute('aria-label') || '';

    // New LinkedIn 2025+: submit button has componentkey with "commentButtonSection"
    // and text "Commenter"
    if (ck.includes('commentButtonSection')) {
      return btn;
    }

    // Old LinkedIn: "publier", "envoyer", "poster"
    if (/publier|envoyer|poster|submit|send/i.test(label) || /publier|envoyer|poster/i.test(text)) {
      const inCommentArea = btn.closest('[componentkey*="commentBox" i], .comments-comment-box, .comments-comment-box--cr');
      if (inCommentArea) return btn;
    }
  }

  // Old selectors fallback
  const old = post.querySelector('button.comments-comment-box__submit-button--cr, form.comments-comment-box__form button.artdeco-button--primary') as HTMLButtonElement;
  if (old) return old;

  return null;
}

function getPostId(post: Element): string {
  // New LinkedIn 2025+: use componentkey as post identifier
  const ck = post.getAttribute('componentkey');
  if (ck) return ck;

  // Old LinkedIn: data-urn
  const urn = post.getAttribute('data-urn') || post.getAttribute('data-chameleon-result-urn');
  if (urn) return urn;
  const art = post.closest('article[data-urn]');
  if (art) return art.getAttribute('data-urn')!;

  // Fallback: generate unique ID
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAuthorName(post: Element): string {
  // New LinkedIn 2025+: Author name is in a <p> tag near the top of the post.
  // It's typically the first meaningful text node that isn't a status/label.
  const allPs = post.querySelectorAll('p');
  for (const p of allPs) {
    const text = p.textContent?.trim();
    // Skip empty, very short, or very long texts; skip known non-author patterns
    if (!text || text.length < 2 || text.length > 60) continue;
    if (/abonné|follower|^\d|commentaire|réaction|republication|^http|^#|^…|Ajouter un/i.test(text)) continue;
    // Skip if it's inside the post content area (after the author section)
    // Author <p> is usually one of the first <p> tags
    return text;
  }

  // Old LinkedIn selectors
  const selectors = [
    '.update-components-actor__name span',
    '.feed-shared-actor__name span',
    'span[dir="ltr"] span[aria-hidden="true"]',
    'a[data-test-app-aware-link] span',
  ];
  for (const sel of selectors) {
    const el = post.querySelector(sel);
    const text = el?.textContent?.trim();
    if (text && text.length > 1 && text.length < 80) return text;
  }

  return 'Utilisateur Linked.In';
}

export function assistMode(
  config: UserConfig,
  isRunning: () => boolean,
  isPaused: () => boolean,
  onAction: ActionCallback
): () => void {
  const HIGHLIGHT_CLASS = 'lbp-highlight';
  const SUGGESTION_CLASS = 'lbp-suggestion-bar';
  const PROCESSED_ATTR = 'data-lbp-processed';

  const style = document.createElement('style');
  style.id = 'lbp-assist-styles';
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      background: rgba(10, 102, 194, 0.08) !important;
      box-shadow: inset 0 0 0 2px rgba(10, 102, 194, 0.4) !important;
      border-radius: 8px !important;
      animation: lbp-pulse 2s ease-in-out infinite !important;
    }
    @keyframes lbp-pulse {
      0%, 100% { box-shadow: inset 0 0 0 2px rgba(10, 102, 194, 0.4); }
      50% { box-shadow: inset 0 0 0 2px rgba(55, 143, 233, 0.6); }
    }
    .${SUGGESTION_CLASS} {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 10px;
      margin: 6px 0 0 0;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      box-sizing: border-box;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-title {
      font-weight: 600;
      color: #0A66C2;
      font-size: 11px;
    }
    .${SUGGESTION_CLASS} .lbp-regen-btn {
      background: none;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 10px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 3px;
      transition: all 0.15s;
    }
    .${SUGGESTION_CLASS} .lbp-regen-btn:hover {
      background: #f1f5f9;
      border-color: #0A66C2;
      color: #0A66C2;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.15s;
      background: white;
      border: 1px solid #e2e8f0;
      color: #374151;
      font-size: 11px;
      line-height: 1.3;
      white-space: nowrap;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-chip:hover {
      background: #0A66C2;
      color: white;
      border-color: #0A66C2;
    }
  `;
  document.head.appendChild(style);

  function fillEditorWithText(post: Element, text: string) {
    const ed = findEditor(post);
    if (!ed) return;
    ed.focus();
    // Use ClipboardEvent paste — the only reliable method for tiptap/ProseMirror
    const sel = window.getSelection();
    if (sel) { sel.selectAllChildren(ed); }
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    ed.dispatchEvent(new ClipboardEvent('paste', {
      clipboardData: dt, bubbles: true, cancelable: true,
    }));
  }

  function buildSuggestionChips(post: Element, bar: HTMLElement) {
    const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 4);
    const list = bar.querySelector('.lbp-suggestion-list')!;
    list.innerHTML = '';
    shuffled.forEach(s => {
      const chip = document.createElement('span');
      chip.className = 'lbp-suggestion-chip';
      chip.textContent = s;
      chip.dataset.text = s;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const ed = findEditor(post);
        if (!ed) {
          const commentBtn = findCommentButton(post);
          if (commentBtn) {
            commentBtn.click();
            setTimeout(() => fillEditorWithText(post, s), 800);
          }
        } else {
          fillEditorWithText(post, s);
        }
      });
      list.appendChild(chip);
    });
  }

  function injectSuggestions(post: Element) {
    // Already injected?
    if (post.querySelector(`.${SUGGESTION_CLASS}`)) return;

    const bar = document.createElement('div');
    bar.className = SUGGESTION_CLASS;
    bar.innerHTML = `
      <div class="lbp-suggestion-header">
        <span class="lbp-suggestion-title">\u2728 Suggestions</span>
        <button class="lbp-regen-btn">\u21BB Autres</button>
      </div>
      <div class="lbp-suggestion-list"></div>
    `;

    // Build initial chips
    buildSuggestionChips(post, bar);

    // Regenerate button
    bar.querySelector('.lbp-regen-btn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      buildSuggestionChips(post, bar);
    });

    // Insert AFTER the submit button section — OUTSIDE the editor area
    // This prevents the suggestions from squeezing the editor and causing vertical text
    const submitSection = post.querySelector('div[componentkey*="commentButtonSection" i]');
    if (submitSection) {
      submitSection.parentElement?.insertBefore(bar, submitSection.nextSibling);
      return;
    }

    // Fallback: insert after the comment box link preview (last element in comment area)
    const linkPreview = post.querySelector('[componentkey*="commentBoxLinkPreview" i]');
    if (linkPreview) {
      linkPreview.parentElement?.insertBefore(bar, linkPreview.nextSibling);
      return;
    }

    // Fallback: insert after the comment box wrapper's parent
    const commentBox = post.querySelector(
      '[componentkey*="commentBox" i], .comments-comment-box, .comments-comment-box--cr'
    );
    if (commentBox) {
      // Go up past the editor wrapper to not block the editor
      const editorWrapper = commentBox.closest('[data-testid="ui-core-tiptap-text-editor-wrapper"]')?.parentElement
        || commentBox.parentElement;
      const outerWrapper = editorWrapper?.parentElement;
      if (outerWrapper) {
        outerWrapper.parentElement?.insertBefore(bar, outerWrapper.nextSibling);
        return;
      }
    }

    // Last fallback: append to post
    post.appendChild(bar);
  }

  function watchCommentSends(post: Element) {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find the send button being clicked
      const sendBtn = target.closest('button');
      if (!sendBtn) return;

      const ck = sendBtn.getAttribute('componentkey') || '';
      const label = sendBtn.getAttribute('aria-label') || '';
      const text = sendBtn.textContent?.trim() || '';

      // New LinkedIn: submit button has "commentButtonSection" in componentkey
      const isNewSend = ck.includes('commentButtonSection');

      // Old LinkedIn: "publier", "envoyer", "poster"
      const isOldSend = /publier|envoyer|poster|submit|send/i.test(label) ||
                        /publier|envoyer|poster/i.test(text) ||
                        sendBtn.matches('button.comments-comment-box__submit-button--cr, form.comments-comment-box__form button.artdeco-button--primary');

      if (!isNewSend && !isOldSend) return;

      // Make sure it belongs to this post
      const postContainer = findPostContainer(sendBtn);
      if (postContainer !== post) return;

      // Get the editor text
      const ed = findEditor(post);
      const commentText = ed?.textContent?.trim() || '';
      if (commentText) {
        const postId = getPostId(post);
        onAction('comment', postId, commentText, getAuthorName(post));
      }
    };
    post.addEventListener('click', handler, { capture: true });
    return handler;
  }

  const commentHandlers: Array<{ post: Element; handler: (e: Event) => void }> = [];

  function processPost(post: Element) {
    if (post.getAttribute(PROCESSED_ATTR)) return;
    post.setAttribute(PROCESSED_ATTR, '1');

    // Find the like button
    const likeBtn = findLikeButton(post);

    if (likeBtn && !isAlreadyLiked(likeBtn)) {
      likeBtn.classList.add(HIGHLIGHT_CLASS);

      likeBtn.addEventListener('click', () => {
        const postId = getPostId(post);
        onAction('like', postId, 'Like', getAuthorName(post));
        likeBtn.classList.remove(HIGHLIGHT_CLASS);
        // Show suggestions after like — first open comment box, then show suggestions
        const commentBtn = findCommentButton(post);
        if (commentBtn) {
          commentBtn.click();
        }
        setTimeout(() => injectSuggestions(post), 800);
      }, { once: true, capture: true });
    }

    // Watch for manual comment submissions
    const handler = watchCommentSends(post);
    commentHandlers.push({ post, handler });
  }

  const observer = new MutationObserver(() => {
    if (!isRunning() || isPaused()) return;
    scan();
  });

  function scan() {
    if (!isRunning() || isPaused()) return;
    findAllPosts().forEach(processPost);
  }

  observer.observe(document.body, { childList: true, subtree: true });
  scan();
  const intervalId = window.setInterval(scan, 3000);

  return () => {
    clearInterval(intervalId);
    observer.disconnect();
    commentHandlers.forEach(({ post, handler }) => post.removeEventListener('click', handler, { capture: true } as any));
    style.remove();
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach(el => el.classList.remove(HIGHLIGHT_CLASS));
    document.querySelectorAll(`.${SUGGESTION_CLASS}`).forEach(el => el.remove());
    document.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach(el => el.removeAttribute(PROCESSED_ATTR));
  };
}
