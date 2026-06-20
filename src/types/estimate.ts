import { z } from 'zod'

export const createEstimateSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  salesOwner: z.string().min(1),
  estimatedStartDate: z.string().datetime().optional(),
  projectDescription: z.string().optional(),
  version: z.number().optional(),
  riskPremiumPct: z.number().min(0).max(1).optional(),
  smeTechnology: z.string().optional(),
  smeCreativeUX: z.string().optional(),
  smeStrategy: z.string().optional(),
  smeData: z.string().optional(),
  smeMedia: z.string().optional(),
  smeMarketingAutomation: z.string().optional(),
  smeOther: z.string().optional(),
  ratioQAToDev: z.number().min(0).optional(),
  ratioTestCaseAuthoring: z.number().min(0).optional(),
  ratioDefectFixing: z.number().min(0).optional(),
  ratioAlphaTesting: z.number().min(0).optional(),
  ratioUAT: z.number().min(0).optional(),
})

export const updateEstimateSchema = z.object({
  name: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  salesOwner: z.string().min(1).optional(),
  estimatedStartDate: z.string().datetime().nullable().optional(),
  projectDescription: z.string().nullable().optional(),
  version: z.number().optional(),
  riskPremiumPct: z.number().min(0).max(1).optional(),
  smeTechnology: z.string().nullable().optional(),
  smeCreativeUX: z.string().nullable().optional(),
  smeStrategy: z.string().nullable().optional(),
  smeData: z.string().nullable().optional(),
  smeMedia: z.string().nullable().optional(),
  smeMarketingAutomation: z.string().nullable().optional(),
  smeOther: z.string().nullable().optional(),
  ratioQAToDev: z.number().min(0).optional(),
  ratioTestCaseAuthoring: z.number().min(0).optional(),
  ratioDefectFixing: z.number().min(0).optional(),
  ratioAlphaTesting: z.number().min(0).optional(),
  ratioUAT: z.number().min(0).optional(),
})

export type CreateEstimateInput = z.infer<typeof createEstimateSchema>
export type UpdateEstimateInput = z.infer<typeof updateEstimateSchema>
