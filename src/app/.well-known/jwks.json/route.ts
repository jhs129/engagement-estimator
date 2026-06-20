import { getJwks } from '@/lib/oauth/keys';

export async function GET() {
  const jwks = await getJwks();
  return Response.json(jwks, {
    headers: {
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
}
