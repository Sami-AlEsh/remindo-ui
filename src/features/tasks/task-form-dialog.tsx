import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock } from 'lucide-react';
import { z } from 'zod';

import type { Platform, PlatformStatus, Task } from '@/api/types';
import { TASK_PRIORITIES, TASK_RECURRENCES } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  WEEKDAYS,
  describePolicy,
  describeWeekdays,
} from '@/lib/labels';
import {
  crossesUtcDay,
  defaultDueDateValue,
  formatLocalTime,
  formatLocalWeekday,
  fromDateTimeLocalValue,
  localToUtcWeekday,
  nextOccurrenceOfTime,
  toDateTimeLocalValue,
  toTimeValue,
  utcToLocalWeekday,
} from '@/lib/datetime';
import { UpgradeDialog } from '@/features/billing/upgrade-dialog';
import { useSubscription } from '@/features/billing/use-billing';
import { useCreateTask, useUpdateTask } from './use-tasks';

const taskSchema = z
  .object({
    title: z.string().min(1, 'Give the task a title').max(200),
    content: z.string().min(1, 'Describe what to do').max(2000),
    priority: z.enum(TASK_PRIORITIES),
    recurrence: z.enum(TASK_RECURRENCES),
    /** Local weekdays; converted to UTC on submit. */
    recurrenceDays: z.array(z.number()),
    dueDate: z.string().refine((value) => new Date(value) > new Date(), {
      message: 'Pick a time in the future',
    }),
    platforms: z.array(z.string()).min(1, 'Choose at least one platform'),
  })
  .refine(
    (values) =>
      values.recurrence !== 'days_of_week' || values.recurrenceDays.length > 0,
    { message: 'Pick at least one day', path: ['recurrenceDays'] },
  );

type TaskFormValues = z.infer<typeof taskSchema>;

/**
 * Recurrences whose cron pattern is built from the due date's time of day
 * alone: `daily` fires every day, and `days_of_week` takes its days from the
 * weekday picker, so neither reaches the date part. Asking for a date there
 * only invites the reader to believe it means something.
 */
function isTimeOnly(recurrence: TaskFormValues['recurrence']): boolean {
  return recurrence === 'daily' || recurrence === 'days_of_week';
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  linkedPlatforms: Platform[];
  /** Full statuses so plan-locked platforms can render as upsells. */
  platformStatuses: PlatformStatus[];
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  linkedPlatforms,
  platformStatuses,
}: Props) {
  const isEdit = Boolean(task);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(task?.id ?? '');
  const { data: subscription } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const maxActiveTasks = subscription?.limits.maxActiveTasks ?? null;
  const atCap =
    !isEdit &&
    maxActiveTasks !== null &&
    (subscription?.usage.activeTasks ?? 0) >= maxActiveTasks;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      content: '',
      priority: 'normal',
      recurrence: 'once',
      recurrenceDays: [],
      dueDate: defaultDueDateValue(),
      platforms: linkedPlatforms.slice(0, 1),
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      task
        ? {
            title: task.title,
            content: task.content,
            priority: task.priority,
            recurrence: task.recurrence,
            // Stored UTC → the local days the user originally picked.
            recurrenceDays: (task.recurrenceDays ?? [])
              .map((day) => utcToLocalWeekday(day, task.dueDate))
              .sort((a, b) => a - b),
            // A recurring task's due date is its start gate, and the API
            // never advances it — so an established task's sits in the past.
            // Left as-is under a time-only field, "pick a time in the future"
            // would fire against a date the reader cannot see.
            dueDate: isTimeOnly(task.recurrence)
              ? nextOccurrenceOfTime(toTimeValue(task.dueDate))
              : toDateTimeLocalValue(task.dueDate),
            platforms: task.platforms,
          }
        : {
            title: '',
            content: '',
            priority: 'normal',
            recurrence: 'once',
            recurrenceDays: [],
            dueDate: defaultDueDateValue(),
            platforms: linkedPlatforms.slice(0, 1),
          },
    );
    // Deliberately not keyed on `linkedPlatforms`: callers derive it with
    // .filter().map() over query data, so it is a fresh array on every render
    // of theirs — and with it in the dep list any refetch behind an open
    // dialog resets the form under the user's hands. Opening (and which task)
    // is what should seed the fields; the value read above is the one current
    // at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, form]);

  const selectedPlatforms = form.watch('platforms');
  const priority = form.watch('priority');
  const recurrence = form.watch('recurrence');
  const recurrenceDays = form.watch('recurrenceDays');
  const dueDate = form.watch('dueDate');

  function togglePlatform(platform: Platform) {
    const next = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    form.setValue('platforms', next, { shouldValidate: true });
  }

  function changeRecurrence(next: TaskFormValues['recurrence']) {
    form.setValue('recurrence', next, { shouldValidate: true });
    // The date part is about to stop being shown, so re-anchor it rather than
    // leave a date the reader picked earlier silently gating the first fire.
    if (isTimeOnly(next)) {
      form.setValue('dueDate', nextOccurrenceOfTime(toTimeValue(dueDate)), {
        shouldValidate: true,
      });
    }
  }

  function toggleWeekday(day: number) {
    const next = recurrenceDays.includes(day)
      ? recurrenceDays.filter((d) => d !== day)
      : [...recurrenceDays, day].sort((a, b) => a - b);
    form.setValue('recurrenceDays', next, { shouldValidate: true });
  }

  async function onSubmit(values: TaskFormValues) {
    const payload = {
      title: values.title,
      content: values.content,
      priority: values.priority,
      recurrence: values.recurrence,
      // The API stores UTC weekdays; cron has no timezone to carry ours.
      recurrenceDays:
        values.recurrence === 'days_of_week'
          ? values.recurrenceDays
              .map((day) => localToUtcWeekday(day, values.dueDate))
              .sort((a, b) => a - b)
          : [],
      dueDate: fromDateTimeLocalValue(values.dueDate),
      platforms: values.platforms as Platform[],
    };

    try {
      if (task) await updateTask.mutateAsync(payload);
      else await createTask.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      // The mutation hooks surface the error as a toast.
    }
  }

  const hasDueDate = Boolean(dueDate) && !Number.isNaN(Date.parse(dueDate));
  const timeOnly = isTimeOnly(recurrence);

  // Says back what the API's cron pattern will do, in the local terms the
  // reader picked it in. Only for the recurrences whose field no longer shows
  // a date, plus `weekly`, where the day is implied by one rather than stated.
  const cadenceHint = !hasDueDate
    ? null
    : recurrence === 'daily'
      ? `Every day at ${formatLocalTime(dueDate)}.`
      : recurrence === 'weekly'
        ? `Every ${formatLocalWeekday(dueDate)} at ${formatLocalTime(dueDate)}.`
        : recurrence === 'days_of_week' && recurrenceDays.length > 0
          ? recurrenceDays.length === WEEKDAYS.length
            ? `Every day at ${formatLocalTime(dueDate)}.`
            : `Every ${describeWeekdays(recurrenceDays)} at ${formatLocalTime(dueDate)}.`
          : null;

  const utcHint =
    recurrence !== 'once' && hasDueDate
      ? `Recurring tasks are anchored in UTC: this fires at ${new Date(dueDate)
          .toISOString()
          .slice(11, 16)} UTC every cycle.`
      : null;

  // At this time of day the UTC weekday differs from the local one. Spell out
  // what actually gets stored, or the saved task reads as a day off. Skipped
  // when the whole week is picked, since the shift then changes nothing.
  const weekdayShiftHint =
    recurrence === 'days_of_week' &&
    hasDueDate &&
    recurrenceDays.length > 0 &&
    recurrenceDays.length < WEEKDAYS.length &&
    crossesUtcDay(dueDate)
      ? `Your ${describeWeekdays(recurrenceDays)} is ${describeWeekdays(
          recurrenceDays.map((day) => localToUtcWeekday(day, dueDate)),
        )} in UTC — reminders still arrive on the days you picked, local time.`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
          <DialogDescription>
            Remindo keeps reminding you until you confirm or snooze.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-destructive text-xs">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Details</Label>
            <Textarea id="content" rows={3} {...form.register('content')} />
            {form.formState.errors.content && (
              <p className="text-destructive text-xs">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          {/* Repeats leads: it decides whether the field beside it asks for a
              date at all, and a control should not change shape behind you. */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="recurrence">Repeats</Label>
              <Select
                value={recurrence}
                onValueChange={(value) =>
                  changeRecurrence(value as TaskFormValues['recurrence'])
                }
              >
                <SelectTrigger id="recurrence" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_RECURRENCES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {RECURRENCE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="dueDate">
                {timeOnly ? 'Remind me at' : 'Remind me on'}
              </Label>
              {/* Separate keys: swapping a registered field for a controlled
                  one on a single DOM node trips React's uncontrolled warning.
                  The time input writes the whole due date, keeping the date
                  part the API requires out of the reader's way. */}
              {timeOnly ? (
                <Input
                  key="time"
                  id="dueDate"
                  type="time"
                  value={toTimeValue(dueDate)}
                  onChange={(event) =>
                    form.setValue(
                      'dueDate',
                      nextOccurrenceOfTime(event.target.value),
                      { shouldValidate: true },
                    )
                  }
                />
              ) : (
                <Input
                  key="datetime"
                  id="dueDate"
                  type="datetime-local"
                  {...form.register('dueDate')}
                />
              )}
              {form.formState.errors.dueDate && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.dueDate.message}
                </p>
              )}
            </div>
          </div>

          {recurrence === 'days_of_week' && (
            <div className="flex flex-col gap-2">
              <Label>Repeat on</Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map(({ value, short }) => {
                  const selected = recurrenceDays.includes(value);
                  return (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      aria-pressed={selected}
                      className="w-13"
                      onClick={() => toggleWeekday(value)}
                    >
                      {short}
                    </Button>
                  );
                })}
              </div>
              {form.formState.errors.recurrenceDays && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.recurrenceDays.message}
                </p>
              )}
            </div>
          )}

          {cadenceHint && (
            <p className="text-muted-foreground -mt-2 text-xs">{cadenceHint}</p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">Importance</Label>
            <Select
              value={priority}
              onValueChange={(value) =>
                form.setValue('priority', value as TaskFormValues['priority'])
              }
            >
              <SelectTrigger id="priority" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PRIORITY_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {describePolicy(priority)}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Deliver to</Label>
            <div className="flex flex-wrap gap-2">
              {platformStatuses
                .filter((status) => status.implemented)
                .map((status) => {
                  const { platform } = status;
                  const selected = selectedPlatforms.includes(platform);

                  if (!status.availableOnPlan) {
                    return (
                      <Button
                        key={platform}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-muted-foreground border-dashed"
                        title="Included in Pro"
                        onClick={() => setUpgradeOpen(true)}
                      >
                        <Lock className="size-3.5" />
                        {PLATFORM_LABELS[platform]}
                      </Button>
                    );
                  }

                  if (!status.linked) {
                    return (
                      <Button
                        key={platform}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled
                        title="Link this platform first (Platforms page)"
                      >
                        {PLATFORM_LABELS[platform]}
                      </Button>
                    );
                  }

                  return (
                    <Button
                      key={platform}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => togglePlatform(platform)}
                    >
                      {PLATFORM_LABELS[platform]}
                    </Button>
                  );
                })}
            </div>
            {form.formState.errors.platforms && (
              <p className="text-destructive text-xs">
                {form.formState.errors.platforms.message}
              </p>
            )}
          </div>

          {atCap && (
            <Alert>
              <Lock className="size-4" />
              <AlertDescription>
                You&apos;ve used all {maxActiveTasks} reminders on the free
                plan. Finish or delete one — or go unlimited with Pro.
                <Button
                  type="button"
                  size="sm"
                  className="mt-2 w-fit"
                  onClick={() => setUpgradeOpen(true)}
                >
                  Upgrade
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {(utcHint || weekdayShiftHint) && (
            <Alert>
              <AlertDescription className="flex flex-col gap-1">
                {utcHint && <span>{utcHint}</span>}
                {weekdayShiftHint && <span>{weekdayShiftHint}</span>}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || atCap}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {isEdit ? 'Save changes' : 'Schedule task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </Dialog>
  );
}
