'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Send, Loader2, MessageSquare, Mail, ArrowRight, User, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TimelineEntry } from '@/lib/db/schema';

interface TimelineEntryWithUser extends TimelineEntry {
  createdBy: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

interface LeadTimelineProps {
  leadId: string;
  entries: TimelineEntryWithUser[];
}

const entryIcons: Record<string, React.ReactNode> = {
  note: <MessageSquare className="h-4 w-4" />,
  email_sent: <Mail className="h-4 w-4" />,
  email_received: <Mail className="h-4 w-4" />,
  stage_change: <ArrowRight className="h-4 w-4" />,
  status_change: <ArrowRight className="h-4 w-4" />,
  assignment: <User className="h-4 w-4" />,
  automation: <Zap className="h-4 w-4" />,
  system: <Zap className="h-4 w-4" />,
};

export function LeadTimeline({ leadId, entries }: LeadTimelineProps) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note }),
      });

      if (response.ok) {
        setNote('');
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Note */}
      <div className="flex gap-3">
        <Textarea
          placeholder="Add a note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[80px]"
        />
        <Button
          onClick={handleAddNote}
          disabled={!note.trim() || isSubmitting}
          size="icon"
          className="shrink-0"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Timeline Entries */}
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No activity yet. Add a note to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-3">
              <div className="flex-shrink-0">
                {entry.createdBy ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.createdBy.avatarUrl || undefined} />
                    <AvatarFallback>
                      {entry.createdBy.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    {entryIcons[entry.entryType] || <Zap className="h-4 w-4" />}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {entry.createdBy?.name || 'System'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {entry.content && (
                  <p className="text-sm text-muted-foreground">{entry.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
