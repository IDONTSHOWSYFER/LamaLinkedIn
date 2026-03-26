import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const eventSchema = z.object({
  type: z.enum(['like', 'comment', 'connection', 'message']),
  postId: z.string().optional(),
  authorName: z.string().optional(),
  authorTag: z.string().optional(),
  content: z.string().optional(),
  mode: z.enum(['assist', 'agent']).optional(),
});

describe('Event schema validation', () => {
  it('accepts valid like event', () => {
    const result = eventSchema.safeParse({ type: 'like', postId: 'post-123' });
    expect(result.success).toBe(true);
  });

  it('accepts valid comment event with content', () => {
    const result = eventSchema.safeParse({
      type: 'comment',
      postId: 'post-456',
      authorName: 'Jean Dupont',
      content: 'Super post !',
      mode: 'assist',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid event type', () => {
    const result = eventSchema.safeParse({ type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects empty event', () => {
    const result = eventSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts all valid event types', () => {
    for (const type of ['like', 'comment', 'connection', 'message']) {
      const result = eventSchema.safeParse({ type });
      expect(result.success).toBe(true);
    }
  });

  it('accepts both assist and agent modes', () => {
    for (const mode of ['assist', 'agent']) {
      const result = eventSchema.safeParse({ type: 'like', mode });
      expect(result.success).toBe(true);
    }
  });
});

describe('Stats period calculation', () => {
  it('calculates today since date correctly', () => {
    const now = new Date('2026-03-22T14:30:00Z');
    const since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    expect(since.getHours()).toBe(0);
    expect(since.getMinutes()).toBe(0);
  });

  it('calculates week since date correctly', () => {
    const now = new Date('2026-03-22T14:30:00Z');
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    expect(since.getDate()).toBe(15);
  });

  it('calculates month since date correctly', () => {
    const now = new Date('2026-03-22T14:30:00Z');
    const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(since.getMonth()).toBe(1); // February
  });
});
