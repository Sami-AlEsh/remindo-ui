import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TaskPriority, TaskStatus } from '@/api/types';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/labels';

const STATUS_STYLES: Record<TaskStatus, string> = {
  scheduled: 'bg-muted text-muted-foreground',
  reminding: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  snoozed: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  acknowledged: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  missed: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  normal: 'text-muted-foreground',
  important: 'text-amber-600 dark:text-amber-400',
  urgent: 'text-red-600 dark:text-red-400',
};

export const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  normal: 'bg-muted-foreground/30',
  important: 'bg-amber-500',
  urgent: 'bg-red-500',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="secondary" className={cn('border-0', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function PriorityLabel({ priority }: { priority: TaskPriority }) {
  return (
    <span className={cn('text-xs font-medium', PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
