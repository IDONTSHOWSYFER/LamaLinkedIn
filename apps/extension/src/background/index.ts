chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#0A66C2' });
  chrome.action.setBadgeText({ text: '' });
  chrome.storage.local.set({ lbp_session: { botState: 'idle' } });
});

chrome.runtime.onMessage.addListener((msg, _sender) => {
  if (msg?.type === 'LBP_NOTIFY') {
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('src/assets/icons/128.png'),
        title: msg.title || 'Lama Linked.In',
        message: msg.message || '',
        silent: msg.silent !== false,
      });
    } catch {}
  }

  if (msg?.type === 'LBP_BADGE') {
    try {
      chrome.action.setBadgeBackgroundColor({ color: msg.color || '#0A66C2' });
      chrome.action.setBadgeText({ text: msg.text || '' });
    } catch {}
  }

  if (msg?.type === 'LBP_ACTION_LOGGED') {
    // Sync to API if user is authenticated
    chrome.storage.local.get(['lbp_auth', 'lbp_api_url'], (result) => {
      const auth = result.lbp_auth;
      if (auth?.token) {
        const apiUrl = result.lbp_api_url || 'https://lama-api-l09j.onrender.com';
        fetch(`${apiUrl}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`,
          },
          body: JSON.stringify(msg.event),
        }).catch(() => {});
      }
    });
  }

  // Pont d'auth : le site web transmet le token de connexion, on le stocke pour
  // que les actions soient synchronisées au compte (suivi temps réel du dashboard).
  if (msg?.type === 'LBP_STORE_AUTH' && msg.token) {
    chrome.storage.local.set({ lbp_auth: { token: msg.token, user: msg.user } });
  }
  if (msg?.type === 'LBP_CLEAR_AUTH') {
    chrome.storage.local.remove('lbp_auth');
  }
});

// Keep service worker alive during bot sessions
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Ping to keep alive
  }
});
