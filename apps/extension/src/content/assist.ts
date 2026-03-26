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
      position: relative !important;
      box-shadow: 0 0 0 2px #0A66C2, 0 0 8px rgba(10, 102, 194, 0.4) !important;
      border-radius: 8px !important;
      animation: lbp-glow 2s ease-in-out infinite !important;
    }
    @keyframes lbp-glow {
      0%, 100% { box-shadow: 0 0 0 2px #0A66C2, 0 0 8px rgba(10, 102, 194, 0.3); }
      50% { box-shadow: 0 0 0 3px #0A66C2, 0 0 16px rgba(10, 102, 194, 0.6); }
    }
    .${SUGGESTION_CLASS} {
      background: linear-gradient(135deg, rgba(10, 102, 194, 0.06), rgba(244, 177, 131, 0.06));
      border: 1px solid rgba(10, 102, 194, 0.15);
      border-radius: 12px;
      padding: 10px;
      margin: 8px 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      width: calc(100% - 24px);
      box-sizing: border-box;
      clear: both;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-title {
      font-weight: 600;
      color: #0A66C2;
      margin-bottom: 6px;
      font-size: 11px;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(10, 102, 194, 0.08);
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-item:hover {
      background: rgba(10, 102, 194, 0.08);
      border-color: rgba(10, 102, 194, 0.2);
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-item .lbp-text {
      flex: 1;
      color: #374151;
      line-height: 1.4;
      font-size: 12px;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-item .lbp-fill-btn {
      background: #0A66C2;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 3px 10px;
      font-size: 10px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .${SUGGESTION_CLASS} .lbp-suggestion-item .lbp-fill-btn:hover {
      background: #084C8C;
    }
  `;
  document.head.appendChild(style);

  function getPostContainer(el: Element): Element | null {
    return el.closest('div.feed-shared-update-v2, div.update-components-update-v2, article[data-urn]');
  }

  function getPostId(post: Element): string | null {
    const urn = post.getAttribute('data-urn') || post.getAttribute('data-chameleon-result-urn');
    if (urn) return urn;
    const art = post.closest('article[data-urn]');
    if (art) return art.getAttribute('data-urn');
    const a = post.querySelector('a[href*="/feed/update/"], a[href*="activity"]') as HTMLAnchorElement | null;
    if (a?.href) {
      try { return new URL(a.href, location.origin).pathname; } catch {}
    }
    return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function getAuthorName(post: Element): string {
    const el = post.querySelector('.update-components-actor__name span, .feed-shared-actor__name span');
    return el?.textContent?.trim() || 'Utilisateur Linked.In';
  }

  function fillEditor(post: Element, text: string) {
    const ed = post.querySelector('.ql-editor[contenteditable="true"]') as HTMLElement;
    if (!ed) return;
    ed.focus();
    const p = ed.querySelector('p');
    if (p) p.innerHTML = text;
    else ed.innerHTML = `<p>${text}</p>`;
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    ed.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function injectSuggestions(post: Element) {
    // Find the comments container of the post
    const commentsContainer = post.querySelector('.feed-shared-update-v2__comments-container');
    if (!commentsContainer) return;
    if (commentsContainer.querySelector(`.${SUGGESTION_CLASS}`)) return;

    const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 3);
    const bar = document.createElement('div');
    bar.className = SUGGESTION_CLASS;
    bar.innerHTML = `
      <div class="lbp-suggestion-title">\u2728 Suggestions de commentaires</div>
      <div class="lbp-suggestion-list">
        ${shuffled.map(s => `
          <div class="lbp-suggestion-item" data-text="${s.replace(/"/g, '&quot;')}">
            <span class="lbp-text">${s}</span>
            <button class="lbp-fill-btn">Remplir</button>
          </div>
        `).join('')}
      </div>
    `;

    // Fill only (don't count as comment - count happens on send)
    bar.querySelectorAll('.lbp-suggestion-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const text = (item as HTMLElement).dataset.text || '';
        fillEditor(post, text);
        // Do NOT call onAction here - only on actual send
      });
    });

    // Insert at the top of the comments container (under the comment box)
    const commentBox = commentsContainer.querySelector('.comments-comment-box, .comments-comment-box--cr');
    if (commentBox) {
      commentBox.parentElement?.insertBefore(bar, commentBox.nextSibling);
    } else {
      commentsContainer.prepend(bar);
    }
  }

  // Watch for comment sends using a delegated click handler on the post
  function watchCommentSends(post: Element) {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      // Check if the clicked element is or is inside a send/comment button
      const sendBtn = target.closest('button.comments-comment-box__submit-button--cr, form.comments-comment-box__form button.artdeco-button--primary');
      if (!sendBtn) return;
      // Make sure it belongs to this post
      const postContainer = sendBtn.closest('div.feed-shared-update-v2, div.update-components-update-v2, article[data-urn]');
      if (postContainer !== post) return;

      // Get the editor text from the form containing this button
      const form = sendBtn.closest('form.comments-comment-box__form');
      const ed = form?.querySelector('.ql-editor[contenteditable="true"]') as HTMLElement | null
        ?? post.querySelector('.ql-editor[contenteditable="true"]') as HTMLElement | null;
      const text = ed?.textContent?.trim() || '';
      if (text) {
        const postId = getPostId(post);
        if (postId) {
          onAction('comment', postId, text, getAuthorName(post));
        }
      }
    };
    post.addEventListener('click', handler, { capture: true });
    return handler;
  }

  const commentHandlers: Array<{ post: Element; handler: (e: Event) => void }> = [];

  function processPost(post: Element) {
    if (post.getAttribute(PROCESSED_ATTR)) return;
    post.setAttribute(PROCESSED_ATTR, '1');

    // Find the MAIN social action bar of the POST (not comment like buttons)
    // The post-level like button is inside the main social actions bar,
    // NOT inside .comments-comment-entity or .comments-comment-social-bar
    const socialBar = post.querySelector('.feed-shared-social-action-bar, .social-actions-button-group');
    const likeContainer = socialBar || post;

    // Find like buttons that are direct post reactions (not comment reactions)
    const likeBtns = likeContainer.querySelectorAll('button.react-button__trigger');

    // Helper: is this a comment-level like button (not a post-level like)?
    const isCommentLike = (btn: Element): boolean => {
      // Check parent containers
      if (btn.closest('.comments-comment-entity, .comments-comment-social-bar--cr, .comments-comment-social-bar, .comments-comments-list')) return true;
      // Check aria-label for "au commentaire" pattern (LinkedIn FR)
      const label = btn.getAttribute('aria-label') || '';
      if (/au commentaire/i.test(label)) return true;
      return false;
    };

    likeBtns.forEach(btn => {
      if (isCommentLike(btn)) return;

      const likeButton = btn as HTMLButtonElement;
      const isAlreadyLiked = likeButton.getAttribute('aria-pressed') === 'true';
      if (isAlreadyLiked) return;

      likeButton.classList.add(HIGHLIGHT_CLASS);

      likeButton.addEventListener('click', () => {
        const postId = getPostId(post);
        if (postId) {
          onAction('like', postId, 'Like', getAuthorName(post));
        }
        likeButton.classList.remove(HIGHLIGHT_CLASS);
        // Show suggestions after like
        setTimeout(() => injectSuggestions(post), 500);
      }, { once: true, capture: true });
    });

    // Also try aria-label based selectors for the main post like button
    if (likeBtns.length === 0) {
      const fallbackBtns = post.querySelectorAll('button[aria-label*="Réagir avec" i]');
      fallbackBtns.forEach(btn => {
        if (isCommentLike(btn)) return;
        const likeButton = btn as HTMLButtonElement;
        if (likeButton.getAttribute('aria-pressed') === 'true') return;
        likeButton.classList.add(HIGHLIGHT_CLASS);
        likeButton.addEventListener('click', () => {
          const postId = getPostId(post);
          if (postId) onAction('like', postId, 'Like', getAuthorName(post));
          likeButton.classList.remove(HIGHLIGHT_CLASS);
          setTimeout(() => injectSuggestions(post), 500);
        }, { once: true, capture: true });
      });
    }

    // Watch for manual comment submissions (delegated click on post)
    const handler = watchCommentSends(post);
    commentHandlers.push({ post, handler });
  }

  const observer = new MutationObserver(() => {
    if (!isRunning() || isPaused()) return;
    scan();
  });

  function scan() {
    if (!isRunning() || isPaused()) return;
    const posts = document.querySelectorAll(
      'div.feed-shared-update-v2, div.update-components-update-v2, article[data-urn]'
    );
    posts.forEach(processPost);
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
