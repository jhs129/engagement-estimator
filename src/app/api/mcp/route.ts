import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { registerEstimationTools } from '@/lib/mcp/tools'
import { verifyMcpToken } from '@/lib/mcp/auth'

export const maxDuration = 60

const handler = createMcpHandler(
  (server) => {
    registerEstimationTools(server)
  },
  {},
  { basePath: '/api', maxDuration: 60, verboseLogs: false },
)

const authHandler = withMcpAuth(handler, verifyMcpToken, { required: true })

export { authHandler as GET, authHandler as POST, authHandler as DELETE }
