import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { emailTemplates } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplatesList } from '@/components/templates/templates-list';
import { NewTemplateDialog } from '@/components/templates/new-template-dialog';

export default async function TemplatesPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!session.activeOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Select an organization to view templates.
          </p>
        </div>
      </div>
    );
  }

  const templates = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.organizationId, session.activeOrganization.id))
    .orderBy(desc(emailTemplates.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage email templates for automations
          </p>
        </div>
        <NewTemplateDialog />
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No templates yet</CardTitle>
            <CardDescription>
              Create your first email template to use in automations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewTemplateDialog />
          </CardContent>
        </Card>
      ) : (
        <TemplatesList templates={templates} />
      )}
    </div>
  );
}
