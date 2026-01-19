'use client';

import { useDroppable } from '@dnd-kit/core';
import { PipelineCard } from './pipeline-card';
import { cn } from '@/lib/utils';
import type { Lead, PipelineStage } from '@/lib/db/schema';

interface LeadWithUser extends Lead {
  assignedUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface PipelineColumnProps {
  stage: PipelineStage;
  leads: LeadWithUser[];
  isUpdating: boolean;
}

export function PipelineColumn({ stage, leads, isUpdating }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div
        className="flex items-center justify-between mb-3 px-2"
        style={{ borderLeftColor: stage.color, borderLeftWidth: 3 }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{stage.name}</h3>
          <span className="text-sm text-muted-foreground">({leads.length})</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'space-y-3 p-2 rounded-lg min-h-[200px] transition-colors',
          isOver && 'bg-accent',
          isUpdating && 'opacity-50 pointer-events-none'
        )}
      >
        {leads.map((lead) => (
          <PipelineCard key={lead.id} lead={lead} />
        ))}

        {leads.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No leads in this stage
          </div>
        )}
      </div>
    </div>
  );
}
