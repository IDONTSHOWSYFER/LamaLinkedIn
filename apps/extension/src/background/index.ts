chrome.runtime.onInstalled.addListener(() => {
  console.log('Lama Linked.In v3.0.0 installed');
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
        const apiUrl = result.lbp_api_url || 'https://api.lamalinked.in';
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
});

// Keep service worker alive during bot sessions
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Ping to keep alive
  }
});
