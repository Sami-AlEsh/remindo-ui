import {
  Check,
  Clock,
  MoreHorizontal,
  Pencil,
  Repeat,
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
  RECURRENCE_LABELS,
  describePolicy,
} from '@/lib/labels';
import { formatLocal, formatRelative, formatUtcTime } from '@/lib/datetime';
import { isAwaitingAction } from '@/api/types';
import { PRIORITY_ACCENT, PriorityLabel, StatusBadge } from './task-badges';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onConfirm: (task: Task) => void;
  onSnooze: (task: Task) => void;
  actionPending?: boolean;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onConfirm,
  onSnooze,
  actionPending,
}: Props) {
  const awaiting = isAwaitingAction(task);
  const recurring = task.recurrence !== 'once';

  return (
    <div className="bg-card relative flex gap-4 overflow-hidden rounded-lg border p-4">
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          PRIORITY_ACCENT[task.priority],
        )}
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2 pl-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium">{task.title}</h3>
          <StatusBadge status={task.status} />
          <PriorityLabel priority={task.priority} />
        </div>

        <p className="text-muted-foreground line-clamp-2 text-sm">
          {task.content}
        </p>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {formatLocal(task.dueDate)} ({formatRelative(task.dueDate)})
          </span>

          {recurring && (
            <span className="flex items-center gap-1.5">
              <Repeat className="size-3.5" />
              {RECURRENCE_LABELS[task.recurrence]} at{' '}
              {formatUtcTime(task.dueDate)}
            </span>
          )}

          <span>{task.platforms.map((p) => PLATFORM_LABELS[p]).join(', ')}</span>

          {task.status === 'reminding' && (
            <span>
              Attempt {task.attempt} · {describePolicy(task.priority)}
            </span>
          )}

          {task.snoozeCount > 0 && <span>Snoozed {task.snoozeCount}×</span>}
        </div>

        {awaiting && (
          <div className="mt-1 flex gap-2">
            <Button
              size="sm"
              onClick={() => onConfirm(task)}
              disabled={actionPending}
            >
              <Check className="size-4" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSnooze(task)}
              disabled={actionPending || task.status === 'snoozed'}
            >
              <Clock className="size-4" />
              Snooze
            </Button>
          </div>
        )}
      </div>

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
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(task)}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
