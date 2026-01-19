'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Team } from '@/lib/db/schema';

interface TeamSwitcherProps {
  teams: Array<{ id: string; name: string; slug: string }>;
  currentTeam: Team | null;
}

export function TeamSwitcher({ teams, currentTeam }: TeamSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = async (teamId: string) => {
    setOpen(false);

    try {
      await fetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });

      router.refresh();
    } catch (error) {
      console.error('Failed to switch team:', error);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-between">
          <div className="flex items-center gap-2 truncate">
            <Users className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentTeam?.name || 'Select team'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[180px] z-50" align="start">
        <DropdownMenuLabel>Teams</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {teams.length === 0 ? (
          <DropdownMenuItem disabled>No teams</DropdownMenuItem>
        ) : (
          teams.map((team) => (
            <DropdownMenuItem
              key={team.id}
              onClick={() => handleSelect(team.id)}
              className="cursor-pointer"
            >
              <Check
                className={`mr-2 h-4 w-4 ${
                  currentTeam?.id === team.id ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <span className="truncate">{team.name}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/settings/teams/new')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create team
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
