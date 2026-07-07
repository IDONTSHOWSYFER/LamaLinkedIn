// Pont d'authentification web -> extension.
// Tourne sur le site lamalinked.in : récupère le token de connexion de
// l'utilisateur et le transmet au background, qui le stocke (lbp_auth). Ainsi
// les actions LinkedIn de l'extension sont synchronisées au bon compte et le
// dashboard affiche un suivi réel et temps réel.
import { safeSendMessage } from './context';

// Seules ces origines peuvent pousser un token : un postMessage same-origin
// non filtré permettrait à n'importe quel script de la page (pub tierce, XSS)
// de forger un LBP_AUTH et de se faire passer pour l'utilisateur.
const TRUSTED_ORIGINS = new Set([
  'https://lamalinked.in',
  'https://www.lamalinked.in',
  'https://lama-linked-in-web.vercel.app',
]);

function syncFromStorage() {
  try {
    const token = localStorage.getItem('lbp_token');
    if (token) {
      safeSendMessage({ type: 'LBP_STORE_AUTH', token });
    } else {
      safeSendMessage({ type: 'LBP_CLEAR_AUTH' });
    }
  } catch {}
}

// État initial (utilisateur déjà connecté avant l'installation de l'extension).
syncFromStorage();

// Le web pousse explicitement le token à la connexion / déconnexion.
window.addEventListener('message', (e: MessageEvent) => {
  if (e.source !== window || !TRUSTED_ORIGINS.has(e.origin) || !e.data || typeof e.data !== 'object') return;
  const data = e.data as { type?: string; token?: string; user?: unknown };
  if (data.type === 'LBP_AUTH' && data.token) {
    safeSendMessage({ type: 'LBP_STORE_AUTH', token: data.token, user: data.user });
  } else if (data.type === 'LBP_LOGOUT') {
    safeSendMessage({ type: 'LBP_CLEAR_AUTH' });
  }
});

// Connexion/déconnexion dans un autre onglet du même site.
window.addEventListener('storage', (e) => {
  if (e.key === 'lbp_token' || e.key === null) syncFromStorage();
});
