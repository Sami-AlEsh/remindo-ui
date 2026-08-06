import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import type { Platform, Task } from '@/api/types';
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
  describePolicy,
} from '@/lib/labels';
import {
  defaultDueDateValue,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '@/lib/datetime';
import { useCreateTask, useUpdateTask } from './use-tasks';

const taskSchema = z.object({
  title: z.string().min(1, 'Give the task a title').max(200),
  content: z.string().min(1, 'Describe what to do').max(2000),
  priority: z.enum(TASK_PRIORITIES),
  recurrence: z.enum(TASK_RECURRENCES),
  dueDate: z.string().refine((value) => new Date(value) > new Date(), {
    message: 'Pick a time in the future',
  }),
  platforms: z.array(z.string()).min(1, 'Choose at least one platform'),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  linkedPlatforms: Platform[];
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  linkedPlatforms,
}: Props) {
  const isEdit = Boolean(task);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(task?.id ?? '');

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      content: '',
      priority: 'normal',
      recurrence: 'once',
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
            dueDate: toDateTimeLocalValue(task.dueDate),
            platforms: task.platforms,
          }
        : {
            title: '',
            content: '',
            priority: 'normal',
            recurrence: 'once',
            dueDate: defaultDueDateValue(),
            platforms: linkedPlatforms.slice(0, 1),
          },
    );
  }, [open, task, linkedPlatforms, form]);

  const selectedPlatforms = form.watch('platforms');
  const priority = form.watch('priority');
  const recurrence = form.watch('recurrence');
  const dueDate = form.watch('dueDate');

  function togglePlatform(platform: Platform) {
    const next = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter((p) => p !== platform)
      : [...selectedPlatforms, platform];
    form.setValue('platforms', next, { shouldValidate: true });
  }

  async function onSubmit(values: TaskFormValues) {
    const payload = {
      title: values.title,
      content: values.content,
      priority: values.priority,
      recurrence: values.recurrence,
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

  const utcHint =
    recurrence !== 'once' && dueDate && !Number.isNaN(Date.parse(dueDate))
      ? `Recurring tasks are anchored in UTC: this fires at ${new Date(dueDate)
          .toISOString()
          .slice(11, 16)} UTC every cycle.`
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dueDate">Due</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                {...form.register('dueDate')}
              />
              {form.formState.errors.dueDate && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.dueDate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="recurrence">Repeats</Label>
              <Select
                value={recurrence}
                onValueChange={(value) =>
                  form.setValue(
                    'recurrence',
                    value as TaskFormValues['recurrence'],
                  )
                }
              >
                <SelectTrigger id="recurrence">
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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="priority">Importance</Label>
            <Select
              value={priority}
              onValueChange={(value) =>
                form.setValue('priority', value as TaskFormValues['priority'])
              }
            >
              <SelectTrigger id="priority">
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
              {linkedPlatforms.map((platform) => {
                const selected = selectedPlatforms.includes(platform);
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

          {utcHint && (
            <Alert>
              <AlertDescription>{utcHint}</AlertDescription>
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
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {isEdit ? 'Save changes' : 'Schedule task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
