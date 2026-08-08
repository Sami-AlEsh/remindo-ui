import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatLocal } from '@/lib/datetime';
import { useSyncPayment } from '@/features/billing/use-billing';

/**
 * Ziina's hosted page redirects here. The redirect status is only a hint —
 * the sync call re-checks the payment with Ziina server-side and is what
 * actually credits the subscription (local dev has no webhook at all).
 */
export function BillingReturnPage() {
  const [params] = useSearchParams();
  const paymentId = params.get('paymentId');
  const redirectStatus = params.get('status');

  const sync = useSyncPayment();
  const { mutate: syncPayment } = sync;
  const fired = useRef(false);

  useEffect(() => {
    if (!paymentId || fired.current) return;
    fired.current = true;
    syncPayment(paymentId);
  }, [paymentId, syncPayment]);

  const settled = sync.data;

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

      {paymentId && (sync.isPending || sync.isIdle) && (
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
            disabled={sync.isPending}
            onClick={() => sync.mutate(paymentId as string)}
          >
            <RefreshCw className="size-4" />
            Check again
          </Button>
        </>
      )}

      {(settled?.status === 'failed' ||
        settled?.status === 'canceled' ||
        sync.isError) && (
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
