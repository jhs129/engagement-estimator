export const OAUTH_SCOPES = ['mcp:read', 'mcp:write'] as const;
export type OAuthScope = (typeof OAUTH_SCOPES)[number];

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
export const AUTH_CODE_TTL_SECONDS = 60;

export const JWT_ALGORITHM = 'RS256';

export function audienceFor(baseUrl: URL): string {
  return new URL('/api/mcp', baseUrl).href;
}
