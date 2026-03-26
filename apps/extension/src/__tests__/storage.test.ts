import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_CONFIG, DEFAULT_SESSION } from '../types';

// Mock chrome.storage.local
const mockStorage: Record<string, any> = {};
const chromeMock = {
  storage: {
    local: {
      get: vi.fn((keys: string | string[]) => {
        const result: Record<string, any> = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach(k => {
          if (mockStorage[k] !== undefined) result[k] = mockStorage[k];
        });
        return Promise.resolve(result);
      }),
      set: vi.fn((data: Record<string, any>) => {
        Object.assign(mockStorage, data);
        return Promise.resolve();
      }),
      remove: vi.fn((key: string) => {
        delete mockStorage[key];
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
  },
};

vi.stubGlobal('chrome', chromeMock);

describe('Types', () => {
  it('DEFAULT_CONFIG has correct shape', () => {
    expect(DEFAULT_CONFIG.mode).toBe('assist');
    expect(DEFAULT_CONFIG.tier).toBe('free');
    expect(DEFAULT_CONFIG.likesPerSession).toBe(20);
    expect(DEFAULT_CONFIG.commentsPerSession).toBe(3);
    expect(DEFAULT_CONFIG.botSpeed).toBe(5);
    expect(DEFAULT_CONFIG.alertsActive).toBe(true);
  });

  it('DEFAULT_SESSION has correct shape', () => {
    expect(DEFAULT_SESSION.botState).toBe('idle');
    expect(DEFAULT_SESSION.mode).toBe('assist');
    expect(DEFAULT_SESSION.likesThisSession).toBe(0);
    expect(DEFAULT_SESSION.dailyLikes).toBe(0);
    expect(DEFAULT_SESSION.startedAt).toBeNull();
  });
});

describe('Config defaults', () => {
  it('mode defaults to assist', () => {
    expect(DEFAULT_CONFIG.mode).toBe('assist');
  });

  it('tier defaults to free', () => {
    expect(DEFAULT_CONFIG.tier).toBe('free');
  });

  it('daily limits are sensible', () => {
    expect(DEFAULT_CONFIG.likesPerSession).toBeLessThanOrEqual(150);
    expect(DEFAULT_CONFIG.commentsPerSession).toBeLessThanOrEqual(50);
  });
});
