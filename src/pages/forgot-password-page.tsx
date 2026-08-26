import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { BellRing, Loader2, MailCheck } from 'lucide-react';
import { z } from 'zod';

import { ApiError } from '@/api/errors';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const forgotSchema = z.object({
  email: z.string().email('Enter a valid email address').max(254),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotFormValues) {
    setFormError(null);
    try {
      await authApi.forgotPassword({ email: values.email });
      // Shown whether or not the address has an account: saying otherwise
      // would tell anyone who asks which emails are registered.
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof ApiError && error.status === 429
          ? 'Too many attempts. Wait a minute and try again.'
          : 'Could not send the link. Try again.',
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <MailCheck className="text-status-ack-foreground size-10" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Check your messages
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                If that address has a Remindo account, a reset link is on its
                way — to your email, and to any platform you&apos;ve linked. It
                works once and expires in 30 minutes.
              </p>
            </div>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <BellRing className="size-8" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Reset your password
              </h1>
              <p className="text-muted-foreground text-sm">
                We&apos;ll send a single-use link to the account&apos;s
                channels.
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
              noValidate
            >
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Send reset link
              </Button>
            </form>

            <p className="text-muted-foreground mt-6 text-center text-sm">
              Remembered it?{' '}
              <Link to="/login" className="text-foreground underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
