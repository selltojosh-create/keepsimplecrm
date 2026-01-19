'use client';

import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Mail, Phone, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Lead } from '@/lib/db/schema';

interface LeadWithUser extends Lead {
  assignedUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface PipelineCardProps {
  lead: LeadWithUser;
  isDragging?: boolean;
}

export function PipelineCard({ lead, isDragging }: PipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <Link
              href={`/leads/${lead.id}`}
              className="font-medium hover:underline truncate block"
            >
              {lead.firstName} {lead.lastName}
            </Link>

            <div className="mt-1 space-y-1">
              {lead.email && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{lead.phone}</span>
                </div>
              )}
            </div>

            {lead.assignedUser && (
              <div className="mt-2 flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={lead.assignedUser.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {lead.assignedUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {lead.assignedUser.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
