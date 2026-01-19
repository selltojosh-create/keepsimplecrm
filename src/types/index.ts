import type { User, Organization, Team, Membership, TeamMembership, Lead, Pipeline, PipelineStage, Automation, AutomationStep } from '@/lib/db/schema';

// Re-export database types
export type { User, Organization, Team, Membership, TeamMembership, Lead, Pipeline, PipelineStage, Automation, AutomationStep };

// Session context types
export interface SessionContext {
  user: User;
  activeOrganization: Organization | null;
  activeTeam: Team | null;
  membership: Membership | null;
  teamMembership: TeamMembership | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Lead with relations
export interface LeadWithRelations extends Lead {
  assignedUser?: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'> | null;
  currentPipeline?: Pipeline | null;
  currentStage?: PipelineStage | null;
}

// Pipeline with stages
export interface PipelineWithStages extends Pipeline {
  stages: PipelineStage[];
}

// Automation with steps
export interface AutomationWithSteps extends Automation {
  steps: AutomationStep[];
}
