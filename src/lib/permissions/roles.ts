export const ROLES = {
  PLATFORM_OWNER: 'platform_owner',
  ADMIN: 'admin',
  AUDITOR: 'auditor',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.PLATFORM_OWNER]: 100,
  [ROLES.ADMIN]: 90,
  [ROLES.AUDITOR]: 70,
  [ROLES.MANAGER]: 50,
  [ROLES.MEMBER]: 10,
};

export function hasHigherOrEqualRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageRole(userRole: Role, targetRole: Role): boolean {
  // Users can only manage roles below their own level
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}
