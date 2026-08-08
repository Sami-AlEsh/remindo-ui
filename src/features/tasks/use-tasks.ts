import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ApiError } from '@/api/errors';
import { tasksApi } from '@/api/endpoints';
import { billingKeys } from '@/features/billing/use-billing';
import type {
  CreateTaskInput,
  TaskListQuery,
  UpdateTaskInput,
} from '@/api/types';
import { isPlanErrorCode } from '@/api/types';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (query: TaskListQuery) => ['tasks', 'list', query] as const,
  detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
};

// Task status changes on the server while nobody is looking: the queue worker
// escalates reminders, and the user may confirm from Telegram instead. Polling
// keeps the screen honest without a websocket.
const LIVE_REFETCH_MS = 15_000;

export function useTaskList(query: TaskListQuery) {
  return useQuery({
    queryKey: taskKeys.list(query),
    queryFn: () => tasksApi.list(query),
    refetchInterval: LIVE_REFETCH_MS,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.detail(taskId ?? ''),
    queryFn: () => tasksApi.get(taskId as string),
    enabled: Boolean(taskId),
  });
}

function describeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.messages[0] ?? fallback;
  return fallback;
}

/**
 * Plan refusals get an Upgrade action instead of a dead-end error — the API
 * message already explains the limit, the button gives the way out.
 */
function usePlanAwareErrorToast() {
  const navigate = useNavigate();

  return (error: unknown, fallback: string) => {
    if (error instanceof ApiError && isPlanErrorCode(error.code)) {
      toast.error(error.messages[0] ?? fallback, {
        action: {
          label: 'Upgrade',
          onClick: () => void navigate('/pricing'),
        },
      });
      return;
    }
    toast.error(describeError(error, fallback));
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const toastError = usePlanAwareErrorToast();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      // The plan usage meter counts active tasks.
      await queryClient.invalidateQueries({
        queryKey: billingKeys.subscription,
      });
      toast.success('Task scheduled');
    },
    onError: (error) => {
      toastError(error, 'Could not create the task');
    },
  });
}

export function useUpdateTask(taskId: string) {
  const queryClient = useQueryClient();
  const toastError = usePlanAwareErrorToast();

  return useMutation({
    mutationFn: (input: UpdateTaskInput) => tasksApi.update(taskId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task updated');
    },
    onError: (error) => {
      toastError(error, 'Could not update the task');
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      await queryClient.invalidateQueries({
        queryKey: billingKeys.subscription,
      });
      toast.success('Task deleted');
    },
    onError: (error) => {
      toast.error(describeError(error, 'Could not delete the task'));
    },
  });
}

export function useTaskAction(action: 'confirm' | 'snooze') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      action === 'confirm' ? tasksApi.confirm(taskId) : tasksApi.snooze(taskId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      toast.success(action === 'confirm' ? 'Task confirmed' : 'Reminder snoozed');
    },
    onError: async (error) => {
      // A 409 means the reminder moved on (already handled, or the occurrence
      // advanced) — refetching shows the user what actually happened.
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({ queryKey: taskKeys.all });
        toast.info('That reminder was already handled');
        return;
      }
      toast.error(describeError(error, 'Could not register the action'));
    },
  });
}
