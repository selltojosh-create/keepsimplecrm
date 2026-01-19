import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';
import { teams } from './teams';
import { pipelines } from './pipelines';
import { pipelineStages } from './pipeline-stages';

export const leadSourceEnum = pgEnum('lead_source', ['website', 'referral', 'facebook', 'google', 'manual', 'other']);
export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'qualified', 'negotiating', 'signed', 'lost', 'archived']);

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  addressCity: text('address_city'),
  addressState: text('address_state'),
  addressZip: text('address_zip'),
  source: leadSourceEnum('source').notNull().default('manual'),
  channel: text('channel'),
  status: leadStatusEnum('status').notNull().default('new'),
  tags: text('tags').array(),
  assignedUserId: uuid('assigned_user_id').references(() => users.id),
  currentPipelineId: uuid('current_pipeline_id').references(() => pipelines.id),
  currentStageId: uuid('current_stage_id').references(() => pipelineStages.id),
  lastContactedAt: timestamp('last_contacted_at'),
  signedAt: timestamp('signed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
