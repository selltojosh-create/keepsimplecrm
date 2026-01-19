'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Membership, User } from '@/lib/db/schema';

interface TeamMembersListProps {
  members: Array<{ membership: Membership; user: User }>;
  currentUserId: string;
  canManage: boolean;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  employee: 'Employee',
};

const roleColors: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700',
  employee: 'bg-gray-100 text-gray-700',
};

export function TeamMembersList({
  members,
  currentUserId,
  canManage,
}: TeamMembersListProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    setIsUpdating(membershipId);
    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgRole: newRole }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setIsUpdating(membershipId);
    try {
      const response = await fetch(`/api/memberships/${membershipId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-2">
      {members.map(({ membership, user }) => {
        const isCurrentUser = user.id === currentUserId;
        const canEdit = canManage && !isCurrentUser;

        return (
          <div
            key={membership.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {user.name?.[0] || user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {user.name}                   </span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={roleColors[membership.orgRole] || roleColors.employee}>
                {roleLabels[membership.orgRole] || membership.orgRole}
              </Badge>

              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isUpdating === membership.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Shield className="mr-2 h-4 w-4" />
                        Change Role
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {['admin', 'employee'].map((role) => (
                          <DropdownMenuItem
                            key={role}
                            onClick={() => handleRoleChange(membership.id, role)}
                            disabled={membership.orgRole === role}
                          >
                            {roleLabels[role]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(membership.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
