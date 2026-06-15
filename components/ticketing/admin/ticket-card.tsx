import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  PlayCircle,
  UserRound,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Ticket } from './ticket';
import { PriorityBadge } from './priority-badge';
import { StatusBadge } from './status-badge';
import { TypeBadge } from './type-badge';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  onQuickUpdate?: (ticket: Ticket, updates: Partial<Ticket>) => void;
}

export function TicketCard({ ticket, onClick, onQuickUpdate }: TicketCardProps) {
  const assigneeName = ticket.assignedTo?.displayName ?? ticket.assignedTo?.email ?? 'Unassigned';
  const creatorName = ticket.createdBy?.displayName ?? ticket.createdBy?.email ?? 'Unknown creator';
  const initials = assigneeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const createdAgo = formatDistanceToNow(new Date(ticket.createdAt), {
    addSuffix: true,
  });

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:border-border/80',
        'bg-card'
      )}
      onClick={() => onClick?.(ticket)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={ticket.status} />
              <TypeBadge type={ticket.type} />
              <PriorityBadge priority={ticket.priority} />
            </div>

            <h3 className="font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
              {ticket.subject}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {ticket.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span>{ticket.department}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{createdAgo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5" />
                <span>{creatorName}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onQuickUpdate?.(ticket, { status: 'in_progress' })}>
                  <PlayCircle className="h-4 w-4" />
                  Mark in progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onQuickUpdate?.(ticket, { status: 'pending' })}>
                  <Clock className="h-4 w-4" />
                  Mark pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onQuickUpdate?.(ticket, { status: 'resolved' })}>
                  <CheckCircle2 className="h-4 w-4" />
                  Resolve
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onQuickUpdate?.(ticket, { status: 'closed' })}>
                  <XCircle className="h-4 w-4" />
                  Close
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Assigned to</span>
                <span className="text-sm font-medium">
                  {assigneeName}
                </span>
              </div>
              <Avatar className="h-8 w-8">
                {ticket.assignedTo?.avatarUrl && (
                  <AvatarImage src={ticket.assignedTo.avatarUrl} alt={assigneeName} />
                )}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
