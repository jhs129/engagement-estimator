import { prisma } from '@/lib/prisma';
import { verifyPkce } from '@/lib/oauth/pkce';
import { generateOpaqueToken, hashOpaque } from '@/lib/oauth/tokens';
import { signAccessToken } from '@/lib/oauth/jwt';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  audienceFor,
} from '@/lib/oauth/config';
import { resolveServerUrls } from '@/lib/oauth/urls';

type TokenError =
  | 'invalid_request'
  | 'invalid_grant'
  | 'invalid_client'
  | 'unsupported_grant_type';

function error(code: TokenError, description: string, status = 400) {
  return Response.json(
    { error: code, error_description: description },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}

function ok(body: Record<string, unknown>) {
  return Response.json(body, {
    status: 200,
    headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

export async function POST(request: Request) {
  const ct = request.headers.get('content-type') ?? '';
  if (!ct.includes('application/x-www-form-urlencoded')) {
    return error('invalid_request', 'Body must be application/x-www-form-urlencoded');
  }
  const body = new URLSearchParams(await request.text());
  const grantType = body.get('grant_type');

  const { issuer, resourceUrl } = await resolveServerUrls();
  const audience = audienceFor(issuer);

  if (grantType === 'authorization_code') {
    return handleAuthCode(body, { issuer: issuer.href, audience, resourceUrl });
  }
  if (grantType === 'refresh_token') {
    return handleRefresh(body, { issuer: issuer.href, audience });
  }
  return error('unsupported_grant_type', 'Unsupported grant_type', 400);
}

async function handleAuthCode(
  body: URLSearchParams,
  ctx: { issuer: string; audience: string; resourceUrl: URL },
) {
  const code = body.get('code');
  const clientId = body.get('client_id');
  const redirectUri = body.get('redirect_uri');
  const codeVerifier = body.get('code_verifier');

  if (!code || !clientId || !redirectUri || !codeVerifier) {
    return error('invalid_request', 'Missing required parameter');
  }

  const stored = await prisma.oAuthAuthCode.findUnique({
    where: { code },
    include: { client: true },
  });
  if (!stored) return error('invalid_grant', 'Unknown authorization code');

  if (stored.consumedAt) {
    await revokeAllForCode(stored.id);
    return error('invalid_grant', 'Authorization code already used');
  }
  if (stored.expiresAt.getTime() < Date.now()) {
    return error('invalid_grant', 'Authorization code expired');
  }
  if (stored.client.clientId !== clientId) {
    return error('invalid_grant', 'client_id does not match authorization code');
  }
  if (stored.redirectUri !== redirectUri) {
    return error('invalid_grant', 'redirect_uri does not match authorization code');
  }
  if (
    !verifyPkce({
      codeVerifier,
      codeChallenge: stored.codeChallenge,
      codeChallengeMethod: stored.codeChallengeMethod,
    })
  ) {
    return error('invalid_grant', 'PKCE verification failed');
  }

  await prisma.oAuthAuthCode.update({
    where: { id: stored.id },
    data: { consumedAt: new Date() },
  });

  return issueTokens({
    userId: stored.userId,
    clientPk: stored.clientId,
    clientId,
    scope: stored.scope,
    issuer: ctx.issuer,
    audience: ctx.audience,
  });
}

async function handleRefresh(
  body: URLSearchParams,
  ctx: { issuer: string; audience: string },
) {
  const refreshToken = body.get('refresh_token');
  const clientId = body.get('client_id');
  if (!refreshToken || !clientId) {
    return error('invalid_request', 'Missing required parameter');
  }
  const tokenHash = hashOpaque(refreshToken);
  const stored = await prisma.oAuthRefreshToken.findUnique({
    where: { tokenHash },
    include: { client: true },
  });
  if (!stored) return error('invalid_grant', 'Unknown refresh token');
  if (stored.client.clientId !== clientId) {
    return error('invalid_grant', 'client_id does not match refresh token');
  }
  if (stored.revokedAt) {
    await prisma.oAuthRefreshToken.updateMany({
      where: { userId: stored.userId, clientId: stored.clientId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return error('invalid_grant', 'Refresh token has been revoked');
  }
  if (stored.expiresAt.getTime() < Date.now()) {
    return error('invalid_grant', 'Refresh token expired');
  }

  await prisma.oAuthRefreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens({
    userId: stored.userId,
    clientPk: stored.clientId,
    clientId,
    scope: stored.scope,
    issuer: ctx.issuer,
    audience: ctx.audience,
    replacesRefreshId: stored.id,
  });
}

async function issueTokens(opts: {
  userId: string;
  clientPk: string;
  clientId: string;
  scope: string;
  issuer: string;
  audience: string;
  replacesRefreshId?: string;
}) {
  const accessToken = await signAccessToken({
    userId: opts.userId,
    clientId: opts.clientId,
    scope: opts.scope,
    issuer: opts.issuer,
    audience: opts.audience,
  });

  const refreshTokenRaw = generateOpaqueToken();
  const newRefresh = await prisma.oAuthRefreshToken.create({
    data: {
      tokenHash: hashOpaque(refreshTokenRaw),
      clientId: opts.clientPk,
      userId: opts.userId,
      scope: opts.scope,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  });

  if (opts.replacesRefreshId) {
    await prisma.oAuthRefreshToken.update({
      where: { id: opts.replacesRefreshId },
      data: { replacedBy: newRefresh.id },
    });
  }

  return ok({
    access_token: accessToken.token,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshTokenRaw,
    scope: opts.scope,
  });
}

async function revokeAllForCode(authCodeId: string) {
  const code = await prisma.oAuthAuthCode.findUnique({ where: { id: authCodeId } });
  if (!code) return;
  await prisma.oAuthRefreshToken.updateMany({
    where: { userId: code.userId, clientId: code.clientId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
