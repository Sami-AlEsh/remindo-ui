import { useState } from 'react';
import { Check, Link2, Loader2, Unlink } from 'lucide-react';

import type { Platform } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_LABELS } from '@/lib/labels';
import { LinkTelegramDialog } from '@/features/platforms/link-telegram-dialog';
import {
  usePlatforms,
  useUnlinkPlatform,
} from '@/features/platforms/use-platforms';

export function PlatformsPage() {
  const { data: platforms, isPending } = usePlatforms();
  const unlink = useUnlinkPlatform();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  function handleUnlink(platform: Platform) {
    unlink.mutate(platform);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platforms</h1>
        <p className="text-muted-foreground text-sm">
          Where Remindo delivers your reminders. Linking never asks for your
          password in chat.
        </p>
      </div>

      {isPending && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {platforms?.map((platform) => (
          <Card key={platform.platform}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {PLATFORM_LABELS[platform.platform]}
                    {platform.linked && (
                      <Badge variant="secondary">
                        <Check className="size-3" />
                        Linked
                      </Badge>
                    )}
                    {!platform.implemented && (
                      <Badge variant="outline">Coming later</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {platform.linked
                      ? 'Reminders are delivered here.'
                      : platform.implemented
                        ? 'Not linked yet.'
                        : 'No adapter for this platform yet.'}
                  </CardDescription>
                </div>

                <CardContent className="p-0">
                  {platform.implemented && !platform.linked && (
                    <Button
                      size="sm"
                      onClick={() => setLinkDialogOpen(true)}
                      disabled={platform.platform !== 'telegram'}
                    >
                      <Link2 className="size-4" />
                      Link
                    </Button>
                  )}

                  {platform.linked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnlink(platform.platform)}
                      disabled={unlink.isPending}
                    >
                      {unlink.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Unlink className="size-4" />
                      )}
                      Unlink
                    </Button>
                  )}
                </CardContent>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <LinkTelegramDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
      />
    </div>
  );
}
