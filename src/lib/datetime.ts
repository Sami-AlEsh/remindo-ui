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

export function defaultDueDateValue(): string {
  const inAnHour = new Date(Date.now() + 60 * 60 * 1000);
  inAnHour.setSeconds(0, 0);
  return toDateTimeLocalValue(inAnHour.toISOString());
}
