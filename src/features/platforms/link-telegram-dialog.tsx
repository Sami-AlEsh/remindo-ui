import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRelative } from '@/lib/datetime';
import { platformKeys, useLinkTelegram, usePlatforms } from './use-platforms';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkTelegramDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const linkMutation = useLinkTelegram();
  const { data: platforms } = usePlatforms({
    pollUntilLinked: open ? 'telegram' : undefined,
  });

  const isLinked = platforms?.some((p) => p.platform === 'telegram' && p.linked);
  const { mutate: createLink, reset: resetLink } = linkMutation;

  useEffect(() => {
    if (open) createLink();
    else resetLink();
  }, [open, createLink, resetLink]);

  useEffect(() => {
    if (open && isLinked && linkMutation.data) {
      toast.success('Telegram linked');
      void queryClient.invalidateQueries({ queryKey: platformKeys.all });
      onOpenChange(false);
    }
  }, [open, isLinked, linkMutation.data, onOpenChange, queryClient]);

  const url = linkMutation.data?.url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Telegram</DialogTitle>
          <DialogDescription>
            Scan this with your phone, or open the link on a device where
            Telegram is installed, then press Start.
          </DialogDescription>
        </DialogHeader>

        {linkMutation.isPending && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          </div>
        )}

        {url && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg bg-white p-4">
              <QRCodeSVG value={url} size={192} />
            </div>

            <div className="flex w-full gap-2">
              <Button asChild className="flex-1">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open in Telegram
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(url);
                  toast.success('Link copied');
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>

            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="size-3 animate-spin" />
              Waiting for you to press Start…
            </p>

            {linkMutation.data && (
              <p className="text-muted-foreground text-xs">
                This link is single-use and expires{' '}
                {formatRelative(linkMutation.data.expiresAt)}.
              </p>
            )}
          </div>
        )}

        {isLinked && (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Check className="size-4" />
            Linked.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
