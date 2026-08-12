import {
  Check,
  Clock,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  Repeat,
  Send,
  Trash2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Task } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PLATFORM_LABELS,
  PRIORITY_POLICY,
  RECURRENCE_LABELS,
  describePolicy,
} from '@/lib/labels';
import { formatLocal, formatRelative, formatUtcTime } from '@/lib/datetime';
import { isAwaitingAction } from '@/api/types';
import { PRIORITY_ACCENT, PriorityPill, StatusBadge } from './task-badges';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onConfirm: (task: Task) => void;
  onSnooze: (task: Task) => void;
  actionPending?: boolean;
  /** Pinned escalation treatment for the "Needs your attention" section. */
  attention?: boolean;
  /**
   * Showcase rendering — drops the edit/delete menu. The landing page renders
   * this card for real so the marketing cannot drift from the product, but a
   * visitor with no account has nothing to edit or delete.
   */
  demo?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onConfirm,
  onSnooze,
  actionPending,
  attention,
  demo,
}: Props) {
  const awaiting = isAwaitingAction(task);
  const recurring = task.recurrence !== 'once';
  const done = task.status === 'acknowledged';

  return (
    <div
      className={cn(
        'bg-card relative flex gap-4 overflow-hidden rounded-lg border p-4 transition-colors duration-300',
        attention && 'border-prio-urgent border-2',
        // Resting state for a confirmed task. A tint rather than a fade: these
        // stay in the list and get refetched, so dimming them would park real
        // content below readable contrast.
        done && 'bg-status-ack/40',
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-1.5',
          PRIORITY_ACCENT[task.priority],
        )}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 pl-3">
        {/* Signal row — both axes first, so urgency is scannable before prose. */}
        <div className="flex flex-wrap items-center gap-2">
          <PriorityPill priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.deliverySuppressed && (
            <span
              className="text-muted-foreground flex items-center gap-1 text-xs font-medium"
              title="Beyond the free plan's limit — this reminder won't be delivered until you upgrade or make room."
            >
              <PauseCircle className="size-3.5" />
              Paused — plan limit
            </span>
          )}
          {recurring && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Repeat className="size-3.5" />
              {RECURRENCE_LABELS[task.recurrence]}
            </span>
          )}
          <span className="text-muted-foreground ml-auto flex items-center gap-1.5 text-xs tabular-nums">
            <Clock className="size-3.5" />
            {formatRelative(task.dueDate)}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-bold tracking-tight">{task.title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {task.content}
          </p>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
          <span>{formatLocal(task.dueDate)}</span>
          {recurring && <span>UTC anchor {formatUtcTime(task.dueDate)}</span>}
          <span className="flex items-center gap-1.5">
            <Send className="size-3" />
            {task.platforms.map((p) => PLATFORM_LABELS[p]).join(', ')}
          </span>
          {task.status === 'reminding' && (
            <span className="text-status-reminding-foreground font-medium">
              Attempt {task.attempt} · {describePolicy(task.priority)}
            </span>
          )}
          {task.snoozeCount > 0 && <span>Snoozed {task.snoozeCount}×</span>}
        </div>

        {awaiting && (
          <div className="mt-1 flex gap-2">
            <Button
              size="sm"
              className="font-semibold"
              onClick={() => onConfirm(task)}
              disabled={actionPending}
            >
              <Check className="size-4" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onSnooze(task)}
              disabled={actionPending || task.status === 'snoozed'}
            >
              <Clock className="size-4" />
              Snooze {PRIORITY_POLICY[task.priority].snoozeMin} min
            </Button>
          </div>
        )}
      </div>

      {!demo && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Task actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(task)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(task)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
