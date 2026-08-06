import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, Check, CheckCircle2, Clock, Loader2 } from 'lucide-react';

import { ApiError } from '@/api/errors';
import { tasksApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatLocal } from '@/lib/datetime';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/labels';

/**
 * Landing page for confirm/snooze links inside reminder emails.
 *
 * The GET that loads this page is read-only by design: mail scanners and
 * link-preview bots follow URLs automatically, and a link that acted on load
 * would acknowledge reminders the user never saw. Acting requires the click.
 */
export function ReminderActionPage() {
  const { token = '' } = useParams();

  const preview = useQuery({
    queryKey: ['reminder-action', token],
    queryFn: () => tasksApi.previewTokenAction(token),
    retry: false,
  });

  const act = useMutation({
    mutationFn: () => tasksApi.performTokenAction(token),
  });

  const isConfirm = preview.data?.action === 'confirm';

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          {preview.isPending && (
            <>
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
              <p className="text-muted-foreground text-sm">Loading reminder…</p>
            </>
          )}

          {preview.isError && (
            <>
              <AlertCircle className="text-destructive size-10" />
              <h1 className="text-xl font-semibold tracking-tight">
                Link no longer valid
              </h1>
              <p className="text-muted-foreground text-sm">
                {preview.error instanceof ApiError
                  ? (preview.error.messages[0] ??
                    'This link is invalid or has expired.')
                  : 'This link is invalid or has expired.'}
              </p>
              <Button asChild variant="outline">
                <Link to="/tasks">Open Remindo</Link>
              </Button>
            </>
          )}

          {preview.data && !act.isSuccess && (
            <>
              <h1 className="text-xl font-semibold tracking-tight">
                {preview.data.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {preview.data.content}
              </p>
              <p className="text-muted-foreground text-xs">
                Due {formatLocal(preview.data.dueDate)} ·{' '}
                {PRIORITY_LABELS[preview.data.priority]} ·{' '}
                {STATUS_LABELS[preview.data.status]}
              </p>

              {preview.data.actionable ? (
                <Button
                  className="mt-2 w-full"
                  variant={isConfirm ? 'default' : 'outline'}
                  onClick={() => act.mutate()}
                  disabled={act.isPending}
                >
                  {act.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isConfirm ? (
                    <Check className="size-4" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                  {isConfirm ? 'Confirm this task' : 'Snooze this reminder'}
                </Button>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">
                  {preview.data.reason ?? 'Nothing left to do here.'}
                </p>
              )}

              {act.isError && (
                <p className="text-destructive text-sm">
                  That reminder was already handled.
                </p>
              )}

              <Button asChild variant="ghost" size="sm">
                <Link to="/tasks">Open Remindo</Link>
              </Button>
            </>
          )}

          {act.isSuccess && (
            <>
              <CheckCircle2 className="text-status-ack-foreground size-10" />
              <h1 className="text-xl font-semibold tracking-tight">
                {act.data.outcome === 'acknowledged' ? 'Confirmed' : 'Snoozed'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {act.data.outcome === 'acknowledged'
                  ? "Nice — Remindo will stop nagging you about this one."
                  : "We'll remind you again shortly."}
              </p>
              <Button asChild variant="outline">
                <Link to="/tasks">Open Remindo</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
