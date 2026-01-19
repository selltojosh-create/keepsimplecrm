import { getSession } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Kanban, Zap, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const stats = [
    {
      name: 'Total Leads',
      value: '0',
      description: 'Active leads in pipeline',
      icon: Users,
      trend: '+0%',
    },
    {
      name: 'Pipeline Value',
      value: '$0',
      description: 'Total potential value',
      icon: TrendingUp,
      trend: '+0%',
    },
    {
      name: 'Active Stages',
      value: '0',
      description: 'Leads being worked',
      icon: Kanban,
      trend: '+0%',
    },
    {
      name: 'Automations',
      value: '0',
      description: 'Running automations',
      icon: Zap,
      trend: '+0%',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name}!
          {session.activeOrganization && (
            <span> You&apos;re viewing {session.activeOrganization.name}</span>
          )}
          {session.activeTeam && <span> - {session.activeTeam.name}</span>}
        </p>
      </div>

      {!session.activeOrganization ? (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Select an organization from the dropdown above to get started, or create a new one.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !session.activeTeam ? (
        <Card>
          <CardHeader>
            <CardTitle>Select a Team</CardTitle>
            <CardDescription>
              Select a team from the dropdown above to view your leads and pipeline.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                  Latest leads added to your pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No leads yet. Create your first lead to get started.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions in your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No activity yet. Start by creating leads or setting up automations.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
