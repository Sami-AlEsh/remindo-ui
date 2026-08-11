import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppLayout } from '@/components/layout/app-layout';
import { RequireAuth } from '@/features/auth/require-auth';
import { LandingPage } from '@/pages/landing-page';
import { PricingPage } from '@/pages/pricing-page';
import { BillingReturnPage } from '@/pages/billing-return-page';
import { LoginPage } from '@/pages/login-page';
import { SignUpPage } from '@/pages/sign-up-page';
import { VerifyEmailPage } from '@/pages/verify-email-page';
import { ReminderActionPage } from '@/pages/reminder-action-page';
import { TasksPage } from '@/pages/tasks-page';
import { PlatformsPage } from '@/pages/platforms-page';
import { SettingsPage } from '@/pages/settings-page';

/**
 * Design-system reference page. The `import.meta.env.DEV` test sits inside the
 * lazy factory on purpose: Vite substitutes a literal `false` for production,
 * which lets Rollup drop the dynamic import rather than emit an orphan chunk.
 */
const DesignPreviewPage = lazy(() =>
  import.meta.env.DEV
    ? import('@/pages/design-preview-page').then((m) => ({
        default: m.DesignPreviewPage,
      }))
    : Promise.resolve({ default: () => <></> }),
);

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          {/* Reached from links in emails, so both are public. */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/r/:token" element={<ReminderActionPage />} />
          {import.meta.env.DEV && (
            <Route
              path="/design"
              element={
                <Suspense fallback={null}>
                  <DesignPreviewPage />
                </Suspense>
              }
            />
          )}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/platforms" element={<PlatformsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Ziina redirects back here; sync needs the session, so it lives
              behind auth — the refresh cookie survives the round-trip. */}
            <Route path="/billing/return" element={<BillingReturnPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/tasks" replace />} />
        </Routes>
      </ErrorBoundary>
      <Toaster richColors position="top-right" />
    </>
  );
}
