'use client';

import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { AuditLogEntry, User } from '@/lib/db/schema';

interface AuditLogListProps {
  logs: Array<{ log: AuditLogEntry; user: User }>;
}

const actionLabels: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  login: 'Logged in',
  logout: 'Logged out',
  invite: 'Invited',
  remove: 'Removed',
  role_change: 'Changed role',
  stage_change: 'Changed stage',
  status_change: 'Changed status',
  email_sent: 'Sent email',
  automation_enrolled: 'Enrolled in automation',
};

const targetTypeLabels: Record<string, string> = {
  lead: 'Lead',
  user: 'User',
  team: 'Team',
  automation: 'Automation',
  template: 'Template',
  pipeline: 'Pipeline',
  organization: 'Organization',
};

const roleColors: Record<string, string> = {
  platform_owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  auditor: 'bg-yellow-100 text-yellow-700',
  manager: 'bg-green-100 text-green-700',
  member: 'bg-gray-100 text-gray-700',
};

export function AuditLogList({ logs }: AuditLogListProps) {
  return (
    <div className="space-y-2">
      <Accordion type="single" collapsible className="w-full">
        {logs.map(({ log, user }) => (
          <AccordionItem key={log.id} value={log.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {user.name || user.email.split('@')[0]}
                    </span>
                    <Badge className={roleColors[log.userRole] || roleColors.member} variant="outline">
                      {log.userRole}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {actionLabels[log.action] || log.action}
                    {log.targetType && (
                      <span>
                        {' '}
                        {targetTypeLabels[log.targetType] || log.targetType}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-11 space-y-3">
                <div className="grid gap-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Action:</span>
                    <span>{log.action}</span>
                  </div>
                  {log.targetType && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Target:</span>
                      <span>
                        {targetTypeLabels[log.targetType] || log.targetType}
                        {log.targetId && (
                          <span className="text-muted-foreground ml-1">
                            ({log.targetId.slice(0, 8)}...)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {log.ipAddress && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span>{log.ipAddress}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">Time:</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-muted-foreground">Details:</span>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
