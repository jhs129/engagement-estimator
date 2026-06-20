import { z } from 'zod'

export const createTeamMemberSchema = z.object({
  laborRoleId: z.string().nullable().optional(),
  titleOverride: z.string().nullable().optional(),
  abbreviationOverride: z.string().nullable().optional(),
  rackRateOverride: z.number().min(0).nullable().optional(),
  adjustedClientRate: z.number().min(0).nullable().optional(),
  targetedResource: z.string().nullable().optional(),
  order: z.number().int(),
})

export const updateTeamMemberSchema = z.object({
  laborRoleId: z.string().nullable().optional(),
  titleOverride: z.string().nullable().optional(),
  abbreviationOverride: z.string().nullable().optional(),
  rackRateOverride: z.number().min(0).nullable().optional(),
  adjustedClientRate: z.number().min(0).nullable().optional(),
  targetedResource: z.string().nullable().optional(),
  order: z.number().int().optional(),
})

export const createQuestionSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  notes: z.string().nullable().optional(),
  order: z.number().int(),
})

export const updateQuestionSchema = z.object({
  type: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  order: z.number().int().optional(),
})

export const createLaborRoleSchema = z.object({
  fullTitle: z.string().min(1),
  division: z.string().min(1),
  department: z.string().min(1),
  role: z.string().min(1),
  rackRate: z.number().min(0),
  abbreviation: z.string().min(1),
  isActive: z.boolean().optional(),
})

export const updateLaborRoleSchema = z.object({
  fullTitle: z.string().min(1).optional(),
  division: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  rackRate: z.number().min(0).optional(),
  abbreviation: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
export type CreateLaborRoleInput = z.infer<typeof createLaborRoleSchema>
export type UpdateLaborRoleInput = z.infer<typeof updateLaborRoleSchema>
