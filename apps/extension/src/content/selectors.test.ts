import { describe, it, expect, vi, beforeEach } from 'vitest';

// On isole les dépendances (contexte runtime, logs, storage) pour tester
// la logique pure de résilience des sélecteurs DOM — le cœur qui absorbe
// les changements de rendu de LinkedIn (Ember legacy vs React/ProseMirror).
vi.mock('./context', () => ({ safeSendMessage: vi.fn() }));
vi.mock('@/lib/log', () => ({ warn: vi.fn(), log: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/lib/storage', () => ({ setSelectorAlert: vi.fn() }));

import { hasLikeButton, findPostContainer, isInsideCommentSection } from './selectors';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('selectors — résilience DOM LinkedIn', () => {
  it("détecte un bouton J'aime quel que soit le libellé (aria-label)", () => {
    const post = document.createElement('div');
    post.innerHTML = '<button aria-label="Réagir avec J’aime">👍</button>';
    expect(hasLikeButton(post)).toBe(true);
  });

  it('ne prend pas un bouton non pertinent pour un like', () => {
    const post = document.createElement('div');
    post.innerHTML = '<button aria-label="Répondre">Reply</button>';
    expect(hasLikeButton(post)).toBe(false);
  });

  it('retrouve le conteneur de post en rendu legacy (feed-shared-update-v2)', () => {
    document.body.innerHTML =
      '<div class="feed-shared-update-v2"><span id="inner">post</span></div>';
    const inner = document.getElementById('inner') as Element;
    expect(findPostContainer(inner)).not.toBeNull();
  });

  it('retrouve le conteneur de post en rendu React (role="listitem")', () => {
    document.body.innerHTML = '<div role="listitem"><span id="i2">post</span></div>';
    const inner = document.getElementById('i2') as Element;
    expect(findPostContainer(inner)).not.toBeNull();
  });

  it("identifie la zone de commentaires pour éviter d'agir dessus", () => {
    document.body.innerHTML =
      '<div class="comments-comment-entity"><button id="c">x</button></div>';
    expect(isInsideCommentSection(document.getElementById('c') as Element)).toBe(true);

    document.body.innerHTML =
      '<div class="feed-shared-update-v2"><button id="n">x</button></div>';
    expect(isInsideCommentSection(document.getElementById('n') as Element)).toBe(false);
  });
});
