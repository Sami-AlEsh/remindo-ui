import type { components } from './schema';

type Schemas = components['schemas'];

export type User = Schemas['UserResponseDto'];
export type Task = Schemas['TaskResponseDto'];
export type CreateTaskInput = Schemas['CreateTaskDto'];
export type UpdateTaskInput = Schemas['UpdateTaskDto'];
export type PlatformStatus = Schemas['LinkedPlatformStatusDto'];
export type LinkPlatformResponse = Schemas['LinkPlatformResponseDto'];
export type LinkEmailResponse = Schemas['LinkEmailResponseDto'];
export type VerifyEmailResponse = Schemas['VerifyEmailResponseDto'];
export type TaskActionPreview = Schemas['TaskActionPreviewDto'];
export type LoginResponse = Schemas['LoginResponseDto'];
export type SignUpInput = Schemas['SignUpDto'];
export type LoginInput = Schemas['LogInDto'];
export type ChangePasswordInput = Schemas['ChangePasswordDto'];
export type UpdateUserInput = Schemas['UpdateUserDto'];

export type Subscription = Schemas['SubscriptionResponseDto'];
export type PlanTier = Subscription['plan'];
export type Product = Schemas['ProductDto'];
export type BillingProduct = Product['product'];
export type CheckoutResponse = Schemas['CheckoutResponseDto'];
export type PaymentSyncResponse = Schemas['PaymentSyncResponseDto'];

export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];
export type TaskRecurrence = Task['recurrence'];
export type Platform = PlatformStatus['platform'];

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskListResponse {
  items: Task[];
  meta: PageMeta;
}

export interface TaskListQuery {
  [key: string]: string | number | undefined;
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export const TASK_STATUSES = [
  'scheduled',
  'reminding',
  'snoozed',
  'acknowledged',
  'missed',
] as const satisfies readonly TaskStatus[];

export const TASK_PRIORITIES = [
  'normal',
  'important',
  'urgent',
] as const satisfies readonly TaskPriority[];

export const TASK_RECURRENCES = [
  'once',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
] as const satisfies readonly TaskRecurrence[];

export const PLATFORMS = [
  'telegram',
  'whatsapp',
  'email',
  'sms',
] as const satisfies readonly Platform[];

/** Error codes the API uses for plan-limit refusals. */
export const PLAN_ERROR_CODES = [
  'PLAN_LIMIT_REACHED',
  'PLAN_PLATFORM_LOCKED',
] as const;

export function isPlanErrorCode(code: string | undefined): boolean {
  return (PLAN_ERROR_CODES as readonly string[]).includes(code ?? '');
}

/** Statuses where the user still owes an answer. */
export const AWAITING_ACTION_STATUSES: readonly TaskStatus[] = [
  'reminding',
  'snoozed',
];

export function isAwaitingAction(task: Task): boolean {
  return AWAITING_ACTION_STATUSES.includes(task.status);
}
