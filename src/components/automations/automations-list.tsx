'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Zap, MoreHorizontal, Play, Pause, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Automation, AutomationStep } from '@/lib/db/schema';

interface AutomationWithSteps extends Automation {
  steps: AutomationStep[];
  stepCount: number;
}

interface AutomationsListProps {
  automations: AutomationWithSteps[];
}

const triggerLabels: Record<string, string> = {
  lead_created: 'When lead is created',
  stage_changed: 'When stage changes',
  status_changed: 'When status changes',
  time_delay: 'After time delay',
  manual: 'Manual trigger',
};

export function AutomationsList({ automations }: AutomationsListProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleActive = async (id: string, isActive: boolean) => {
    setUpdating(id);

    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error);
    } finally {
      setUpdating(null);
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to delete automation:', error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {automations.map((automation) => (
        <Card key={automation.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg ${
                    automation.isActive ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  <Zap
                    className={`h-4 w-4 ${
                      automation.isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <div>
                  <CardTitle className="text-base">
                    <Link
                      href={`/automations/${automation.id}`}
                      className="hover:underline"
                    >
                      {automation.name}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {triggerLabels[automation.triggerType] || automation.triggerType}
                  </CardDescription>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/automations/${automation.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toggleActive(automation.id, automation.isActive)}
                  >
                    {automation.isActive ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteAutomation(automation.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            {automation.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {automation.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{automation.stepCount} steps</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(automation.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <Switch
                checked={automation.isActive}
                disabled={updating === automation.id}
                onCheckedChange={() =>
                  toggleActive(automation.id, automation.isActive)
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
