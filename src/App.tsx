import { Navigate, Route, Routes } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/app-layout';
import { RequireAuth } from '@/features/auth/require-auth';
import { LoginPage } from '@/pages/login-page';
import { SignUpPage } from '@/pages/sign-up-page';
import { TasksPage } from '@/pages/tasks-page';
import { PlatformsPage } from '@/pages/platforms-page';
import { SettingsPage } from '@/pages/settings-page';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}
