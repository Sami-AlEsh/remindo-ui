import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, Check, Crown, Loader2 } from 'lucide-react';

import type { Product } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { PRODUCT_LABELS, formatAed } from '@/lib/labels';
import { useAuth } from '@/features/auth/auth-context';
import { useCheckout, useProducts } from '@/features/billing/use-billing';

const FREE_FEATURES = [
  'Up to 5 active reminders',
  'Telegram delivery',
  'Full escalation ladder',
  'Recurring schedules',
];

const PRO_FEATURES = [
  'Unlimited active reminders',
  'Every platform — Telegram, email, and the ones coming next',
  'Full escalation ladder',
  'Recurring schedules',
];

export function PricingPage() {
  const { user, isRestoring } = useAuth();
  const { data: products, isPending } = useProducts();
  const checkout = useCheckout();

  const monthly = products?.find((p) => p.product === 'pro_monthly');

  function proCta(product: Product) {
    if (!user) return null;
    return (
      <Button
        className="w-full font-semibold"
        variant={product.product === 'pro_yearly' ? 'default' : 'outline'}
        disabled={checkout.isPending}
        onClick={() => checkout.mutate(product.product)}
      >
        {checkout.isPending && <Loader2 className="size-4 animate-spin" />}
        Get Pro {PRODUCT_LABELS[product.product]}
      </Button>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border/60 bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <BellRing className="size-5" />
            Remindo
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {!isRestoring &&
              (user ? (
                <Button asChild size="sm">
                  <Link to="/tasks">
                    Your tasks
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/signup">Get started</Link>
                  </Button>
                </>
              ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Start free. Upgrade when 5 isn&apos;t enough.
          </h1>
          <p className="text-muted-foreground mx-auto max-w-xl text-sm leading-relaxed">
            Pro is prepaid — pay for a month or a year, never auto-charged.
            Renewing early stacks time on top of what you already have.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* ---------------------------------------------------- free tier */}
          <div className="bg-card flex flex-col gap-5 rounded-xl border p-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Free</h2>
              <p className="text-3xl font-bold tracking-tight">
                AED 0
                <span className="text-muted-foreground text-sm font-normal">
                  {' '}
                  forever
                </span>
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {!user && (
              <Button asChild variant="outline" className="mt-auto w-full">
                <Link to="/signup">Start free</Link>
              </Button>
            )}
          </div>

          {/* ----------------------------------------------------- pro tier */}
          <div className="border-primary bg-primary/5 flex flex-col gap-5 rounded-xl border p-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <Crown className="text-primary size-5" />
                Pro
                <Badge className="bg-primary/10 text-primary border-0">
                  Everything unlocked
                </Badge>
              </h2>
              {isPending && <Skeleton className="mt-2 h-9 w-40" />}
              {monthly && (
                <p className="text-3xl font-bold tracking-tight tabular-nums">
                  {formatAed(monthly.amountFils)}
                  <span className="text-muted-foreground text-sm font-normal">
                    {' '}
                    / month
                  </span>
                </p>
              )}
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="text-primary mt-0.5 size-4 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-col gap-2">
              {user ? (
                products?.map((product) => (
                  <div key={product.product}>{proCta(product)}</div>
                ))
              ) : (
                <Button asChild className="w-full font-semibold">
                  <Link to="/signup">
                    Start free, upgrade inside
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
              {products && products.length > 1 && (
                <p className="text-muted-foreground text-center text-xs tabular-nums">
                  {products
                    .map(
                      (p) =>
                        `${PRODUCT_LABELS[p.product]}: ${formatAed(p.amountFils)}`,
                    )
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
