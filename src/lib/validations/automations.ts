import { z } from 'zod';

export const automationStepSchema = z.object({
  position: z.number().int().min(0),
  actionType: z.enum([
    'send_email',
    'send_sms',
    'assign_user',
    'move_stage',
    'change_status',
    'add_tag',
    'remove_tag',
    'wait',
    'stop_automation',
  ]),
  actionConfig: z.object({
    templateId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    stageId: z.string().uuid().optional(),
    statusValue: z.string().optional(),
    tagName: z.string().optional(),
    delayMinutes: z.number().int().min(1).optional(),
    assignmentMethod: z.enum(['specific', 'round_robin']).optional(),
  }).optional(),
});

export const createAutomationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  triggerType: z.enum(['lead_created', 'stage_changed', 'status_changed', 'time_delay', 'manual']),
  triggerConfig: z.object({
    stageId: z.string().uuid().optional(),
    statusValue: z.string().optional(),
    channel: z.string().optional(),
    delayMinutes: z.number().int().min(1).optional(),
  }).optional(),
  appliesToChannel: z.string().optional(),
  steps: z.array(automationStepSchema).optional(),
});

export const updateAutomationSchema = createAutomationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type AutomationStepInput = z.infer<typeof automationStepSchema>;
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;
