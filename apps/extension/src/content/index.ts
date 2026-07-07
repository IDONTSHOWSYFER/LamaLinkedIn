import { getConfig, getSession, setSession, logEvent, addVisitedId, getVisitedIds, clearVisitedIds } from '@/lib/storage';
import { AppMode, ActionEvent, SessionState, UserConfig } from '@/types';
import { assistMode } from './assist';
import { agentMode } from './agent';
import { injectPanel, updatePanel, updatePanelTimer, updatePanelStatus, removePanel } from './panel';
import { log, error } from '@/lib/log';
import { contextAlive, registerTeardown, safeSendMessage } from './context';

// Chrome peut injecter ce script deux fois (auto-injection du manifest +
// executeScript depuis le popup). On reste inerte au second passage pour ne
// jamais enregistrer de listener en double ni peindre un second panneau.
const __lbpWin = window as unknown as { __lbpInjected?: boolean };
const alreadyInjected = __lbpWin.__lbpInjected === true;
__lbpWin.__lbpInjected = true;

log('Content script loaded on', window.location.href);

let running = false;
let paused = false;
let currentMode: AppMode = 'assist';
let currentConfig: UserConfig | null = null;
let assistCleanup: (() => void) | null = null;
let agentCleanup: (() => void) | null = null;
let sessionTimerHandle: number | null = null;
let watchdogTeardown: (() => void) | null = null;

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

    // If Chrome tears down our context mid-session, stop cleanly instead of
    // leaving the panel/timer running against a dead extension.
    if (watchdogTeardown) watchdogTeardown();
    watchdogTeardown = registerTeardown(() => {
      running = false;
      paused = false;
      if (sessionTimerHandle) { clearTimeout(sessionTimerHandle); sessionTimerHandle = null; }
      if (assistCleanup) { assistCleanup(); assistCleanup = null; }
      if (agentCleanup) { agentCleanup(); agentCleanup = null; }
      removePanel();
    });

    try {
      chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: 'ON', color: mode === 'agent' ? '#F4B183' : '#0A66C2' });
      chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: `${mode === 'agent' ? 'Agent' : 'Assisté'} démarré`, silent: true });
    } catch {}

    startSessionTimer(config);

    if (mode === 'assist') {
      assistCleanup = assistMode(config, () => running, () => paused, onAction);
    } else {
      agentCleanup = await agentMode(config, () => running, () => paused, onAction);
    }
  } catch (err) {
    error('Failed to start:', err);
    running = false;
  }
}

function startSessionTimer(config: UserConfig) {
  if (sessionTimerHandle) clearTimeout(sessionTimerHandle);

  const durationMs = config.sessionDurationMin * 60 * 1000;
  sessionTimerHandle = window.setTimeout(async () => {
    if (!running || !contextAlive()) return;

    const session = await getSession();
    const nextIndex = (session.sessionIndex || 1) + 1;
    // Assisté is always a single, manual session — no pause/resume cycling.
    const total = currentMode === 'assist' ? 1 : config.sessionsPerDay;

    if (nextIndex <= total) {
      try {
        chrome.runtime.sendMessage({ type: 'LBP_NOTIFY', title: 'Lama Linked.In', message: `Session ${session.sessionIndex}/${total} terminée. Pause de ${config.pauseDurationMin} min...` });
      } catch {}

      if (assistCleanup) { assistCleanup(); assistCleanup = null; }
      if (agentCleanup) { agentCleanup(); agentCleanup = null; }

      paused = true;
      await setSession({ botState: 'paused' });
      updatePanelStatus(`Pause... Session ${nextIndex}/${total} dans ${config.pauseDurationMin} min`);
      try { chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: '||', color: '#F59E0B' }); } catch {}

      if (config.refreshAfterSession) {
        await setSession({ botState: 'running', sessionIndex: nextIndex });
        window.location.reload();
        return;
      }

      const pauseMs = config.pauseDurationMin * 60 * 1000;
      window.setTimeout(async () => {
        if (!running || !contextAlive()) return;
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

  safeSendMessage({ type: 'LBP_ACTION_LOGGED', event });
}

function stop() {
  running = false;
  paused = false;
  if (watchdogTeardown) { watchdogTeardown(); watchdogTeardown = null; }
  if (sessionTimerHandle) { clearTimeout(sessionTimerHandle); sessionTimerHandle = null; }
  if (assistCleanup) { assistCleanup(); assistCleanup = null; }
  if (agentCleanup) { agentCleanup(); agentCleanup = null; }
  removePanel();
  setSession({ botState: 'idle', startedAt: null });
  try { chrome.runtime.sendMessage({ type: 'LBP_BADGE', text: '', color: '#0A66C2' }); } catch {}
}

if (!alreadyInjected) chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'LBP_START') {
    start(msg.payload.mode, msg.payload.reset !== false).then(() => {
      sendResponse({ ok: true });
    }).catch((err) => {
      error('start error:', err);
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
    getConfig().then(c => { currentConfig = c; });
    sendResponse({ ok: true });
  }
  return false;
});

if (!alreadyInjected) (async () => {
  const session = await getSession();
  if (session.botState === 'running' && session.startedAt) {
    const config = await getConfig();
    await start(session.mode || config.mode, false);
  }
})();
