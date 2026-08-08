import { Check, Crown, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { BillingProduct, Product } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PRODUCT_LABELS, formatAed } from '@/lib/labels';
import { useCheckout, useProducts } from './use-billing';

const PRO_PERKS = [
  'Unlimited active reminders',
  'Every delivery platform',
  'Same relentless follow-ups',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({ open, onOpenChange }: Props) {
  const { data: products, isPending } = useProducts();
  const checkout = useCheckout();

  function buy(product: BillingProduct) {
    checkout.mutate(product);
  }

  const monthly = products?.find((p) => p.product === 'pro_monthly');

  function savingsNote(product: Product): string | null {
    if (product.product !== 'pro_yearly' || !monthly) return null;
    const fullPrice = monthly.amountFils * 12;
    if (product.amountFils >= fullPrice) return null;
    const percent = Math.round(100 - (product.amountFils / fullPrice) * 100);
    return `Save ${percent}% vs monthly`;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="text-primary size-5" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Pro is prepaid — you pay for a period, never auto-charged. Renew
            whenever you like and the time stacks.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-1.5 text-sm">
          {PRO_PERKS.map((perk) => (
            <li key={perk} className="flex items-center gap-2">
              <Check className="text-primary size-4 shrink-0" />
              {perk}
            </li>
          ))}
        </ul>

        {isPending && <Skeleton className="h-24 w-full" />}

        <div className="flex flex-col gap-3">
          {products?.map((product) => {
            const savings = savingsNote(product);
            return (
              <div
                key={product.product}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-lg border p-4',
                  savings && 'border-primary bg-primary/5',
                )}
              >
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    {PRODUCT_LABELS[product.product]}
                    {savings && (
                      <Badge className="bg-primary/10 text-primary border-0">
                        {savings}
                      </Badge>
                    )}
                  </p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {formatAed(product.amountFils)} · {product.periodDays} days
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={savings ? 'default' : 'outline'}
                  disabled={checkout.isPending}
                  onClick={() => buy(product.product)}
                >
                  {checkout.isPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Get Pro
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-muted-foreground text-xs">
          Payments are processed by Ziina. You&apos;ll be redirected to a
          secure payment page and brought straight back.
        </p>
      </DialogContent>
    </Dialog>
  );
}
