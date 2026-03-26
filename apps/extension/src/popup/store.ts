import { create } from 'zustand';
import type { SessionState } from '@/types';
import { AppMode, BotState, UserConfig, ActionEvent, DEFAULT_CONFIG, DEFAULT_SESSION } from '@/types';
import { getConfig, setConfig, getSession, setSession, getEvents, getInstallId } from '@/lib/storage';

type TabId = 'launch' | 'run' | 'suivi' | 'templates' | 'settings' | 'upgrade';

interface Store {
  config: UserConfig;
  session: SessionState;
  events: ActionEvent[];
  activeTab: TabId;
  installId: string;

  init: () => Promise<void>;
  setActiveTab: (tab: TabId) => void;
  updateConfig: (partial: Partial<UserConfig>) => Promise<void>;
  updateSession: (partial: Partial<SessionState>) => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshSession: () => Promise<void>;

  startBot: (mode?: AppMode) => Promise<void>;
  stopBot: () => Promise<void>;
  pauseBot: () => Promise<void>;
  resumeBot: () => Promise<void>;
  toggleMode: (mode: AppMode) => Promise<void>;
}

async function findLinkedInTab(): Promise<number | null> {
  // Try multiple URL patterns
  const patterns = [
    '*://www.linkedin.com/feed/*',
    '*://www.linkedin.com/feed',
    '*://www.linkedin.com/*',
  ];
  for (const url of patterns) {
    const tabs = await chrome.tabs.query({ url });
    if (tabs.length && tabs[0].id) return tabs[0].id;
  }
  return null;
}

async function ensureContentScript(tabId: number): Promise<boolean> {
  // Try to ping the content script
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'LBP_PING' });
    if (response?.pong) return true;
  } catch {
    // Content script not loaded - try to inject it
  }

  // Programmatically inject the content script using manifest entry
  try {
    const manifest = chrome.runtime.getManifest();
    const cs = manifest.content_scripts?.[0];
    if (cs?.js?.[0]) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: cs.js,
      });
      await new Promise(r => setTimeout(r, 800));
      return true;
    }
  } catch {
    // Last resort: reload the tab so the content script auto-injects
    try {
      await chrome.tabs.reload(tabId);
      await new Promise(r => setTimeout(r, 2500));
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export const useStore = create<Store>((set, get) => ({
  config: DEFAULT_CONFIG,
  session: DEFAULT_SESSION,
  events: [],
  activeTab: 'launch',
  installId: '',

  init: async () => {
    const [config, session, events, installId] = await Promise.all([
      getConfig(),
      getSession(),
      getEvents(),
      getInstallId(),
    ]);
    set({ config, session, events, installId });
    // If bot is running, go to run tab
    if (session.botState === 'running' || session.botState === 'paused') {
      set({ activeTab: 'run' });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  updateConfig: async (partial) => {
    const updated = await setConfig(partial);
    set({ config: updated });

    // Also update session targets so RunTab reflects changes immediately
    const sessionUpdate: Partial<SessionState> = {};
    if (partial.likesPerSession !== undefined) sessionUpdate.targetLikes = partial.likesPerSession;
    if (partial.commentsPerSession !== undefined) sessionUpdate.targetComments = partial.commentsPerSession;
    if (partial.sessionsPerDay !== undefined) sessionUpdate.sessionsTotal = partial.sessionsPerDay;
    if (partial.likesPerSession !== undefined || partial.commentsPerSession !== undefined) {
      sessionUpdate.actionsTarget = (partial.likesPerSession ?? updated.likesPerSession) + (partial.commentsPerSession ?? updated.commentsPerSession);
    }
    if (Object.keys(sessionUpdate).length > 0) {
      await setSession(sessionUpdate);
      const session = await getSession();
      set({ session });
    }

    // Notify content script
    try {
      const tabs = await chrome.tabs.query({ url: '*://www.linkedin.com/*' });
      for (const tab of tabs) {
        if (tab.id) {
          try {
            chrome.tabs.sendMessage(tab.id, { type: 'LBP_CONFIG_UPDATED', config: partial });
          } catch {}
        }
      }
    } catch {}
  },

  updateSession: async (partial) => {
    const updated = await setSession(partial);
    set({ session: updated });
  },

  refreshEvents: async () => {
    const events = await getEvents();
    set({ events });
  },

  refreshSession: async () => {
    const session = await getSession();
    set({ session });
  },

  startBot: async (mode) => {
    const { config } = get();
    const useMode = mode || config.mode;
    set({ activeTab: 'run' });

    // Find LinkedIn tab
    let tabId = await findLinkedInTab();
    if (!tabId) {
      // Open LinkedIn feed and wait
      const newTab = await chrome.tabs.create({ url: 'https://www.linkedin.com/feed/' });
      if (!newTab.id) return;
      tabId = newTab.id;
      // Wait for page to load
      await new Promise(r => setTimeout(r, 3000));
    }

    // Ensure content script is loaded
    await ensureContentScript(tabId);

    // Send start message with retry
    let sent = false;
    for (let attempt = 0; attempt < 3 && !sent; attempt++) {
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'LBP_START',
          payload: { mode: useMode, reset: true },
        });
        sent = true;
      } catch {
        // Wait and retry
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    await setSession({
      botState: 'running',
      mode: useMode,
      startedAt: Date.now(),
      targetLikes: config.likesPerSession,
      targetComments: config.commentsPerSession,
      actionsTarget: config.likesPerSession + config.commentsPerSession,
      sessionsTotal: config.sessionsPerDay,
      sessionIndex: 1,
      likesThisSession: 0,
      commentsThisSession: 0,
      actionsDone: 0,
    });
    const session = await getSession();
    set({ session });
  },

  stopBot: async () => {
    const tabs = await chrome.tabs.query({ url: '*://www.linkedin.com/*' });
    for (const tab of tabs) {
      if (tab.id) {
        try { chrome.tabs.sendMessage(tab.id, { type: 'LBP_HARD_STOP' }); } catch {}
      }
    }
    await setSession({ botState: 'idle', startedAt: null, elapsedSeconds: 0 });
    const session = await getSession();
    set({ session });
  },

  pauseBot: async () => {
    const tabs = await chrome.tabs.query({ url: '*://www.linkedin.com/*' });
    for (const tab of tabs) {
      if (tab.id) {
        try { chrome.tabs.sendMessage(tab.id, { type: 'LBP_PAUSE' }); } catch {}
      }
    }
    await setSession({ botState: 'paused' });
    set({ session: { ...get().session, botState: 'paused' } });
  },

  resumeBot: async () => {
    const tabs = await chrome.tabs.query({ url: '*://www.linkedin.com/*' });
    for (const tab of tabs) {
      if (tab.id) {
        try { chrome.tabs.sendMessage(tab.id, { type: 'LBP_RESUME' }); } catch {}
      }
    }
    await setSession({ botState: 'running' });
    set({ session: { ...get().session, botState: 'running' } });
  },

  toggleMode: async (mode) => {
    await setConfig({ mode });
    set({ config: { ...get().config, mode } });
    // Notify content script
    const tabs = await chrome.tabs.query({ url: '*://www.linkedin.com/*' });
    for (const tab of tabs) {
      if (tab.id) {
        try { chrome.tabs.sendMessage(tab.id, { type: 'LBP_MODE_CHANGED', mode }); } catch {}
      }
    }
  },
}));
