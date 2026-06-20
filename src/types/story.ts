import { z } from 'zod'

export const createStorySchema = z.object({
  epicId: z.string().min(1),
  storyTask: z.string().min(1),
  description: z.string().optional(),
  assumptions: z.string().optional(),
  deliverables: z.string().optional(),
  disabled: z.boolean().optional(),
  testable: z.boolean().optional(),
  estimateLow: z.number().min(0).nullable().optional(),
  estimateHigh: z.number().min(0).nullable().optional(),
  estimateMean: z.number().min(0).nullable().optional(),
  order: z.number().int(),
})

export const updateStorySchema = z.object({
  epicId: z.string().min(1).optional(),
  storyTask: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  assumptions: z.string().nullable().optional(),
  deliverables: z.string().nullable().optional(),
  disabled: z.boolean().optional(),
  testable: z.boolean().optional(),
  estimateLow: z.number().min(0).nullable().optional(),
  estimateHigh: z.number().min(0).nullable().optional(),
  estimateMean: z.number().min(0).nullable().optional(),
  order: z.number().int().optional(),
})

export const createEpicSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isFoundation: z.boolean().optional(),
  order: z.number().int(),
})

export const updateEpicSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isFoundation: z.boolean().optional(),
  order: z.number().int().optional(),
})

export type CreateStoryInput = z.infer<typeof createStorySchema>
export type UpdateStoryInput = z.infer<typeof updateStorySchema>
export type CreateEpicInput = z.infer<typeof createEpicSchema>
export type UpdateEpicInput = z.infer<typeof updateEpicSchema>
