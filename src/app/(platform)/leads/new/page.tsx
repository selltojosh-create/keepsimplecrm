import { getSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NewLeadForm } from '@/components/leads/new-lead-form';

export default async function NewLeadPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (!session.activeOrganization || !session.activeTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Lead</h1>
          <p className="text-muted-foreground">
            Select an organization and team first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Lead</h1>
        <p className="text-muted-foreground">
          Create a new lead for {session.activeTeam.name}
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
          <CardDescription>
            Enter the contact details for your new lead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewLeadForm />
        </CardContent>
      </Card>
    </div>
  );
}
