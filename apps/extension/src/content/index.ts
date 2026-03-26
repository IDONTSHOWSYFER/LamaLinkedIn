import { getConfig, getSession, setSession, logEvent, addVisitedId, getVisitedIds, clearVisitedIds } from '@/lib/storage';
import { AppMode, ActionEvent, SessionState, UserConfig } from '@/types';
import { assistMode } from './assist';
import { agentMode } from './agent';
import { injectPanel, updatePanel, updatePanelTimer, updatePanelStatus, removePanel } from './panel';

console.log('[Lama Linked.In] Content script loaded on', window.location.href);

let running = false;
let paused = false;
let currentMode: AppMode = 'assist';
let currentConfig: UserConfig | null = null;
let assistCleanup: (() => void) | null = null;
let agentCleanup: (() => void) | null = null;
let sessionTimerHandle: number | null = null;

async function start(mode: AppMode, reset: boolean) {
  if (running) return;

  try {
    const config = await getConfig();
    currentConfig = config;
    currentMode = mode;
    running = true;
    paused = false;

    if (reset) {
      await clearVisitedIds();
    }

    const sessionUpdate: Partial<SessionState> = {
      botState: 'running',
      mode,
      startedAt: Date.now(),
      likesThisSession: 0,
      commentsThisSession: 0,
      actionsDone: 0,
      targetLikes: config.likesPerSession,
      targetComments: config.commentsPerSession,
      actionsTarget: config.likesPerSession + config.commentsPerSession,
      sessionIndex: 1,
      sessionsTotal: config.sessionsPerDay,
    };

    await setSession(sessionUpdate);
    injectPanel(mode, config.sessionDurationMin, stop);

    try {
      chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: 'ON', color: mode === 'agent' ? '#F4B183' : '#0A66C2' });
      chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: `${mode === 'agent' ? 'Agent' : 'Assisté'} démarré`, silent: true });
    } catch {}

    // Start session timer - auto-stop when duration expires
    startSessionTimer(config);

    if (mode === 'assist') {
      assistCleanup = assistMode(config, () => running, () => paused, onAction);
    } else {
      agentCleanup = await agentMode(config, () => running, () => paused, onAction);
    }
  } catch (err) {
    console.error('[Lama] Failed to start:', err);
    running = false;
  }
}

function startSessionTimer(config: UserConfig) {
  if (sessionTimerHandle) clearTimeout(sessionTimerHandle);

  const durationMs = config.sessionDurationMin * 60 * 1000;
  sessionTimerHandle = window.setTimeout(async () => {
    if (!running) return;

    const session = await getSession();
    const nextIndex = (session.sessionIndex || 1) + 1;
    const total = config.sessionsPerDay;

    if (nextIndex <= total) {
      // Pause between sessions
      try {
        chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: `Session ${session.sessionIndex}/${total} terminée. Pause de ${config.pauseDurationMin} min...` });
      } catch {}

      // Stop current mode
      if (assistCleanup) { assistCleanup(); assistCleanup = null; }
      if (agentCleanup) { agentCleanup(); agentCleanup = null; }

      paused = true;
      await setSession({ botState: 'paused' });
      updatePanelStatus(`Pause... Session ${nextIndex}/${total} dans ${config.pauseDurationMin} min`);
      try { chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: '||', color: '#F59E0B' }); } catch {}

      // Refresh page between sessions if configured
      if (config.refreshAfterSession) {
        await setSession({ botState: 'running', sessionIndex: nextIndex });
        window.location.reload();
        return;
      }

      // Wait for pause duration then start next session
      const pauseMs = config.pauseDurationMin * 60 * 1000;
      window.setTimeout(async () => {
        if (!running) return;
        paused = false;

        await setSession({
          botState: 'running',
          sessionIndex: nextIndex,
          startedAt: Date.now(),
          likesThisSession: 0,
          commentsThisSession: 0,
          actionsDone: 0,
        });

        updatePanelTimer(Date.now(), config.sessionDurationMin);
        try {
          chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: 'ON', color: currentMode === 'agent' ? '#F4B183' : '#0A66C2' });
          chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: `Session ${nextIndex}/${total} démarrée !`, silent: true });
        } catch {}

        startSessionTimer(config);

        if (currentMode === 'assist') {
          assistCleanup = assistMode(config, () => running, () => paused, onAction);
        } else {
          agentCleanup = await agentMode(config, () => running, () => paused, onAction);
        }
      }, pauseMs);
    } else {
      // All sessions done
      try {
        chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: `Toutes les sessions terminées (${total}/${total}) !` });
      } catch {}
      stop();
    }
  }, durationMs);
}

async function onAction(type: 'like' | 'comment', postId: string, content: string, authorName: string) {
  const session = await getSession();
  const event: ActionEvent = {
    id: crypto.randomUUID(),
    type,
    postId,
    authorName,
    authorTag: 'Réseau',
    content: content.slice(0, 200),
    timestamp: Date.now(),
    mode: currentMode,
  };

  await logEvent(event);

  const update: Partial<SessionState> = {
    actionsDone: session.actionsDone + 1,
  };

  if (type === 'like') {
    update.likesThisSession = session.likesThisSession + 1;
    update.dailyLikes = session.dailyLikes + 1;
  } else {
    update.commentsThisSession = session.commentsThisSession + 1;
    update.dailyComments = session.dailyComments + 1;
  }

  await setSession(update);
  const updated = await getSession();
  updatePanel(updated, currentMode);

  // Sync to API in background (non-blocking)
  try {
    chrome.runtime.sendMessage({ type: 'LBP_ACTION_LOGGED', event });
  } catch {}
}

function stop() {
  running = false;
  paused = false;
  if (sessionTimerHandle) { clearTimeout(sessionTimerHandle); sessionTimerHandle = null; }
  if (assistCleanup) { assistCleanup(); assistCleanup = null; }
  if (agentCleanup) { agentCleanup(); agentCleanup = null; }
  removePanel();
  setSession({ botState: 'idle', startedAt: null });
  try { chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: '', color: '#0A66C2' }); } catch {}
}

// Message listener
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'LBP_START') {
    start(msg.payload.mode, msg.payload.reset !== false).then(() => {
      sendResponse({ ok: true });
    }).catch((err) => {
      console.error('[Lama] start error:', err);
      sendResponse({ ok: false, error: String(err) });
    });
    return true; // async response
  } else if (msg.type === 'LBP_STOP' || msg.type === 'LBP_HARD_STOP') {
    stop();
    sendResponse({ ok: true });
  } else if (msg.type === 'LBP_PAUSE') {
    paused = true;
    setSession({ botState: 'paused' });
    try { chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: '||', color: '#F59E0B' }); } catch {}
    sendResponse({ ok: true });
  } else if (msg.type === 'LBP_RESUME') {
    paused = false;
    setSession({ botState: 'running' });
    try { chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: 'ON', color: currentMode === 'agent' ? '#F4B183' : '#0A66C2' }); } catch {}
    sendResponse({ ok: true });
  } else if (msg.type === 'LBP_PING') {
    sendResponse({ pong: true, running });
  } else if (msg.type === 'LBP_QUERY') {
    getSession().then(s => sendResponse({ ...s, running }));
    return true;
  } else if (msg.type === 'LBP_MODE_CHANGED') {
    currentMode = msg.mode;
    if (running) {
      stop();
      setTimeout(() => start(msg.mode, false), 500);
    }
    sendResponse({ ok: true });
  } else if (msg.type === 'LBP_CONFIG_UPDATED') {
    // Update targets in the session so RunTab reflects changes
    const cfg = msg.config as Partial<UserConfig>;
    const sessionUpdate: Partial<SessionState> = {};
    if (cfg.likesPerSession !== undefined) sessionUpdate.targetLikes = cfg.likesPerSession;
    if (cfg.commentsPerSession !== undefined) sessionUpdate.targetComments = cfg.commentsPerSession;
    if (cfg.likesPerSession !== undefined || cfg.commentsPerSession !== undefined) {
      const likes = cfg.likesPerSession ?? currentConfig?.likesPerSession ?? 20;
      const comments = cfg.commentsPerSession ?? currentConfig?.commentsPerSession ?? 3;
      sessionUpdate.actionsTarget = likes + comments;
    }
    if (cfg.sessionsPerDay !== undefined) sessionUpdate.sessionsTotal = cfg.sessionsPerDay;
    if (Object.keys(sessionUpdate).length > 0) {
      setSession(sessionUpdate);
    }
    // Reload config for next use
    getConfig().then(c => { currentConfig = c; });
    sendResponse({ ok: true });
  }
  return false;
});

// Auto-start check on page load
(async () => {
  const session = await getSession();
  if (session.botState === 'running' && session.startedAt) {
    const config = await getConfig();
    await start(session.mode || config.mode, false);
  }
})();
