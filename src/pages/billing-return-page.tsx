import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';

import { billingApi } from '@/api/endpoints';
import type { PaymentSyncResponse } from '@/api/types';
import { Button } from '@/components/ui/button';
import { formatLocal } from '@/lib/datetime';
import { billingKeys } from '@/features/billing/use-billing';

/**
 * Ziina's hosted page redirects here. The redirect status is only a hint —
 * the sync call re-checks the payment with Ziina server-side and is what
 * actually credits the subscription (local dev has no webhook at all).
 *
 * Plain effect + state rather than useMutation: a mutation fired from a
 * mount effect loses its observer under StrictMode's double-mount and the
 * page never leaves "pending". Re-running the sync on the second pass is
 * safe — settling is idempotent by design.
 */
export function BillingReturnPage() {
  const [params] = useSearchParams();
  const paymentId = params.get('paymentId');
  const redirectStatus = params.get('status');
  const queryClient = useQueryClient();

  const [settled, setSettled] = useState<PaymentSyncResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;

    setSettled(null);
    setFailed(false);
    billingApi
      .syncPayment(paymentId)
      .then((result) => {
        if (cancelled) return;
        setSettled(result);
        void queryClient.invalidateQueries({
          queryKey: billingKeys.subscription,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [paymentId, attempt, queryClient]);

  const checking = Boolean(paymentId) && !settled && !failed;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      {!paymentId && (
        <>
          <XCircle className="text-muted-foreground size-10" />
          <h1 className="text-xl font-semibold">Nothing to settle</h1>
          <p className="text-muted-foreground text-sm">
            This page finishes a payment, but no payment was referenced.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/settings">Back to settings</Link>
          </Button>
        </>
      )}

      {checking && (
        <>
          <Loader2 className="text-primary size-10 animate-spin" />
          <h1 className="text-xl font-semibold">Confirming your payment…</h1>
          <p className="text-muted-foreground text-sm">
            Checking with the payment provider. This takes a moment.
          </p>
        </>
      )}

      {settled?.status === 'completed' && (
        <>
          <CheckCircle2 className="text-primary size-10" />
          <h1 className="text-xl font-semibold">You&apos;re on Pro 🎉</h1>
          <p className="text-muted-foreground text-sm">
            Unlimited reminders and every platform are unlocked
            {settled.periodEnd
              ? ` until ${formatLocal(settled.periodEnd)}`
              : ''}
            . Renew any time — the time stacks.
          </p>
          <Button asChild size="sm" className="font-semibold">
            <Link to="/tasks">Back to your tasks</Link>
          </Button>
        </>
      )}

      {settled?.status === 'pending' && (
        <>
          <Loader2 className="text-muted-foreground size-10" />
          <h1 className="text-xl font-semibold">Still processing</h1>
          <p className="text-muted-foreground text-sm">
            The payment hasn&apos;t settled yet
            {redirectStatus === 'success'
              ? ' — it usually lands within a minute'
              : ''}
            . Check again in a moment.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAttempt((n) => n + 1)}
          >
            <RefreshCw className="size-4" />
            Check again
          </Button>
        </>
      )}

      {(settled?.status === 'failed' ||
        settled?.status === 'canceled' ||
        failed) && (
        <>
          <XCircle className="text-destructive size-10" />
          <h1 className="text-xl font-semibold">
            {settled?.status === 'canceled'
              ? 'Payment canceled'
              : 'Payment didn’t go through'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Nothing was charged on our side. You can try again whenever
            you&apos;re ready.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link to="/pricing">Try again</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/tasks">Back to tasks</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
