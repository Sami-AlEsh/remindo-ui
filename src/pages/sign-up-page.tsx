import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BellRing, Loader2 } from 'lucide-react';
import { z } from 'zod';

import { ApiError } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/features/auth/auth-context';

// Mirrors the API's policy: length only, 12–72 characters.
const signUpSchema = z.object({
  firstName: z.string().min(2, 'At least 2 characters').max(50),
  lastName: z.string().min(2, 'At least 2 characters').max(50),
  email: z.string().email('Enter a valid email address').max(254),
  password: z
    .string()
    .min(12, 'At least 12 characters')
    .max(72, 'At most 72 characters'),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format, e.g. +971501234567')
    .optional()
    .or(z.literal('')),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignUpPage() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phoneNumber: '',
    },
  });

  if (user) return <Navigate to="/tasks" replace />;

  async function onSubmit(values: SignUpFormValues) {
    setFormError(null);
    try {
      await signUp({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        ...(values.phoneNumber ? { phoneNumber: values.phoneNumber } : {}),
      });
      void navigate('/platforms', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError('That email is already registered.');
      } else if (error instanceof ApiError && error.messages.length > 0) {
        setFormError(error.messages[0]);
      } else {
        setFormError('Could not create the account. Try again.');
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <BellRing className="size-8" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account
          </h1>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...form.register('firstName')} />
              {form.formState.errors.firstName && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...form.register('lastName')} />
              {form.formState.errors.lastName && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
            <p className="text-muted-foreground text-xs">
              12–72 characters. Length is all that matters.
            </p>
            {form.formState.errors.password && (
              <p className="text-destructive text-xs">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phoneNumber">Phone number (optional)</Label>
            <Input
              id="phoneNumber"
              placeholder="+971501234567"
              {...form.register('phoneNumber')}
            />
            {form.formState.errors.phoneNumber && (
              <p className="text-destructive text-xs">
                {form.formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Create account
          </Button>
        </form>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
