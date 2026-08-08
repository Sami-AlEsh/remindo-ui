import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { ApiError } from '@/api/errors';
import { authApi, usersApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PLAN_LABELS, PRODUCT_LABELS } from '@/lib/labels';
import { formatLocal, formatRelative } from '@/lib/datetime';
import { useAuth } from '@/features/auth/auth-context';
import { useSubscription } from '@/features/billing/use-billing';
import { UpgradeDialog } from '@/features/billing/upgrade-dialog';

const profileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format, e.g. +971501234567')
    .optional()
    .or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(12, 'At least 12 characters').max(72),
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function BillingCard() {
  const { data: subscription, isPending } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const isPro = subscription?.plan === 'pro';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          Plan
          {subscription && (
            <Badge
              className={
                isPro
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : undefined
              }
              variant={isPro ? 'default' : 'outline'}
            >
              {isPro && <Crown className="size-3" />}
              {PLAN_LABELS[subscription.plan]}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Pro is prepaid — no auto-charge, ever. Renewing stacks time on top
          of what you already have.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isPending && <Skeleton className="h-12 w-full" />}

        {subscription && (
          <div className="text-sm">
            {isPro && subscription.periodEnd ? (
              <p>
                Pro ends{' '}
                <span className="font-medium">
                  {formatRelative(subscription.periodEnd)}
                </span>{' '}
                <span className="text-muted-foreground tabular-nums">
                  ({formatLocal(subscription.periodEnd)})
                </span>
                {subscription.product && (
                  <span className="text-muted-foreground">
                    {' '}
                    · {PRODUCT_LABELS[subscription.product]}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-muted-foreground">
                {subscription.usage.activeTasks} of{' '}
                {subscription.limits.maxActiveTasks ?? '∞'} active reminders
                used · Telegram only. Pro unlocks unlimited reminders on every
                platform.
              </p>
            )}
          </div>
        )}

        <Button
          size="sm"
          className="w-fit"
          variant={isPro ? 'outline' : 'default'}
          onClick={() => setUpgradeOpen(true)}
        >
          {!isPro && <Crown className="size-4" />}
          {isPro ? 'Renew / extend' : 'Upgrade to Pro'}
        </Button>
      </CardContent>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </Card>
  );
}

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  async function saveProfile(values: ProfileValues) {
    try {
      await usersApi.updateMe({
        firstName: values.firstName,
        lastName: values.lastName,
        ...(values.phoneNumber ? { phoneNumber: values.phoneNumber } : {}),
      });
      await refreshUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? (error.messages[0] ?? 'Could not update the profile')
          : 'Could not update the profile',
      );
    }
  }

  async function changePassword(values: PasswordValues) {
    setPasswordError(null);
    try {
      await authApi.changePassword(values);
      // Changing the password revokes the refresh session server-side.
      toast.success('Password changed — sign in again');
      void navigate('/login', { replace: true });
    } catch (error) {
      setPasswordError(
        error instanceof ApiError && error.status === 401
          ? 'That current password is not right.'
          : 'Could not change the password.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">{user?.email}</p>
      </div>

      <BillingCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your name and contact number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit(saveProfile)}
            className="flex flex-col gap-4"
            noValidate
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...profileForm.register('firstName')} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...profileForm.register('lastName')} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input
                id="phoneNumber"
                placeholder="+971501234567"
                {...profileForm.register('phoneNumber')}
              />
              {profileForm.formState.errors.phoneNumber && (
                <p className="text-destructive text-xs">
                  {profileForm.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-fit"
              disabled={profileForm.formState.isSubmitting}
            >
              {profileForm.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>
            Changing it signs you out everywhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit(changePassword)}
            className="flex flex-col gap-4"
            noValidate
          >
            {passwordError && (
              <p className="text-destructive text-sm">{passwordError}</p>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...passwordForm.register('currentPassword')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...passwordForm.register('newPassword')}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-destructive text-xs">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="outline"
              className="w-fit"
              disabled={passwordForm.formState.isSubmitting}
            >
              {passwordForm.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
