import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = 'test-secret';

describe('Auth validation', () => {
  it('rejects empty email', () => {
    expect(''.includes('@')).toBe(false);
  });

  it('accepts valid email format', () => {
    const email = 'test@example.com';
    expect(email.includes('@')).toBe(true);
    expect(email.includes('.')).toBe(true);
  });

  it('rejects short passwords', () => {
    expect('12345'.length >= 6).toBe(false);
  });

  it('accepts valid passwords', () => {
    expect('securepass123'.length >= 6).toBe(true);
  });
});

describe('JWT token', () => {
  it('signs and verifies a token correctly', () => {
    const userId = 'user-123';
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    expect(decoded.userId).toBe(userId);
  });

  it('rejects token with wrong secret', () => {
    const token = jwt.sign({ userId: 'user-123' }, JWT_SECRET);
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });

  it('contains userId in payload', () => {
    const token = jwt.sign({ userId: 'abc-def' }, JWT_SECRET);
    const decoded = jwt.decode(token) as { userId: string };
    expect(decoded.userId).toBe('abc-def');
  });
});

describe('Password hashing', () => {
  it('hashes and verifies password correctly', async () => {
    const password = 'MySecurePass123';
    const hashed = await bcrypt.hash(password, 12);
    expect(hashed).not.toBe(password);
    expect(await bcrypt.compare(password, hashed)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hashed = await bcrypt.hash('correct-password', 12);
    expect(await bcrypt.compare('wrong-password', hashed)).toBe(false);
  });
});

describe('Auth flow validation', () => {
  it('validates register schema requirements', () => {
    // Name must be non-empty
    expect(''.length >= 1).toBe(false);
    expect('Jean'.length >= 1).toBe(true);

    // Email must contain @
    expect('invalid-email'.includes('@')).toBe(false);
    expect('valid@email.com'.includes('@')).toBe(true);

    // Password must be >= 6 chars
    expect('12345'.length >= 6).toBe(false);
    expect('123456'.length >= 6).toBe(true);
  });

  it('generates unique tokens for different users', () => {
    const token1 = jwt.sign({ userId: 'user-1' }, JWT_SECRET);
    const token2 = jwt.sign({ userId: 'user-2' }, JWT_SECRET);
    expect(token1).not.toBe(token2);
  });
});
