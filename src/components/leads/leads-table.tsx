'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Mail, Phone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface LeadsTableProps {
  leads: LeadWithRelations[];
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

export function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell>
              <Link
                href={`/leads/${lead.id}`}
                className="font-medium hover:underline"
              >
                {lead.firstName} {lead.lastName}
              </Link>
              {lead.source && (
                <p className="text-xs text-muted-foreground capitalize">
                  via {lead.source}
                </p>
              )}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {lead.email && (
                  <div className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[150px]">{lead.email}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              {lead.currentStage ? (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: lead.currentStage.color,
                    color: lead.currentStage.color,
                  }}
                >
                  {lead.currentStage.name}
                </Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={statusColors[lead.status] || 'default'}>
                {lead.status}
              </Badge>
            </TableCell>
            <TableCell>
              {lead.assignedUser ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={lead.assignedUser.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {lead.assignedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{lead.assignedUser.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/leads/${lead.id}`}>View Details</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/leads/${lead.id}/edit`}>Edit</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
