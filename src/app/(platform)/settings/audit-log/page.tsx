import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { auditLog, users, memberships } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { AuditLogList } from '@/components/settings/audit-log-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AuditLogPage() {
  const session = await getSession();

  if (!session?.activeOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Select an organization to view audit logs.
        </p>
      </div>
    );
  }

  const orgId = session.activeOrganization.id;

  // Check if user has permission to view audit logs (admin, auditor, or platform_owner)
  const [membership] = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.organizationId, orgId),
        eq(memberships.userId, session.user.id)
      )
    )
    .limit(1);

  if (!membership || membership.orgRole !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You don&apos;t have permission to view audit logs.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get audit logs with user info
  const logs = await db
    .select({
      log: auditLog,
      user: users,
    })
    .from(auditLog)
    .innerJoin(users, eq(auditLog.userId, users.id))
    .where(eq(auditLog.organizationId, orgId))
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
        <CardDescription>
          Track all changes and actions in your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No audit log entries yet.
          </p>
        ) : (
          <AuditLogList logs={logs} />
        )}
      </CardContent>
    </Card>
  );
}
