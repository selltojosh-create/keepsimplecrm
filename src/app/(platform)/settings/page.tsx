import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { OrganizationSettingsForm } from '@/components/settings/organization-settings-form';

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.activeOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Select an organization to manage settings.
        </p>
      </div>
    );
  }

  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.activeOrganization.id))
    .limit(1);

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Organization not found.</p>
      </div>
    );
  }

  return <OrganizationSettingsForm organization={organization} />;
}
