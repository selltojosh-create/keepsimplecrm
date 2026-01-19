'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Organization } from '@/lib/db/schema';

interface OrgSwitcherProps {
  organizations: Array<{ id: string; name: string; slug: string }>;
  currentOrg: Organization | null;
}

export function OrgSwitcher({ organizations, currentOrg }: OrgSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = async (orgId: string) => {
    setOpen(false);

    try {
      await fetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, teamId: null }),
      });

      router.refresh();
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentOrg?.name || 'Select organization'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[200px]" align="start">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.length === 0 ? (
          <DropdownMenuItem disabled>No organizations</DropdownMenuItem>
        ) : (
          organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSelect(org.id)}
              className="cursor-pointer"
            >
              <Check
                className={`mr-2 h-4 w-4 ${
                  currentOrg?.id === org.id ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <span className="truncate">{org.name}</span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/settings/organization/new')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
