'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { PipelineColumn } from './pipeline-column';
import { PipelineCard } from './pipeline-card';
import type { Lead, PipelineStage } from '@/lib/db/schema';

interface LeadWithUser extends Lead {
  assignedUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface StageWithLeads extends PipelineStage {
  leads: LeadWithUser[];
}

interface PipelineBoardProps {
  stages: StageWithLeads[];
  pipelineId: string;
}

export function PipelineBoard({ stages, pipelineId }: PipelineBoardProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activeLead = activeId
    ? stages.flatMap((s) => s.leads).find((l) => l.id === activeId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStageId = over.id as string;

    // Find current stage
    const currentStage = stages.find((s) =>
      s.leads.some((l) => l.id === leadId)
    );

    if (!currentStage || currentStage.id === newStageId) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStageId: newStageId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to move lead:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)]">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            leads={stage.leads}
            isUpdating={isUpdating}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? <PipelineCard lead={activeLead} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
