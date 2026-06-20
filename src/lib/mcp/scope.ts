export interface McpAccess {
  userId: string
  isAdmin: boolean
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export function requireAdmin(access: McpAccess): void {
  if (!access.isAdmin) throw new ForbiddenError('Admin-only operation')
}
