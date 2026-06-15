import * as React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Ticket } from './ticket';

interface TicketFiltersProps {
  tickets: Ticket[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  priority: string;
  department: string;
  type: string;
  status: string;
}

const priorities = ['All Priorities', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const statuses = ['All Statuses', 'open', 'in_progress', 'pending', 'resolved', 'closed'];

function uniqueValues(tickets: Ticket[], key: 'department' | 'type') {
  return Array.from(
    new Set(tickets.map((ticket) => ticket[key]).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function statusLabel(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function TicketFilters({ tickets, onFilterChange }: TicketFiltersProps) {
  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    priority: 'All Priorities',
    department: 'All Departments',
    type: 'All Types',
    status: 'All Statuses',
  });
  const [showFilters, setShowFilters] = React.useState(false);
  const departments = React.useMemo(
    () => ['All Departments', ...uniqueValues(tickets, 'department')],
    [tickets]
  );
  const types = React.useMemo(
    () => ['All Types', ...uniqueValues(tickets, 'type')],
    [tickets]
  );

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      priority: 'All Priorities',
      department: 'All Departments',
      type: 'All Types',
      status: 'All Statuses',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value !== '';
    if (key === 'priority') return value !== 'All Priorities';
    if (key === 'department') return value !== 'All Departments';
    if (key === 'type') return value !== 'All Types';
    if (key === 'status') return value !== 'All Statuses';
    return false;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-lg bg-muted/50 border">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Priority</label>
            <Select value={filters.priority} onValueChange={(v) => updateFilter('priority', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Select value={filters.status} onValueChange={(v) => updateFilter('status', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'All Statuses' ? s : statusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Department</label>
            <Select value={filters.department} onValueChange={(v) => updateFilter('department', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Type</label>
            <Select value={filters.type} onValueChange={(v) => updateFilter('type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
