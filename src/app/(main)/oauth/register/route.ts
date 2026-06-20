import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';

const MAX_REDIRECT_URIS = 16;
const MAX_CLIENT_NAME_LENGTH = 200;

function isHttpsOrLocalhost(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.protocol === 'https:') return true;
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
      return true;
    }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return true;
    return false;
  } catch {
    return false;
  }
}

interface RegistrationRequest {
  client_name?: unknown;
  redirect_uris?: unknown;
  token_endpoint_auth_method?: unknown;
}

export async function POST(request: Request) {
  let body: RegistrationRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_client_metadata', error_description: 'Body must be JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.redirect_uris) || body.redirect_uris.length === 0) {
    return Response.json(
      { error: 'invalid_redirect_uri', error_description: 'redirect_uris must be a non-empty array' },
      { status: 400 },
    );
  }
  if (body.redirect_uris.length > MAX_REDIRECT_URIS) {
    return Response.json(
      { error: 'invalid_redirect_uri', error_description: `Too many redirect_uris (max ${MAX_REDIRECT_URIS})` },
      { status: 400 },
    );
  }
  for (const uri of body.redirect_uris) {
    if (typeof uri !== 'string' || !isHttpsOrLocalhost(uri)) {
      return Response.json(
        { error: 'invalid_redirect_uri', error_description: `Invalid redirect_uri: ${String(uri)}` },
        { status: 400 },
      );
    }
  }
  const redirectUris = body.redirect_uris as string[];

  const clientName =
    typeof body.client_name === 'string' && body.client_name.trim()
      ? body.client_name.trim().slice(0, MAX_CLIENT_NAME_LENGTH)
      : 'Unnamed MCP Client';

  if (
    typeof body.token_endpoint_auth_method === 'string' &&
    body.token_endpoint_auth_method !== 'none'
  ) {
    return Response.json(
      {
        error: 'invalid_client_metadata',
        error_description: 'Only token_endpoint_auth_method=none is supported',
      },
      { status: 400 },
    );
  }

  const clientId = 'mcpc_' + randomBytes(16).toString('base64url');
  const created = await prisma.oAuthClient.create({
    data: { clientId, clientName, redirectUris },
  });

  return Response.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(created.createdAt.getTime() / 1000),
      client_name: clientName,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    },
    { status: 201, headers: { 'cache-control': 'no-store' } },
  );
}
