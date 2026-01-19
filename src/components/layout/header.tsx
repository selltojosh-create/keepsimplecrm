import { OrgSwitcher } from './org-switcher';
import { TeamSwitcher } from './team-switcher';
import { UserMenu } from './user-menu';
import { MobileSidebar } from './mobile-sidebar';
import { Separator } from '@/components/ui/separator';
import type { SessionData } from '@/lib/auth';

interface HeaderProps {
  session: SessionData;
  organizations: Array<{ id: string; name: string; slug: string }>;
  teams: Array<{ id: string; name: string; slug: string }>;
}

export function Header({ session, organizations, teams }: HeaderProps) {
  return (
    <header className="relative z-20 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <MobileSidebar />
        <OrgSwitcher
          organizations={organizations}
          currentOrg={session.activeOrganization}
        />
        {session.activeOrganization && (
          <>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div className="hidden sm:block">
              <TeamSwitcher
                teams={teams}
                currentTeam={session.activeTeam}
              />
            </div>
          </>
        )}
      </div>

      <UserMenu user={session.user} />
    </header>
  );
}
