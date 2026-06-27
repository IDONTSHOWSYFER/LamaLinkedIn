import { UserConfig } from '@/types';
import { registerTeardown } from './context';
import {
  findAllPosts,
  findPostContainer,
  findLikeButton,
  isAlreadyLiked,
  findCommentButton,
  findEditor,
  getPostId,
  getAuthorName,
  isLikeButtonEl,
  isCommentOpenButtonEl,
  isSendButtonEl,
  recordSelectorHealth,
} from './selectors';

type ActionCallback = (type: 'like' | 'comment', postId: string, content: string, authorName: string) => void;

const SUGGESTIONS = [
  'Merci pour ce partage inspirant !',
  "Excellent point de vue, je suis d'accord.",
  'Super contenu, bravo !',
  'Belle analyse, merci pour la valeur ajoutée.',
  'Très pertinent, merci du partage !',
  "J'adore cette approche !",
  'Contenu de qualité comme d\'habitude !',
  'Merci pour cette perspective enrichissante.',
];

export function assistMode(
  _config: UserConfig,
  isRunning: () => boolean,
  isPaused: () => boolean,
  onAction: ActionCallback
): () => void {
  const HIGHLIGHT_CLASS = 'lbp-highlight';
  const SUGGESTION_CLASS = 'lbp-suggestion-bar';
  const SUGGESTION_DONE_ATTR = 'data-lbp-suggested';

  const style = document.createElement('style');
  style.id = 'lbp-assist-styles';
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      position: relative !important;
      border-radius: 8px !important;
      box-shadow: 0 0 0 2px rgba(10, 102, 194, 0.9), 0 0 10px 2px rgba(10, 102, 194, 0.45) !important;
      animation: lbp-pulse 1.6s ease-in-out infinite !important;
    }
    @keyframes lbp-pulse {
      0%, 100% { box-shadow: 0 0 0 2px rgba(10, 102, 194, 0.9), 0 0 10px 2px rgba(10, 102, 194, 0.35); }
      50% { box-shadow: 0 0 0 3px rgba(55, 143, 233, 1), 0 0 16px 4px rgba(55, 143, 233, 0.55); }
    }
    .${SUGGESTION_CLASS} {
      display: block;
      width: 100%;
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

    // Sélectionne tout l'existant (y compris le placeholder vide) pour que
    // l'insertion le remplace.
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ed);
    if (sel) { sel.removeAllRanges(); sel.addRange(range); }

    const landed = () => (ed.textContent || '').includes(text.slice(0, 10));

    // 1) execCommand insertText : déclenche les évènements beforeinput/input que
    //    Quill ET tiptap/ProseMirror écoutent — la méthode la plus fiable et qui
    //    met à jour l'état interne de l'éditeur (le bouton « Commenter » s'active).
    try { document.execCommand('insertText', false, text); } catch {}

    // 2) Paste synthétique : certains builds ProseMirror n'acceptent le texte
    //    que via un évènement paste.
    if (!landed()) {
      try {
        const dt = new DataTransfer();
        dt.setData('text/plain', text);
        ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
      } catch {}
    }

    // 3) beforeinput/input insertText : dernière tentative structurée.
    if (!landed()) {
      try {
        ed.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertText', data: text, bubbles: true, cancelable: true }));
        ed.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: text, bubbles: true }));
      } catch {}
    }

    // 4) Repli brut : écrit le texte et retire le placeholder, puis notifie.
    if (!landed()) {
      const p = ed.querySelector('p');
      if (p) {
        p.textContent = text;
        p.classList.remove('is-empty', 'is-editor-empty');
      } else {
        ed.textContent = text;
      }
      ed.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: text, bubbles: true }));
    }
    ed.focus();
  }

  function buildSuggestionChips(post: Element, bar: HTMLElement) {
    const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 4);
    const list = bar.querySelector('.lbp-suggestion-list')!;
    list.innerHTML = '';
    shuffled.forEach((s) => {
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
    if (post.querySelector(`.${SUGGESTION_CLASS}`)) return;

    const bar = document.createElement('div');
    bar.className = SUGGESTION_CLASS;
    bar.innerHTML = `
      <div class="lbp-suggestion-header">
        <span class="lbp-suggestion-title">✨ Suggestions</span>
        <button class="lbp-regen-btn">↻ Autres</button>
      </div>
      <div class="lbp-suggestion-list"></div>
    `;
    buildSuggestionChips(post, bar);
    bar.querySelector('.lbp-regen-btn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      buildSuggestionChips(post, bar);
    });

    bar.style.display = 'block';
    bar.style.width = '100%';
    bar.style.clear = 'both';

    // React/tiptap renderer : la boîte de SAISIE est un cadre bordé (style
    // inline `border-color`) qui englobe l'éditeur + la toolbar + « Commenter ».
    // On insère la barre APRÈS ce cadre → elle tombe sous tout, jamais coincée
    // dans l'éditeur ni par-dessus le bouton d'envoi.
    const tiptap = post.querySelector('[data-testid="ui-core-tiptap-text-editor-wrapper"]');
    if (tiptap) {
      const frame =
        tiptap.closest('div[style*="border-color"]') ||
        tiptap.closest('[componentkey^="commentBox" i]') ||
        tiptap.parentElement;
      if (frame) {
        frame.insertAdjacentElement('afterend', bar);
        return;
      }
    }

    // Ember renderer : on ancre sur la boîte de commentaire externe.
    const commentBox = post.querySelector('.comments-comment-box--cr, .comments-comment-box, form.comments-comment-box__form');
    if (commentBox) {
      commentBox.insertAdjacentElement('afterend', bar);
      return;
    }

    post.appendChild(bar);
  }

  // Delegated click handling (survives LinkedIn React re-renders): a single
  // capture-phase listener sees every click before LinkedIn does, so we can
  // attribute likes/comments to the right post even when the button elements
  // are swapped out from under us on re-render.
  function onDocClick(e: Event) {
   try {
    if (!isRunning() || isPaused()) return;
    const target = e.target as Element | null;
    const btn = target?.closest?.('button');
    if (!btn) return;
    const post = findPostContainer(btn);
    if (!post) return;

    // Order matters: submit is the most specific, then the comment-open
    // button, then the like toggle (least specific text match).
    if (isSendButtonEl(btn)) {
      const ed = findEditor(post);
      const commentText = ed?.textContent?.trim() || '';
      if (commentText && commentText !== 'Ajouter un commentaire…') {
        onAction('comment', getPostId(post), commentText, getAuthorName(post));
      }
      return;
    }

    if (isCommentOpenButtonEl(btn)) {
      // The editor mounts asynchronously — show templates once it's there.
      setTimeout(() => injectSuggestions(post), 600);
      return;
    }

    if (isLikeButtonEl(btn)) {
      const likeBtn = btn as HTMLButtonElement;
      // Capture phase = pre-toggle state. "Not liked yet" means this click likes.
      if (!isAlreadyLiked(likeBtn)) {
        onAction('like', getPostId(post), 'Like', getAuthorName(post));
        likeBtn.classList.remove(HIGHLIGHT_CLASS);
        const commentBtn = findCommentButton(post);
        if (commentBtn) commentBtn.click();
        setTimeout(() => injectSuggestions(post), 800);
      } else {
        likeBtn.classList.remove(HIGHLIGHT_CLASS);
      }
    }
   } catch { /* jamais remonter au reporter d'erreurs global de LinkedIn */ }
  }

  document.addEventListener('click', onDocClick, true);

  function refreshHighlights() {
   try {
    if (!isRunning() || isPaused()) return;
    const posts = findAllPosts();
    recordSelectorHealth(posts);
    for (const post of posts) {
      const likeBtn = findLikeButton(post);
      if (!likeBtn) continue;
      if (isAlreadyLiked(likeBtn)) {
        likeBtn.classList.remove(HIGHLIGHT_CLASS);
      } else if (!likeBtn.classList.contains(HIGHLIGHT_CLASS)) {
        likeBtn.classList.add(HIGHLIGHT_CLASS);
      }
      // If a comment editor is open in this post, surface templates under it.
      if (!post.hasAttribute(SUGGESTION_DONE_ATTR)) {
        const ed = findEditor(post);
        if (ed) {
          post.setAttribute(SUGGESTION_DONE_ATTR, '1');
          injectSuggestions(post);
        }
      }
    }
   } catch { /* jamais remonter au reporter d'erreurs global de LinkedIn */ }
  }

  const observer = new MutationObserver(() => refreshHighlights());
  observer.observe(document.body, { childList: true, subtree: true });
  refreshHighlights();
  const intervalId = window.setInterval(refreshHighlights, 2000);

  const teardown = () => {
    clearInterval(intervalId);
    observer.disconnect();
    document.removeEventListener('click', onDocClick, true);
    style.remove();
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
    document.querySelectorAll(`.${SUGGESTION_CLASS}`).forEach((el) => el.remove());
    document.querySelectorAll(`[${SUGGESTION_DONE_ATTR}]`).forEach((el) => el.removeAttribute(SUGGESTION_DONE_ATTR));
  };

  const unregister = registerTeardown(teardown);
  return () => {
    unregister();
    teardown();
  };
}
