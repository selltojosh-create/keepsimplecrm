import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';
import { teamMemberships } from './team-memberships';

export const auditorPermissions = pgTable('auditor_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamMembershipId: uuid('team_membership_id').notNull().references(() => teamMemberships.id, { onDelete: 'cascade' }).unique(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  canAddMembers: boolean('can_add_members').notNull().default(true),
  canRemoveMembers: boolean('can_remove_members').notNull().default(true),
  canChangeRoles: boolean('can_change_roles').notNull().default(true),
  canDeleteLeads: boolean('can_delete_leads').notNull().default(true),
  canBulkEditLeads: boolean('can_bulk_edit_leads').notNull().default(true),
  canExportData: boolean('can_export_data').notNull().default(true),
  canManagePipelines: boolean('can_manage_pipelines').notNull().default(true),
  canManageAutomations: boolean('can_manage_automations').notNull().default(true),
  canManageTemplates: boolean('can_manage_templates').notNull().default(true),
  canEditOrgSettings: boolean('can_edit_org_settings').notNull().default(true),
  canManageIntegrations: boolean('can_manage_integrations').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
});

export type AuditorPermission = typeof auditorPermissions.$inferSelect;
export type NewAuditorPermission = typeof auditorPermissions.$inferInsert;
