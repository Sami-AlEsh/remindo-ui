import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BellRing, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { ApiError } from '@/api/errors';
import { authApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mirrors the API's policy: length only, 12–72 characters.
const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(12, 'At least 12 characters')
      .max(72, 'At most 72 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  // Read once: the token is stripped from the URL immediately below, so
  // re-reading the params later would come back empty.
  const tokenRef = useRef(params.get('token') ?? '');
  const token = tokenRef.current;

  useEffect(() => {
    if (!token) return;
    // Keep the token out of history and out of anything the user might screen-
    // shot or paste. Nothing validates it on load — mail scanners follow every
    // link, and redeeming is destructive, so that only happens on submit.
    window.history.replaceState(null, '', window.location.pathname);
  }, [token]);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetFormValues) {
    setFormError(null);
    try {
      await authApi.resetPassword({ token, newPassword: values.newPassword });
      toast.success('Password updated — sign in with it');
      void navigate('/login', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setFormError('Too many attempts. Wait a minute and try again.');
      } else if (error instanceof ApiError && error.status === 401) {
        setFormError(
          'This link is invalid, expired, or already used. Request a new one.',
        );
      } else {
        setFormError(
          error instanceof ApiError && error.messages.length > 0
            ? error.messages[0]
            : 'Could not reset the password. Try again.',
        );
      }
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <XCircle className="text-destructive size-10" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              This link is missing its token
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Open the most recent link, or request a new one.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-2">
            <Link to="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <BellRing className="size-8" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Choose a new password
          </h1>
          <p className="text-muted-foreground text-sm">
            This signs you out everywhere else.
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
            <Label htmlFor="newPassword">New password</Label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              {...form.register('newPassword')}
            />
            <p className="text-muted-foreground text-xs">
              12–72 characters. Length is all that matters.
            </p>
            {form.formState.errors.newPassword && (
              <p className="text-destructive text-xs">
                {form.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-destructive text-xs">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Update password
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Changed your mind?{' '}
          <Link to="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
