'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { EmailTemplate, PipelineStage } from '@/lib/db/schema';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface AutomationBuilderProps {
  templates: EmailTemplate[];
  stages: PipelineStage[];
  teamMembers: TeamMember[];
  initialData?: {
    name: string;
    description?: string;
    triggerType: string;
    triggerConfig?: Record<string, unknown>;
    steps: Array<{
      actionType: string;
      actionConfig?: Record<string, unknown>;
    }>;
  };
}

interface Step {
  id: string;
  actionType: string;
  actionConfig: Record<string, unknown>;
}

const triggerTypes = [
  { value: 'lead_created', label: 'When a lead is created' },
  { value: 'stage_changed', label: 'When lead stage changes' },
  { value: 'status_changed', label: 'When lead status changes' },
  { value: 'manual', label: 'Manual trigger' },
];

const actionTypes = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'assign_user', label: 'Assign to User' },
  { value: 'move_stage', label: 'Move to Stage' },
  { value: 'change_status', label: 'Change Status' },
  { value: 'add_tag', label: 'Add Tag' },
  { value: 'wait', label: 'Wait' },
];

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'signed', label: 'Signed' },
  { value: 'lost', label: 'Lost' },
];

export function AutomationBuilder({
  templates,
  stages,
  teamMembers,
  initialData,
}: AutomationBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [triggerType, setTriggerType] = useState(initialData?.triggerType || '');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(
    initialData?.triggerConfig || {}
  );
  const [steps, setSteps] = useState<Step[]>(
    initialData?.steps?.map((s, i) => ({
      id: `step-${i}`,
      actionType: s.actionType,
      actionConfig: s.actionConfig || {},
    })) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addStep = () => {
    setSteps([
      ...steps,
      {
        id: `step-${Date.now()}`,
        actionType: '',
        actionConfig: {},
      },
    ]);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const updateStep = (id: string, field: string, value: unknown) => {
    setSteps(
      steps.map((s) =>
        s.id === id
          ? field === 'actionType'
            ? { ...s, actionType: value as string, actionConfig: {} }
            : { ...s, actionConfig: { ...s.actionConfig, [field]: value } }
          : s
      )
    );
  };

  const handleSubmit = async () => {
    if (!name || !triggerType) {
      setError('Name and trigger type are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          triggerType,
          triggerConfig: Object.keys(triggerConfig).length > 0 ? triggerConfig : undefined,
          steps: steps
            .filter((s) => s.actionType)
            .map((s, i) => ({
              position: i,
              actionType: s.actionType,
              actionConfig:
                Object.keys(s.actionConfig).length > 0 ? s.actionConfig : undefined,
            })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to create automation');
        return;
      }

      router.push('/automations');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Automation Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Welcome Email Sequence"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trigger">Trigger *</Label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger>
              <SelectValue placeholder="Select trigger" />
            </SelectTrigger>
            <SelectContent>
              {triggerTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this automation does..."
          rows={2}
        />
      </div>

      {/* Trigger Config */}
      {triggerType === 'stage_changed' && stages.length > 0 && (
        <div className="space-y-2">
          <Label>When moved to stage</Label>
          <Select
            value={(triggerConfig.stageId as string) || ''}
            onValueChange={(v) => setTriggerConfig({ ...triggerConfig, stageId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Actions</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="mr-2 h-4 w-4" />
            Add Action
          </Button>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            No actions yet. Add an action to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <Card key={step.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-2 text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Step {index + 1}
                        </span>
                      </div>

                      <Select
                        value={step.actionType}
                        onValueChange={(v) => updateStep(step.id, 'actionType', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Action-specific config */}
                      {step.actionType === 'send_email' && (
                        <Select
                          value={(step.actionConfig.templateId as string) || ''}
                          onValueChange={(v) => updateStep(step.id, 'templateId', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select email template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.length === 0 ? (
                              <SelectItem value="" disabled>
                                No templates available
                              </SelectItem>
                            ) : (
                              templates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}

                      {step.actionType === 'assign_user' && (
                        <Select
                          value={(step.actionConfig.userId as string) || ''}
                          onValueChange={(v) => updateStep(step.id, 'userId', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {step.actionType === 'move_stage' && (
                        <Select
                          value={(step.actionConfig.stageId as string) || ''}
                          onValueChange={(v) => updateStep(step.id, 'stageId', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {step.actionType === 'change_status' && (
                        <Select
                          value={(step.actionConfig.statusValue as string) || ''}
                          onValueChange={(v) => updateStep(step.id, 'statusValue', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {step.actionType === 'add_tag' && (
                        <Input
                          placeholder="Tag name"
                          value={(step.actionConfig.tagName as string) || ''}
                          onChange={(e) => updateStep(step.id, 'tagName', e.target.value)}
                        />
                      )}

                      {step.actionType === 'wait' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Duration"
                            className="w-24"
                            value={(step.actionConfig.delayMinutes as number) || ''}
                            onChange={(e) =>
                              updateStep(step.id, 'delayMinutes', parseInt(e.target.value))
                            }
                          />
                          <span className="text-sm text-muted-foreground">minutes</span>
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(step.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="flex gap-4">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Automation
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
