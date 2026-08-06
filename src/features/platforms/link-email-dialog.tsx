import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { ApiError } from '@/api/errors';
import { platformsApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/features/auth/auth-context';
import { platformKeys, usePlatforms } from './use-platforms';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkEmailDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sentTo, setSentTo] = useState<string | null>(null);

  // While the dialog waits for the click, poll so the card flips on its own.
  const { data: platforms } = usePlatforms({
    pollUntilLinked: open && sentTo ? 'email' : undefined,
  });
  const isLinked = platforms?.some((p) => p.platform === 'email' && p.linked);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: user?.email ?? '' },
  });

  useEffect(() => {
    if (open) {
      setSentTo(null);
      form.reset({ email: user?.email ?? '' });
    }
  }, [open, user?.email, form]);

  useEffect(() => {
    if (open && sentTo && isLinked) {
      toast.success('Email linked');
      void queryClient.invalidateQueries({ queryKey: platformKeys.all });
      onOpenChange(false);
    }
  }, [open, sentTo, isLinked, onOpenChange, queryClient]);

  const sendVerification = useMutation({
    mutationFn: (email: string) => platformsApi.linkEmail(email),
    onSuccess: (_, email) => setSentTo(email),
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? (error.messages[0] ?? 'Could not send the verification email')
          : 'Could not send the verification email',
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link email</DialogTitle>
          <DialogDescription>
            We'll send a confirmation link. Reminders only start once you click
            it, so nobody can sign up an address they don't own.
          </DialogDescription>
        </DialogHeader>

        {sentTo ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="text-status-ack-foreground size-8" />
            <p className="text-sm">
              Confirmation sent to <strong>{sentTo}</strong>.
            </p>
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="size-3 animate-spin" />
              Waiting for you to click the link…
            </p>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((values) =>
              sendVerification.mutate(values.email),
            )}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="reminder-email">Address</Label>
              <Input
                id="reminder-email"
                type="email"
                autoComplete="email"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Alert>
              <AlertDescription>
                Until a sending domain is configured, delivery only works for
                the address that owns the Resend account.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendVerification.isPending}>
                {sendVerification.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Send confirmation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
