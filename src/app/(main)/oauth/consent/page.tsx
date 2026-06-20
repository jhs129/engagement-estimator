import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildRedirectBack,
  parseAuthorizeParams,
  redirectUriIsRegistered,
} from '@/lib/oauth/authorize';

interface ConsentSearchParams {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  state?: string;
  scope?: string;
}

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<ConsentSearchParams>;
}) {
  const sp = await searchParams;
  const url = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') url.set(k, v);
  }
  const parsed = parseAuthorizeParams(url);
  if (!parsed.ok) {
    return (
      <ConsentShell>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--cc-black)' }}>Invalid request</h1>
        <p className="text-sm" style={{ color: 'var(--cc-gray-mid)' }}>{parsed.errorDescription}</p>
      </ConsentShell>
    );
  }
  const params = parsed.params;

  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: params.clientId },
  });
  if (!client || !redirectUriIsRegistered(client, params.redirectUri)) {
    return (
      <ConsentShell>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--cc-black)' }}>Invalid client</h1>
        <p className="text-sm" style={{ color: 'var(--cc-gray-mid)' }}>This application is not registered correctly.</p>
      </ConsentShell>
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent('/oauth/consent?' + url.toString())}`);
  }

  const scopes = params.scope.split(/\s+/).filter(Boolean);
  const search = url.toString();

  async function approve() {
    'use server';
    const s = await auth();
    if (!s?.user?.email) redirect('/login');
    const u = await prisma.user.findUnique({
      where: { email: s.user.email },
      select: { id: true },
    });
    if (!u) redirect('/login?error=AccessDenied');
    await prisma.oAuthConsent.upsert({
      where: { userId_clientId: { userId: u.id, clientId: client!.id } },
      create: { userId: u.id, clientId: client!.id, scope: params.scope },
      update: { scope: params.scope },
    });
    redirect(`/oauth/authorize?${search}`);
  }

  async function deny() {
    'use server';
    redirect(
      buildRedirectBack(params.redirectUri, { error: 'access_denied', state: params.state }),
    );
  }

  return (
    <ConsentShell>
      <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--cc-black)' }}>Authorize access</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--cc-gray-mid)' }}>
        <span className="font-medium" style={{ color: 'var(--cc-black)' }}>{client.clientName}</span> is requesting
        access to your Engagement Estimator data.
      </p>
      <div className="border p-4 mb-6 text-left" style={{ borderColor: 'var(--cc-gray-light)', backgroundColor: 'var(--cc-white)' }}>
        <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--cc-gray-mid)' }}>
          Permissions
        </p>
        <ul className="text-sm space-y-1" style={{ color: 'var(--cc-black)' }}>
          {scopes.map((s) => (
            <li key={s}>
              <code className="text-xs">{s}</code> — {describeScope(s)}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs mb-6" style={{ color: 'var(--cc-gray-mid)' }}>
        Signed in as {session.user.email}.
      </p>
      <div className="flex gap-3">
        <form action={deny} className="flex-1">
          <button
            type="submit"
            className="w-full border px-6 py-3 text-sm font-medium transition-colors"
            style={{ borderColor: 'var(--cc-gray-light)', backgroundColor: 'var(--cc-white)', color: 'var(--cc-black)' }}
          >
            Deny
          </button>
        </form>
        <form action={approve} className="flex-1">
          <button
            type="submit"
            className="w-full px-6 py-3 text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--cc-burnt-sienna)', color: 'var(--cc-white)' }}
          >
            Authorize
          </button>
        </form>
      </div>
    </ConsentShell>
  );
}

function describeScope(scope: string): string {
  switch (scope) {
    case 'mcp:read':
      return 'Read estimates and engagement data you can access';
    case 'mcp:write':
      return 'Create and update engagement estimates';
    default:
      return scope;
  }
}

function ConsentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--cc-parchment)' }}>
      <div className="max-w-md w-full text-center">
        {children}
      </div>
    </div>
  );
}
