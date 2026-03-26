import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const leadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  consent: z.boolean().optional(),
});

describe('Lead / Ebook schema validation', () => {
  it('accepts valid lead with all fields', () => {
    const result = leadSchema.safeParse({
      email: 'jean@entreprise.com',
      firstName: 'Jean',
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts lead without consent (optional)', () => {
    const result = leadSchema.safeParse({
      email: 'jean@entreprise.com',
      firstName: 'Jean',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = leadSchema.safeParse({
      email: 'not-an-email',
      firstName: 'Jean',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty firstName', () => {
    const result = leadSchema.safeParse({
      email: 'jean@entreprise.com',
      firstName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = leadSchema.safeParse({
      firstName: 'Jean',
    });
    expect(result.success).toBe(false);
  });
});
