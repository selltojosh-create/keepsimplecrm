import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationEmailSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailSettingsForm } from '@/components/settings/email-settings-form';

export default async function EmailSettingsPage() {
  const session = await getSession();

  if (!session?.activeOrganization) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Select an organization to manage email settings.
        </p>
      </div>
    );
  }

  const [settings] = await db
    .select()
    .from(organizationEmailSettings)
    .where(eq(organizationEmailSettings.organizationId, session.activeOrganization.id))
    .limit(1);

  return (
    <EmailSettingsForm
      settings={settings || null}
      organizationId={session.activeOrganization.id}
    />
  );
}
