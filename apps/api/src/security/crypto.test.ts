import { describe, expect, it } from 'vitest';
import { createSessionToken,createTemporaryPassword,digestSessionToken,hashPassword,verifyPassword } from './crypto.js';

describe('security crypto', () => {
  it('hashes and verifies passwords without retaining plaintext', async () => {
    const hash = await hashPassword('a strong school password');
    expect(hash).not.toContain('a strong school password');
    expect(await verifyPassword('a strong school password', hash)).toBe(true);
    expect(await verifyPassword('incorrect password', hash)).toBe(false);
  });

  it('creates non-reversible session digests', () => {
    const token = createSessionToken();
    expect(token).toHaveLength(43);
    expect(digestSessionToken(token)).not.toBe(token);
  });
  it('creates unique policy-compliant temporary passwords',()=>{const first=createTemporaryPassword();const second=createTemporaryPassword();expect(first).not.toBe(second);expect(first).toMatch(/[a-z]/);expect(first).toMatch(/[A-Z]/);expect(first).toMatch(/\d/);expect(first).toMatch(/[^A-Za-z0-9]/);expect(first.length).toBeGreaterThanOrEqual(12);});
});
