// MCP tool definitions for engagement estimation. Each tool is a thin
// adapter over the scope-enforcing functions in ./data.
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { McpAccess } from './scope'
import { ForbiddenError } from './scope'
import {
  listEstimates,
  getEstimate,
  listStories,
  getEpicSummary,
  getInvestmentSummary,
  createEstimate,
  updateEstimateSetup,
  createStory,
  updateStory,
  createQuestion,
  addTeamMember,
} from './data'

interface ToolResult {
  content: { type: 'text'; text: string }[]
  isError?: boolean
  [key: string]: unknown
}

function jsonResult(data: unknown): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
}

function errorResult(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true }
}

// mcp-handler attaches the AuthInfo (and its `extra`) to each tool callback's
// `extra` argument. withMcpAuth({ required: true }) guarantees it is present.
function accessFrom(extra: { authInfo?: { extra?: Record<string, unknown> } }): McpAccess {
  const a = extra.authInfo?.extra as McpAccess | undefined
  if (!a) throw new Error('Missing MCP auth context')
  return a
}

/** Runs a tool body, turning any unexpected error into a generic error result. */
async function guard(run: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await run()
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return errorResult(err.message)
    }
    console.error('[mcp] tool error:', err)
    return errorResult('Internal error')
  }
}

const SAFE_ESTIMATE_FIELDS = new Set([
  'name',
  'clientName',
  'salesOwner',
  'projectDescription',
  'estimatedStartDate',
  'riskPremiumPct',
  'smeTechnology',
  'smeCreativeUX',
  'smeStrategy',
  'smeData',
  'smeMedia',
  'smeMarketingAutomation',
  'smeOther',
])

export function registerEstimationTools(server: McpServer): void {
  server.registerTool(
    'list_estimates',
    {
      title: 'List estimates',
      description: 'List all estimates you can access, ordered by last updated.',
      inputSchema: {},
    },
    async (_args, extra) =>
      guard(async () => jsonResult(await listEstimates(accessFrom(extra)))),
  )

  server.registerTool(
    'get_estimate',
    {
      title: 'Get estimate',
      description: 'Get full details for one estimate.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
      },
    },
    async ({ estimateId }, extra) =>
      guard(async () => {
        const estimate = await getEstimate(accessFrom(extra), estimateId)
        return estimate ? jsonResult(estimate) : errorResult('Estimate not found')
      }),
  )

  server.registerTool(
    'list_stories',
    {
      title: 'List stories',
      description: 'List all stories for an estimate, with epic name and staffing allocations.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
      },
    },
    async ({ estimateId }, extra) =>
      guard(async () => {
        const stories = await listStories(accessFrom(extra), estimateId)
        return stories !== null ? jsonResult(stories) : errorResult('Estimate not found')
      }),
  )

  server.registerTool(
    'get_epic_summary',
    {
      title: 'Get epic summary',
      description: 'Get all epics for an estimate with their active story counts.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
      },
    },
    async ({ estimateId }, extra) =>
      guard(async () => {
        const epics = await getEpicSummary(accessFrom(extra), estimateId)
        return epics !== null ? jsonResult(epics) : errorResult('Estimate not found')
      }),
  )

  server.registerTool(
    'get_investment_summary',
    {
      title: 'Get investment summary',
      description: 'Get team members with rates and hours for an estimate.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
      },
    },
    async ({ estimateId }, extra) =>
      guard(async () => {
        const summary = await getInvestmentSummary(accessFrom(extra), estimateId)
        return summary !== null ? jsonResult(summary) : errorResult('Estimate not found')
      }),
  )

  server.registerTool(
    'create_estimate',
    {
      title: 'Create estimate',
      description: 'Create a new engagement estimate.',
      inputSchema: {
        name: z.string().min(1).describe('Estimate name'),
        clientName: z.string().min(1).describe('Client name'),
        salesOwner: z.string().min(1).describe('Sales owner name'),
      },
    },
    async (args, extra) =>
      guard(async () => jsonResult(await createEstimate(accessFrom(extra), args))),
  )

  server.registerTool(
    'update_estimate_setup',
    {
      title: 'Update estimate setup',
      description:
        'Update setup fields on an estimate. Only safe fields are allowed: name, clientName, salesOwner, projectDescription, estimatedStartDate, riskPremiumPct, and SME fields.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
        fields: z.record(z.string(), z.unknown()).describe('Fields to update'),
      },
    },
    async ({ estimateId, fields }, extra) =>
      guard(async () => {
        const safeData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(fields)) {
          if (SAFE_ESTIMATE_FIELDS.has(key)) safeData[key] = value
        }
        if (Object.keys(safeData).length === 0) {
          return errorResult('No safe fields provided')
        }
        const updated = await updateEstimateSetup(accessFrom(extra), estimateId, safeData)
        return updated !== null ? jsonResult(updated) : errorResult('Estimate not found')
      }),
  )

  server.registerTool(
    'create_story',
    {
      title: 'Create story',
      description: 'Create a new story in an epic within an estimate.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
        epicId: z.string().describe('Epic id to add the story to'),
        storyTask: z.string().min(1).describe('Story/task description'),
      },
    },
    async ({ estimateId, epicId, storyTask }, extra) =>
      guard(async () => {
        const story = await createStory(accessFrom(extra), estimateId, { epicId, storyTask })
        return story !== null ? jsonResult(story) : errorResult('Estimate not found')
      }),
  )

  server.registerTool(
    'update_story',
    {
      title: 'Update story',
      description: 'Update fields on a story. Only the fields you provide are changed.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
        storyId: z.string().describe('Story id'),
        fields: z.record(z.string(), z.unknown()).describe('Fields to update'),
      },
    },
    async ({ estimateId, storyId, fields }, extra) =>
      guard(async () => {
        const story = await updateStory(accessFrom(extra), estimateId, storyId, fields)
        return story !== null ? jsonResult(story) : errorResult('Estimate or story not found')
      }),
  )

  server.registerTool(
    'create_question',
    {
      title: 'Create question',
      description: 'Add a question or assumption to an estimate.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
        type: z.enum(['Question', 'Assumption']).describe('Whether this is a Question or Assumption'),
        description: z.string().min(1).describe('Question or assumption text'),
        notes: z.string().optional().describe('Additional notes'),
      },
    },
    async ({ estimateId, type, description, notes }, extra) =>
      guard(async () => {
        const question = await createQuestion(accessFrom(extra), estimateId, {
          type,
          description,
          notes,
        })
        return question !== null ? jsonResult(question) : errorResult('Estimate not found')
      }),
  )

  server.registerTool(
    'add_team_member',
    {
      title: 'Add team member',
      description: 'Add a team member to an estimate. Provide either a laborRoleId or a titleOverride.',
      inputSchema: {
        estimateId: z.string().describe('Estimate id'),
        laborRoleId: z.string().optional().describe('Labor role id from the catalog'),
        titleOverride: z.string().optional().describe('Custom title if not using a catalog role'),
      },
    },
    async ({ estimateId, laborRoleId, titleOverride }, extra) =>
      guard(async () => {
        const member = await addTeamMember(accessFrom(extra), estimateId, {
          laborRoleId,
          titleOverride,
        })
        return member !== null ? jsonResult(member) : errorResult('Estimate not found')
      }),
  )
}
