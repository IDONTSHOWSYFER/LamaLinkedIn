// Pont d'authentification web -> extension.
// Tourne sur le site lamalinked.in : récupère le token de connexion de
// l'utilisateur et le transmet au background, qui le stocke (lbp_auth). Ainsi
// les actions LinkedIn de l'extension sont synchronisées au bon compte et le
// dashboard affiche un suivi réel et temps réel.

function syncFromStorage() {
  try {
    const token = localStorage.getItem('lbp_token');
    if (token) {
      chrome.runtime.sendMessage({ type: 'LBP_STORE_AUTH', token });
    } else {
      chrome.runtime.sendMessage({ type: 'LBP_CLEAR_AUTH' });
    }
  } catch {}
}

// État initial (utilisateur déjà connecté avant l'installation de l'extension).
syncFromStorage();

// Le web pousse explicitement le token à la connexion / déconnexion.
window.addEventListener('message', (e: MessageEvent) => {
  if (e.source !== window || !e.data || typeof e.data !== 'object') return;
  const data = e.data as { type?: string; token?: string; user?: unknown };
  if (data.type === 'LBP_AUTH' && data.token) {
    try { chrome.runtime.sendMessage({ type: 'LBP_STORE_AUTH', token: data.token, user: data.user }); } catch {}
  } else if (data.type === 'LBP_LOGOUT') {
    try { chrome.runtime.sendMessage({ type: 'LBP_CLEAR_AUTH' }); } catch {}
  }
});

// Connexion/déconnexion dans un autre onglet du même site.
window.addEventListener('storage', (e) => {
  if (e.key === 'lbp_token' || e.key === null) syncFromStorage();
});
