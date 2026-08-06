import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { restoreSession, setSessionLostHandler } from '@/api/client';
import { authApi, usersApi } from '@/api/endpoints';
import type { LoginInput, SignUpInput, User } from '@/api/types';

interface AuthContextValue {
  user: User | null;
  isRestoring: boolean;
  login: (input: LoginInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const queryClient = useQueryClient();

  const loadUser = useCallback(async () => {
    setUser(await usersApi.me());
  }, []);

  useEffect(() => {
    setSessionLostHandler(() => {
      setUser(null);
      queryClient.clear();
    });
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const recovered = await restoreSession();
      if (cancelled) return;
      if (recovered) {
        try {
          await loadUser();
        } catch {
          setUser(null);
        }
      }
      if (!cancelled) setIsRestoring(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isRestoring,
      login: async (input) => {
        await authApi.login(input);
        await loadUser();
      },
      signUp: async (input) => {
        await authApi.signUp(input);
        await authApi.login({ email: input.email, password: input.password });
        await loadUser();
      },
      logout: async () => {
        await authApi.logout();
        setUser(null);
        queryClient.clear();
      },
      refreshUser: loadUser,
    }),
    [user, isRestoring, loadUser, queryClient],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
