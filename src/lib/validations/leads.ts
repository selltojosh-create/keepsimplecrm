import { z } from 'zod';

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  source: z.enum(['website', 'referral', 'facebook', 'google', 'manual', 'other']).default('manual'),
  channel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedUserId: z.string().uuid().optional().nullable(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(['new', 'contacted', 'qualified', 'negotiating', 'signed', 'lost', 'archived']).optional(),
  currentStageId: z.string().uuid().optional().nullable(),
});

export const moveLeadSchema = z.object({
  stageId: z.string().uuid(),
  position: z.number().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type MoveLeadInput = z.infer<typeof moveLeadSchema>;
