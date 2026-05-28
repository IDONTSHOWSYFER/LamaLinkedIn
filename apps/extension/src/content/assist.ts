import { UserConfig } from '@/types';
import {
  getAllPosts as findAllPosts,
  findPostContainer,
  findLikeButton,
  isLiked as isAlreadyLiked,
  findCommentButton,
  findEditor,
  findSendButton,
  getPostId,
  getAuthorName,
} from './linkedin';

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
    const sel = window.getSelection();
    if (sel) { sel.selectAllChildren(ed); sel.deleteFromDocument(); }

    if (ed.classList.contains('ql-editor')) {
      document.execCommand('insertText', false, text);
      if (!ed.textContent?.trim()) {
        ed.textContent = text;
        ed.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      const dt = new DataTransfer();
      dt.setData('text/plain', text);
      ed.dispatchEvent(new ClipboardEvent('paste', {
        clipboardData: dt, bubbles: true, cancelable: true,
      }));
    }
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

    // Ember: insert after the comment form
    const commentForm = post.querySelector('form.comments-comment-box__form');
    if (commentForm) {
      commentForm.parentElement?.insertBefore(bar, commentForm.nextSibling);
      return;
    }

    // Ember: insert after the comment box wrapper
    const commentBox = post.querySelector('.comments-comment-box, .comments-comment-box--cr');
    if (commentBox) {
      commentBox.parentElement?.insertBefore(bar, commentBox.nextSibling);
      return;
    }

    // React: insert after componentkey-based submit section
    const submitSection = post.querySelector('div[componentkey*="commentButtonSection" i]');
    if (submitSection) {
      submitSection.parentElement?.insertBefore(bar, submitSection.nextSibling);
      return;
    }

    // React: insert after componentkey-based comment box
    const reactBox = post.querySelector('[componentkey*="commentBox" i]');
    if (reactBox) {
      const wrapper = reactBox.closest('[data-testid="ui-core-tiptap-text-editor-wrapper"]')?.parentElement
        || reactBox.parentElement;
      if (wrapper?.parentElement) {
        wrapper.parentElement.insertBefore(bar, wrapper.nextSibling);
        return;
      }
    }

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
