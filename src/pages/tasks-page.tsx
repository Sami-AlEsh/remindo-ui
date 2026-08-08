import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Inbox, PauseCircle, Plug, Plus } from 'lucide-react';

import type { Task, TaskListQuery, TaskPriority, TaskStatus } from '@/api/types';
import { TASK_PRIORITIES, TASK_STATUSES, isAwaitingAction } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/labels';
import { TaskCard } from '@/features/tasks/task-card';
import { TaskFormDialog } from '@/features/tasks/task-form-dialog';
import {
  useDeleteTask,
  useTaskAction,
  useTaskList,
} from '@/features/tasks/use-tasks';
import { usePlatforms } from '@/features/platforms/use-platforms';
import { useSubscription } from '@/features/billing/use-billing';
import { UpgradeDialog } from '@/features/billing/upgrade-dialog';

const ALL = 'all';

export function TasksPage() {
  const [status, setStatus] = useState<TaskStatus | typeof ALL>(ALL);
  const [priority, setPriority] = useState<TaskPriority | typeof ALL>(ALL);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();

  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data: platformStatuses } = usePlatforms();
  const linkedPlatforms = (platformStatuses ?? [])
    .filter((p) => p.linked)
    .map((p) => p.platform);
  const hasLinkedPlatform = linkedPlatforms.length > 0;

  const { data: subscription } = useSubscription();
  const maxActiveTasks = subscription?.limits.maxActiveTasks ?? null;
  const activeTasks = subscription?.usage.activeTasks ?? 0;
  const overCap = maxActiveTasks !== null && activeTasks > maxActiveTasks;

  const query: TaskListQuery = useMemo(
    () => ({
      page,
      limit: 20,
      sortBy: 'dueDate',
      sortOrder: 'asc',
      ...(status === ALL ? {} : { status }),
      ...(priority === ALL ? {} : { priority }),
    }),
    [page, status, priority],
  );

  const { data, isPending } = useTaskList(query);
  const confirmAction = useTaskAction('confirm');
  const snoozeAction = useTaskAction('snooze');
  const deleteTask = useDeleteTask();

  const tasks = data?.items ?? [];
  const awaiting = tasks.filter(isAwaitingAction);
  const rest = tasks.filter((task) => !isAwaitingAction(task));
  const actionPending = confirmAction.isPending || snoozeAction.isPending;

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setFormOpen(true);
  }

  const cardHandlers = {
    onEdit: openEdit,
    onDelete: (task: Task) => deleteTask.mutate(task.id),
    onConfirm: (task: Task) => confirmAction.mutate(task.id),
    onSnooze: (task: Task) => snoozeAction.mutate(task.id),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground text-sm">
            Remindo keeps nudging you until you confirm.
          </p>
        </div>
        <Button onClick={openCreate} disabled={!hasLinkedPlatform}>
          <Plus className="size-4" />
          New task
        </Button>
      </div>

      {!hasLinkedPlatform && (
        <Alert>
          <Plug className="size-4" />
          <AlertTitle>Link a platform to get started</AlertTitle>
          <AlertDescription>
            Reminders need somewhere to go. Link Telegram and you can start
            creating tasks.
            <Button asChild size="sm" className="mt-2 w-fit">
              <Link to="/platforms">Link Telegram</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {maxActiveTasks !== null && (
        <div className="bg-card flex items-center gap-3 rounded-lg border px-4 py-3">
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium tabular-nums">
                {Math.min(activeTasks, maxActiveTasks)} of {maxActiveTasks}{' '}
                free reminders used
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary h-7"
                onClick={() => setUpgradeOpen(true)}
              >
                Go unlimited
              </Button>
            </div>
            <div
              className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={Math.min(activeTasks, maxActiveTasks)}
              aria-valuemax={maxActiveTasks}
            >
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (activeTasks / maxActiveTasks) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {overCap && (
        <Alert>
          <PauseCircle className="size-4" />
          <AlertTitle>Some reminders are paused</AlertTitle>
          <AlertDescription>
            The free plan delivers your {maxActiveTasks} oldest active
            reminders.{' '}
            {activeTasks - (maxActiveTasks ?? 0) === 1
              ? 'One newer reminder is paused and won’t be delivered.'
              : `${activeTasks - (maxActiveTasks ?? 0)} newer reminders are paused and won’t be delivered.`}
            <Button
              size="sm"
              className="mt-2 w-fit"
              onClick={() => setUpgradeOpen(true)}
            >
              Upgrade to Pro
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {awaiting.length > 0 && (
        <section className="border-prio-urgent/30 bg-prio-urgent/5 flex flex-col gap-3 rounded-xl border p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BellRing className="text-prio-urgent size-4" />
            Needs your attention
            <span className="text-muted-foreground font-normal">
              ({awaiting.length})
            </span>
          </h2>
          {awaiting.map((task) => (
            // The heavy 2px border is reserved for genuinely urgent
            // escalations; applying it to every card in the band would
            // double-border the panel and flatten the distinction it exists
            // to draw.
            <TaskCard
              key={task.id}
              task={task}
              attention={task.priority === 'urgent'}
              actionPending={actionPending}
              {...cardHandlers}
            />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-sm font-medium">All tasks</h2>

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as TaskStatus | typeof ALL);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any status</SelectItem>
              {TASK_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priority}
            onValueChange={(value) => {
              setPriority(value as TaskPriority | typeof ALL);
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any importance</SelectItem>
              {TASK_PRIORITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        )}

        {!isPending && tasks.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-lg border border-dashed py-14 text-center">
            <Inbox className="size-8" />
            <div>
              <p className="text-foreground font-medium">No tasks yet</p>
              <p className="text-sm">
                {hasLinkedPlatform
                  ? 'Create one and Remindo will chase you about it.'
                  : 'Link a platform first, then create your first task.'}
              </p>
            </div>
            {hasLinkedPlatform && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="size-4" />
                New task
              </Button>
            )}
          </div>
        )}

        {rest.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            actionPending={actionPending}
            {...cardHandlers}
          />
        ))}

        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editing}
        linkedPlatforms={linkedPlatforms}
        platformStatuses={platformStatuses ?? []}
      />

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
