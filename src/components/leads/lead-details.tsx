import { format } from 'date-fns';
import { Mail, Phone, MapPin, Calendar, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface LeadDetailsProps {
  lead: LeadWithRelations;
}

export function LeadDetails({ lead }: LeadDetailsProps) {
  const hasAddress = lead.addressLine1 || lead.addressCity || lead.addressState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lead.email && (
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <a
                href={`mailto:${lead.email}`}
                className="text-sm text-primary hover:underline"
              >
                {lead.email}
              </a>
            </div>
          </div>
        )}

        {lead.phone && (
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Phone</p>
              <a
                href={`tel:${lead.phone}`}
                className="text-sm text-primary hover:underline"
              >
                {lead.phone}
              </a>
            </div>
          </div>
        )}

        {hasAddress && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Address</p>
              <p className="text-sm text-muted-foreground">
                {lead.addressLine1}
                {lead.addressLine2 && <>, {lead.addressLine2}</>}
                <br />
                {lead.addressCity && <>{lead.addressCity}, </>}
                {lead.addressState} {lead.addressZip}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Created</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(lead.createdAt), 'PPP')}
            </p>
          </div>
        </div>

        {lead.source && (
          <div className="flex items-start gap-3">
            <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Source</p>
              <p className="text-sm text-muted-foreground capitalize">
                {lead.source}
              </p>
            </div>
          </div>
        )}

        {lead.tags && lead.tags.length > 0 && (
          <div className="flex items-start gap-3">
            <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
