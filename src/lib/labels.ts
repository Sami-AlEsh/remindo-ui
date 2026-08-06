import type {
  Platform,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
} from '@/api/types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  scheduled: 'Scheduled',
  reminding: 'Reminding',
  snoozed: 'Snoozed',
  acknowledged: 'Done',
  missed: 'Missed',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  normal: 'Normal',
  important: 'Important',
  urgent: 'Urgent',
};

export const RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  once: 'One time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
  sms: 'SMS',
};

/** Escalation policy mirrored from the API's REMINDER_POLICY, for display. */
export const PRIORITY_POLICY: Record<
  TaskPriority,
  { reminders: number; everyMin: number; snoozeMin: number }
> = {
  normal: { reminders: 1, everyMin: 15, snoozeMin: 30 },
  important: { reminders: 2, everyMin: 10, snoozeMin: 20 },
  urgent: { reminders: 3, everyMin: 5, snoozeMin: 10 },
};

export function describePolicy(priority: TaskPriority): string {
  const { reminders, everyMin } = PRIORITY_POLICY[priority];
  return `${reminders} follow-up${reminders === 1 ? '' : 's'}, every ${everyMin} min`;
}
