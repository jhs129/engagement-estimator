// Bearer-token authentication for the MCP endpoint.
// Accepts either an `emcp_…` personal access token or an OAuth 2.1-issued JWT.

import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { prisma } from '@/lib/prisma'
import { hashToken, TOKEN_PREFIX } from '@/lib/tokens'
import { verifyAccessToken } from '@/lib/oauth/jwt'
import type { McpAccess } from './scope'

export async function resolveTokenAccess(rawToken: string): Promise<McpAccess | null> {
  const tokenHash = hashToken(rawToken)
  const record = await prisma.apiToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, role: true } } },
  })
  if (!record || record.revokedAt) return null
  await prisma.apiToken.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
  return accessForUser(record.user)
}

export async function resolveOAuthAccess(userId: string): Promise<McpAccess | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  })
  if (!user) return null
  return accessForUser(user)
}

function accessForUser(user: { id: string; email: string | null; role: string }): McpAccess {
  const adminEmail = process.env.ADMIN_EMAIL
  const isAdmin =
    user.role === 'ADMIN' ||
    (!!adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase())
  return { userId: user.id, isAdmin }
}

function resourceUrlForRequest(req: Request): string {
  const url = new URL(req.url)
  const fwdHost = req.headers.get('x-forwarded-host')
  const fwdProto = req.headers.get('x-forwarded-proto')
  if (fwdHost) return `${fwdProto ?? 'https'}://${fwdHost}/api/mcp`
  return `${url.protocol}//${url.host}/api/mcp`
}

export async function verifyMcpToken(
  req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined
  if (bearerToken.startsWith(TOKEN_PREFIX)) {
    const access = await resolveTokenAccess(bearerToken)
    if (!access) return undefined
    return { token: bearerToken, clientId: access.userId, scopes: [], extra: { ...access } }
  }
  try {
    const claims = await verifyAccessToken(bearerToken, resourceUrlForRequest(req))
    const access = await resolveOAuthAccess(claims.sub)
    if (!access) return undefined
    return {
      token: bearerToken,
      clientId: claims.client_id,
      scopes: typeof claims.scope === 'string' ? claims.scope.split(/\s+/).filter(Boolean) : [],
      extra: { ...access },
    }
  } catch {
    return undefined
  }
}
