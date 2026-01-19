import { pgTable, uuid, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { automations } from './automations';
import { leads } from './leads';

export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'stopped', 'error']);

export const automationEnrollments = pgTable('automation_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  automationId: uuid('automation_id').notNull().references(() => automations.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  currentStepPosition: integer('current_step_position').notNull().default(0),
  status: enrollmentStatusEnum('status').notNull().default('active'),
  nextActionAt: timestamp('next_action_at'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AutomationEnrollment = typeof automationEnrollments.$inferSelect;
export type NewAutomationEnrollment = typeof automationEnrollments.$inferInsert;
