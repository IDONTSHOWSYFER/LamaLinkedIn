chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#0A66C2' });
  chrome.action.setBadgeText({ text: '' });
  chrome.storage.local.set({ lbp_session: { botState: 'idle' } });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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
    // Async work (storage read + fetch) : on renvoie `true` pour dire à Chrome
    // de garder le service worker vivant jusqu'à sendResponse, sinon il peut
    // être tué en plein milieu et l'événement part dans le vide, en silence.
    (async () => {
      try {
        let result = await chrome.storage.local.get(['lbp_auth', 'lbp_api_url']);
        let auth = result.lbp_auth;
        // Le service worker peut se réveiller avec un lot de messages en
        // attente (auth-bridge) pas encore tous traités : on laisse plusieurs
        // chances à un LBP_STORE_AUTH "en vol" d'atterrir avant d'abandonner,
        // plutôt que de perdre l'événement pour un pur souci d'ordre d'arrivée.
        for (let i = 0; !auth?.token && i < 5; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          result = await chrome.storage.local.get(['lbp_auth', 'lbp_api_url']);
          auth = result.lbp_auth;
        }
        if (!auth?.token) {
          console.warn('[Lama] LBP_ACTION_LOGGED dropped: no auth token in storage (after retries)');
        } else {
          const apiUrl = result.lbp_api_url || 'https://lama-api-l09j.onrender.com';
          const res = await fetch(`${apiUrl}/api/events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${auth.token}`,
            },
            body: JSON.stringify(msg.event),
          });
          if (!res.ok) {
            console.error('[Lama] POST /api/events failed:', res.status, await res.text().catch(() => ''));
          }
        }
      } catch (err) {
        // Réseau ou API indisponible : on ne bloque jamais l'utilisateur pour ça,
        // mais on trace l'erreur pour le debug.
        console.error('[Lama] POST /api/events threw:', err);
      } finally {
        sendResponse({ ok: true });
      }
    })();
    return true;
  }

  // Pont d'auth : le site web transmet le token de connexion, on le stocke pour
  // que les actions soient synchronisées au compte (suivi temps réel du dashboard).
  // Même piège que LBP_ACTION_LOGGED : storage.set() est async, donc on garde le
  // service worker vivant avec `return true` jusqu'à ce que l'écriture soit faite.
  if (msg?.type === 'LBP_STORE_AUTH' && msg.token) {
    (async () => {
      await chrome.storage.local.set({ lbp_auth: { token: msg.token, user: msg.user } });
      sendResponse({ ok: true });
    })();
    return true;
  }
  if (msg?.type === 'LBP_CLEAR_AUTH') {
    (async () => {
      await chrome.storage.local.remove('lbp_auth');
      sendResponse({ ok: true });
    })();
    return true;
  }
  return undefined;
});

// Keep service worker alive during bot sessions
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Ping to keep alive
  }
});
