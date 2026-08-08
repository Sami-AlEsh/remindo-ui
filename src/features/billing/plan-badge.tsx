import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { PLAN_LABELS } from '@/lib/labels';
import { formatRelative } from '@/lib/datetime';
import { useSubscription } from './use-billing';

/**
 * Header chip: the plan is account state, not task state, so it renders in
 * the primary palette — never the priority or status tokens.
 */
export function PlanBadge() {
  const { data: subscription } = useSubscription();
  if (!subscription) return null;

  if (subscription.plan === 'pro') {
    return (
      <Badge
        className="bg-primary/10 text-primary border-primary/30 gap-1"
        title={
          subscription.periodEnd
            ? `Pro ends ${formatRelative(subscription.periodEnd)}`
            : undefined
        }
      >
        <Crown className="size-3" />
        {PLAN_LABELS.pro}
      </Badge>
    );
  }

  return (
    <Badge asChild variant="outline" className="hover:border-primary/50 gap-1">
      <Link to="/pricing" title="See what Pro unlocks">
        {PLAN_LABELS.free}
      </Link>
    </Badge>
  );
}
