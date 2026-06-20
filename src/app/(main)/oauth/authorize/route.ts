import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildRedirectBack,
  parseAuthorizeParams,
  redirectUriIsRegistered,
} from '@/lib/oauth/authorize';
import { AUTH_CODE_TTL_SECONDS } from '@/lib/oauth/config';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseAuthorizeParams(url.searchParams);

  if (!parsed.ok) {
    return Response.json(
      { error: parsed.error, error_description: parsed.errorDescription },
      { status: parsed.httpStatus },
    );
  }
  const params = parsed.params;

  const client = await prisma.oAuthClient.findUnique({ where: { clientId: params.clientId } });
  if (!client) {
    return Response.json(
      { error: 'invalid_client', error_description: 'Unknown client_id' },
      { status: 400 },
    );
  }
  if (!redirectUriIsRegistered(client, params.redirectUri)) {
    return Response.json(
      { error: 'invalid_request', error_description: 'redirect_uri not registered for this client' },
      { status: 400 },
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    const callback = url.pathname + url.search;
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    redirect(`/login?error=AccessDenied`);
  }

  const consent = await prisma.oAuthConsent.findUnique({
    where: { userId_clientId: { userId: user.id, clientId: client.id } },
  });
  if (!consent) {
    redirect(`/oauth/consent${url.search}`);
  }

  const code = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_SECONDS * 1000);
  await prisma.oAuthAuthCode.create({
    data: {
      code,
      clientId: client.id,
      userId: user.id,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      codeChallengeMethod: params.codeChallengeMethod,
      scope: params.scope,
      expiresAt,
    },
  });

  redirect(buildRedirectBack(params.redirectUri, { code, state: params.state }));
}
