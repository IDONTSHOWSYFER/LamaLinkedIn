export type AppMode = 'assist' | 'agent';
export type Tier = 'free' | 'premium';
export type BotState = 'idle' | 'starting' | 'running' | 'paused';

export interface UserConfig {
  mode: AppMode;
  tier: Tier;
  likesPerSession: number;
  commentsPerSession: number;
  sessionsPerDay: number;
  sessionDurationMin: number;
  pauseDurationMin: number;
  botSpeed: number;
  totalResponsesMax: number;
  skipPosts: number;
  randomMouseMovement: boolean;
  refreshAfterSession: boolean;
  skinTone: string;
  customMessages: string[];
  alertsActive: boolean;
}

export interface SessionState {
  botState: BotState;
  mode: AppMode;
  tier: Tier;
  sessionIndex: number;
  sessionsTotal: number;
  likesThisSession: number;
  commentsThisSession: number;
  targetLikes: number;
  targetComments: number;
  actionsDone: number;
  actionsTarget: number;
  dailyLikes: number;
  dailyComments: number;
  dailyResetAt: number;
  startedAt: number | null;
  elapsedSeconds: number;
}

export interface ActionEvent {
  id: string;
  type: 'like' | 'comment' | 'connection' | 'message';
  postId: string;
  authorName: string;
  authorTag: 'Réseau' | 'Prospect' | 'Expert';
  content: string;
  timestamp: number;
  mode: AppMode;
}

export interface Template {
  id: string;
  name: string;
  category: 'Réseau' | 'Prospect' | 'Expert';
  content: string;
  variables: string[];
  premium: boolean;
}

export interface UserAuth {
  id: string;
  email: string;
  name: string;
  tier: Tier;
  premiumExpires: string | null;
  installId: string;
  token: string;
}

export const DEFAULT_CONFIG: UserConfig = {
  mode: 'assist',
  tier: 'free',
  likesPerSession: 20,
  commentsPerSession: 3,
  sessionsPerDay: 1,
  sessionDurationMin: 25,
  pauseDurationMin: 5,
  botSpeed: 3,
  totalResponsesMax: 30,
  skipPosts: 0,
  randomMouseMovement: true,
  refreshAfterSession: false,
  skinTone: 'default',
  customMessages: [],
  alertsActive: true,
};

export const DEFAULT_SESSION: SessionState = {
  botState: 'idle',
  mode: 'assist',
  tier: 'free',
  sessionIndex: 0,
  sessionsTotal: 1,
  likesThisSession: 0,
  commentsThisSession: 0,
  targetLikes: 20,
  targetComments: 3,
  actionsDone: 0,
  actionsTarget: 23,
  dailyLikes: 0,
  dailyComments: 0,
  dailyResetAt: 0,
  startedAt: null,
  elapsedSeconds: 0,
};

// Message protocol between popup/content/background
export type MessageType =
  | { type: 'LBP_START'; payload: { mode: AppMode; reset?: boolean } }
  | { type: 'LBP_STOP' }
  | { type: 'LBP_PAUSE' }
  | { type: 'LBP_RESUME' }
  | { type: 'LBP_HARD_STOP' }
  | { type: 'LBP_QUERY'; }
  | { type: 'LBP_QUERY_RESPONSE'; payload: SessionState }
  | { type: 'LBP_PING' }
  | { type: 'LBP_PONG'; payload: { running: boolean } }
  | { type: 'LBP_NOTIFY'; title: string; message: string; silent?: boolean }
  | { type: 'LBP_BADGE'; text: string; color: string }
  | { type: 'LBP_MODE_CHANGED'; mode: AppMode }
  | { type: 'LBP_CONFIG_UPDATED'; config: Partial<UserConfig> }
  | { type: 'LBP_ACTION_LOGGED'; event: ActionEvent };
