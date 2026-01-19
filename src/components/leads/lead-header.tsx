'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Lead, PipelineStage } from '@/lib/db/schema';

interface LeadWithRelations extends Lead {
  assignedUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  currentStage: PipelineStage | null;
}

interface LeadHeaderProps {
  lead: LeadWithRelations;
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
  new: 'default',
  contacted: 'secondary',
  qualified: 'warning',
  negotiating: 'warning',
  signed: 'success',
  lost: 'destructive',
  archived: 'outline',
};

export function LeadHeader({ lead }: LeadHeaderProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/leads');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              {lead.firstName} {lead.lastName}
            </h1>
            <Badge variant={statusColors[lead.status] || 'default'}>
              {lead.status}
            </Badge>
            {lead.currentStage && (
              <Badge
                variant="outline"
                style={{
                  borderColor: lead.currentStage.color,
                  color: lead.currentStage.color,
                }}
              >
                {lead.currentStage.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            {lead.assignedUser ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={lead.assignedUser.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {lead.assignedUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">Assigned to {lead.assignedUser.name}</span>
              </>
            ) : (
              <span className="text-sm">Unassigned</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" asChild>
          <Link href={`/leads/${lead.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
