import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { TaskPriority, TaskStatus } from '@/api/types';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/labels';

/**
 * The two axes are styled deliberately differently — priority is a solid
 * ladder, status a soft tint — so that a card never reads as one signal.
 */

const STATUS_STYLES: Record<TaskStatus, string> = {
  scheduled: 'bg-status-scheduled text-status-scheduled-foreground',
  reminding: 'bg-status-reminding text-status-reminding-foreground',
  snoozed: 'bg-status-snoozed text-status-snoozed-foreground',
  acknowledged: 'bg-status-ack text-status-ack-foreground',
  missed: 'bg-status-missed text-status-missed-foreground',
};

const PRIORITY_PILL_STYLES: Record<TaskPriority, string> = {
  normal: 'bg-prio-normal text-prio-normal-foreground',
  important: 'bg-prio-important text-prio-important-foreground',
  urgent: 'bg-prio-urgent text-prio-urgent-foreground',
};

export const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  normal: 'bg-prio-normal',
  important: 'bg-prio-important',
  urgent: 'bg-prio-urgent',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="secondary" className={cn('border-0', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/** Priority as a solid pill on the nag-frequency ladder. */
export function PriorityPill({ priority }: { priority: TaskPriority }) {
  return (
    <Badge
      className={cn(
        'border-0 font-semibold tracking-tight',
        PRIORITY_PILL_STYLES[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
