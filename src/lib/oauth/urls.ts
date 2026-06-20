import { headers } from 'next/headers';

export async function resolveServerUrls(): Promise<{
  baseUrl: URL;
  issuer: URL;
  resourceUrl: URL;
}> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) {
    throw new Error('Missing host header');
  }
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const baseUrl = new URL(`${proto}://${host}`);
  return {
    baseUrl,
    issuer: baseUrl,
    resourceUrl: new URL('/api/mcp', baseUrl),
  };
}
