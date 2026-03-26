import { UserConfig, SessionState, ActionEvent, DEFAULT_CONFIG, DEFAULT_SESSION } from '@/types';

const STORAGE_KEYS = {
  config: 'lbp_config',
  session: 'lbp_session',
  events: 'lbp_events',
  auth: 'lbp_auth',
  visitedIds: 'lbp_visitedIds',
  installId: 'lbp_installId',
} as const;

export async function getConfig(): Promise<UserConfig> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.config);
  return { ...DEFAULT_CONFIG, ...(result[STORAGE_KEYS.config] || {}) };
}

export async function setConfig(partial: Partial<UserConfig>): Promise<UserConfig> {
  const current = await getConfig();
  const updated = { ...current, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEYS.config]: updated });
  return updated;
}

export async function getSession(): Promise<SessionState> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.session);
  const session = { ...DEFAULT_SESSION, ...(result[STORAGE_KEYS.session] || {}) };
  // Reset daily counters if past reset time
  if (Date.now() >= session.dailyResetAt) {
    session.dailyLikes = 0;
    session.dailyComments = 0;
    session.dailyResetAt = Date.now() + 24 * 60 * 60 * 1000;
  }
  return session;
}

export async function setSession(partial: Partial<SessionState>): Promise<SessionState> {
  const current = await getSession();
  const updated = { ...current, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEYS.session]: updated });
  return updated;
}

export async function logEvent(event: ActionEvent): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.events);
  const events: ActionEvent[] = result[STORAGE_KEYS.events] || [];
  events.unshift(event);
  // Keep last 500 events
  if (events.length > 500) events.length = 500;
  await chrome.storage.local.set({ [STORAGE_KEYS.events]: events });
}

export async function getEvents(limit = 50): Promise<ActionEvent[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.events);
  const events: ActionEvent[] = result[STORAGE_KEYS.events] || [];
  return events.slice(0, limit);
}

export async function getVisitedIds(): Promise<Set<string>> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.visitedIds);
  return new Set(result[STORAGE_KEYS.visitedIds] || []);
}

export async function addVisitedId(id: string): Promise<void> {
  const visited = await getVisitedIds();
  visited.add(id);
  // Keep last 1000
  const arr = Array.from(visited);
  if (arr.length > 1000) arr.splice(0, arr.length - 1000);
  await chrome.storage.local.set({ [STORAGE_KEYS.visitedIds]: arr });
}

export async function clearVisitedIds(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.visitedIds]: [] });
}

export async function getInstallId(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.installId);
  if (result[STORAGE_KEYS.installId]) return result[STORAGE_KEYS.installId];
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [STORAGE_KEYS.installId]: id });
  return id;
}

export async function getAuth(): Promise<any | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.auth);
  return result[STORAGE_KEYS.auth] || null;
}

export async function setAuth(auth: any): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.auth]: auth });
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.auth);
}
