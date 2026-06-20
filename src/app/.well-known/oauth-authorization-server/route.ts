import { resolveServerUrls } from '@/lib/oauth/urls';
import { OAUTH_SCOPES } from '@/lib/oauth/config';

export async function GET() {
  const { baseUrl, issuer } = await resolveServerUrls();
  return Response.json(
    {
      issuer: issuer.href,
      authorization_endpoint: new URL('/oauth/authorize', baseUrl).href,
      token_endpoint: new URL('/oauth/token', baseUrl).href,
      registration_endpoint: new URL('/oauth/register', baseUrl).href,
      jwks_uri: new URL('/.well-known/jwks.json', baseUrl).href,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: OAUTH_SCOPES,
    },
    {
      headers: {
        'cache-control': 'public, max-age=300',
        'access-control-allow-origin': '*',
      },
    },
  );
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}
