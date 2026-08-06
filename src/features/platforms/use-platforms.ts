import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ApiError } from '@/api/errors';
import { platformsApi } from '@/api/endpoints';
import type { Platform, PlatformStatus } from '@/api/types';

export const platformKeys = {
  all: ['platforms'] as const,
};

export function usePlatforms(options?: { pollUntilLinked?: Platform }) {
  const target = options?.pollUntilLinked;

  return useQuery({
    queryKey: platformKeys.all,
    queryFn: () => platformsApi.list(),
    // While a link dialog is open the user is scanning a QR on their phone;
    // poll until it lands, then stop.
    refetchInterval: (query) => {
      if (!target) return false;
      const linked = query.state.data?.some(
        (platform: PlatformStatus) =>
          platform.platform === target && platform.linked,
      );
      return linked ? false : 2_000;
    },
  });
}

export function useLinkedPlatforms(): Platform[] {
  const { data } = usePlatforms();
  return (data ?? []).filter((p) => p.linked).map((p) => p.platform);
}

export function useLinkTelegram() {
  return useMutation({
    mutationFn: () => platformsApi.linkTelegram(),
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? (error.messages[0] ?? 'Could not create a link')
          : 'Could not create a link',
      );
    },
  });
}

export function useUnlinkPlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (platform: Platform) => platformsApi.unlink(platform),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformKeys.all });
      toast.success('Platform unlinked');
    },
    onError: () => {
      toast.error('Could not unlink the platform');
    },
  });
}
