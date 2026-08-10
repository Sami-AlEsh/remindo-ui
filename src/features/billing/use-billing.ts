import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ApiError } from '@/api/errors';
import { billingApi } from '@/api/endpoints';
import type { BillingProduct } from '@/api/types';
import { useAuth } from '@/features/auth/auth-context';

export const billingKeys = {
  subscription: ['billing', 'subscription'] as const,
  products: ['billing', 'products'] as const,
};

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: billingKeys.subscription,
    queryFn: () => billingApi.subscription(),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: billingKeys.products,
    queryFn: () => billingApi.products(),
    // Prices change on deploy, not while the tab is open.
    staleTime: Infinity,
  });
}

/**
 * Starts a Ziina checkout and leaves the app: the hosted payment page brings
 * the user back to /billing/return, which settles the payment via sync.
 */
export function useCheckout() {
  return useMutation({
    mutationFn: (product: BillingProduct) => billingApi.checkout(product),
    onSuccess: ({ redirectUrl }) => {
      window.location.assign(redirectUrl);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'BILLING_DISABLED') {
        toast.error('Payments are not available yet — check back soon.');
        return;
      }
      toast.error(
        error instanceof ApiError
          ? (error.messages[0] ?? 'Could not start the checkout')
          : 'Could not start the checkout',
      );
    },
  });
}

