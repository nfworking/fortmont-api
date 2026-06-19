"use client"

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TicketPriority, TicketStatus, User } from './ticket'

// Define explicit types matching the dashboard business logic
export type CreateTicketFormState = {
  type: string ;
  department: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdById: string;
  assignedToId: string;
};

interface CreateTicketDialogProps {
  open: boolean;
  users: User[];
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: CreateTicketFormState) => Promise<void>;
}

const statuses: TicketStatus[] = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const ticketTypes = ['Incident', 'Universal', 'Service Request', 'Change Request', 'Problem'];
const departmentOptions = [
  'IAM',
  'Infrastructure',
  'Services',
  'Remote Access & Networking',
  'General',
];

const initialCreateTicketForm: CreateTicketFormState = {
  type: 'Incident',
  department: 'General',
  subject: '',
  description: '',
  priority: 'MEDIUM',
  status: 'open',
  createdById: 'unassigned',
  assignedToId: 'unassigned',
};

function statusLabel(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function displayName(user: User | null | undefined, fallback: string) {
  return user?.displayName ?? user?.email ?? fallback;
}

export function CreateTicketDialog({
  open,
  users,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: CreateTicketDialogProps) {
  const [form, setForm] = React.useState<CreateTicketFormState>(initialCreateTicketForm);
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(initialCreateTicketForm);
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const updateForm = <Key extends keyof CreateTicketFormState>(
    key: Key,
    value: CreateTicketFormState[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.subject.trim() || !form.description.trim()) {
      setError('Subject and description are required.');
      return;
    }

    try {
      setError(null);
      await onSubmit({
        ...form,
        subject: form.subject.trim(),
        description: form.description.trim(),
      });
      setForm(initialCreateTicketForm);
      setError(null);
    } catch (error) {
      console.error(error);
      setError('Ticket could not be created. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-white/10 bg-black text-white sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="pr-8">
            <DialogTitle>Create ticket</DialogTitle>
            <DialogDescription>
              Add a ticket directly to the admin queue for triage and assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-type">Type</Label>
              <Select value={form.type} onValueChange={(value) => updateForm('type', value)}>
                <SelectTrigger id="ticket-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-department">Department</Label>
              <Select
                value={form.department}
                onValueChange={(value) => updateForm('department', value)}
              >
                <SelectTrigger id="ticket-department" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => updateForm('priority', value as TicketPriority)}
              >
                <SelectTrigger id="ticket-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => updateForm('status', value as TicketStatus)}
              >
                <SelectTrigger id="ticket-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-created-by">Created by</Label>
              <Select
                value={form.createdById}
                onValueChange={(value) => updateForm('createdById', value)}
              >
                <SelectTrigger id="ticket-created-by" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unknown creator</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {displayName(user, 'Unknown user')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-assigned-to">Assigned to</Label>
              <Select
                value={form.assignedToId}
                onValueChange={(value) => updateForm('assignedToId', value)}
              >
                <SelectTrigger id="ticket-assigned-to" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {displayName(user, 'Unknown user')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              value={form.subject}
              onChange={(event) => updateForm('subject', event.target.value)}
              placeholder="Brief summary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
              placeholder="What happened, who is impacted, and any useful context."
              className="min-h-32"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}