import { randomBytes, createHash } from 'node:crypto';

export const TOKEN_PREFIX = 'emcp_';

export function generateRawToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString('base64url');
}

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function tokenDisplayPrefix(rawToken: string): string {
  return rawToken.slice(0, 12);
}
