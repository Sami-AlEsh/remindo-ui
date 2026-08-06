import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BellRing, LogOut, Plug, Settings } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';

const NAV_ITEMS = [
  { to: '/tasks', label: 'Tasks', icon: BellRing },
  { to: '/platforms', label: 'Platforms', icon: Plug },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    void navigate('/login', { replace: true });
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/60 bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <BellRing className="size-5" />
            Remindo
          </span>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="text-muted-foreground ml-auto flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
