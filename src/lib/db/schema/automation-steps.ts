import { pgTable, uuid, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { automations } from './automations';

export const actionTypeEnum = pgEnum('action_type', ['send_email', 'send_sms', 'assign_user', 'move_stage', 'change_status', 'add_tag', 'remove_tag', 'wait', 'stop_automation']);

export const automationSteps = pgTable('automation_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  automationId: uuid('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  actionType: actionTypeEnum('action_type').notNull(),
  actionConfig: jsonb('action_config').$type<{
    templateId?: string;
    userId?: string;
    stageId?: string;
    statusValue?: string;
    tagName?: string;
    delayMinutes?: number;
    assignmentMethod?: 'specific' | 'round_robin';
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AutomationStep = typeof automationSteps.$inferSelect;
export type NewAutomationStep = typeof automationSteps.$inferInsert;
