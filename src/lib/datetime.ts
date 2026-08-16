import { format, formatDistanceToNowStrict, isPast } from 'date-fns';

/**
 * The API has no per-user timezone: recurring tasks are anchored to the due
 * date's UTC wall-clock. We show local time everywhere and spell out the UTC
 * anchor on recurring tasks so a DST shift doesn't look like a bug.
 */

export function formatLocal(iso: string): string {
  return format(new Date(iso), 'PPp');
}

export function formatLocalTime(iso: string): string {
  return format(new Date(iso), 'p');
}

export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const distance = formatDistanceToNowStrict(date);
  return isPast(date) ? `${distance} ago` : `in ${distance}`;
}

export function formatUtcTime(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes} UTC`;
}

/** `datetime-local` inputs speak local time with no zone suffix. */
export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function fromDateTimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

/**
 * How far the due date's UTC weekday sits from its local one: -1, 0 or +1.
 * Accepts any parseable date — a `datetime-local` value or an ISO string.
 */
function utcWeekdayShift(dueDate: string): number {
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return 0;

  const raw = date.getUTCDay() - date.getDay();
  if (raw === 0) return 0;
  // Sat→Sun wraps to -6 and Sun→Sat to +6; both mean a single day's step.
  return raw === 1 || raw === -6 ? 1 : -1;
}

/**
 * The weekday picker speaks the user's local days, but the API stores UTC ones
 * because cron patterns carry no timezone. A late-night or early-morning due
 * time crosses the date line — "Mon 01:00" at UTC+4 is Sunday 21:00 UTC — so
 * the chosen days have to move with it or the reminder fires a day off.
 */
export function localToUtcWeekday(day: number, dueDate: string): number {
  return (day + utcWeekdayShift(dueDate) + 7) % 7;
}

export function utcToLocalWeekday(day: number, dueDate: string): number {
  return (day - utcWeekdayShift(dueDate) + 7) % 7;
}

/** True when local and UTC weekdays disagree, so the UI can say so. */
export function crossesUtcDay(dueDate: string): boolean {
  return utcWeekdayShift(dueDate) !== 0;
}

export function defaultDueDateValue(): string {
  const inAnHour = new Date(Date.now() + 60 * 60 * 1000);
  inAnHour.setSeconds(0, 0);
  return toDateTimeLocalValue(inAnHour.toISOString());
}
