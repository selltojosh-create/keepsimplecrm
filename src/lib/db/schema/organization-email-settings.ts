import { pgTable, uuid, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const emailProviderEnum = pgEnum('email_provider', ['resend', 'sendgrid', 'postmark', 'ses']);

export const organizationEmailSettings = pgTable('organization_email_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }).unique(),
  fromName: text('from_name').notNull(),
  fromEmail: text('from_email').notNull(),
  replyToEmail: text('reply_to_email'),
  provider: emailProviderEnum('provider').notNull().default('resend'),
  providerApiKey: text('provider_api_key'),
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type OrganizationEmailSettings = typeof organizationEmailSettings.$inferSelect;
export type NewOrganizationEmailSettings = typeof organizationEmailSettings.$inferInsert;
