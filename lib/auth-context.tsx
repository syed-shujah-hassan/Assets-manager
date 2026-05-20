import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  isReady: boolean;
  login: (user: User, token?: string | null) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'rms_auth_user_v1';

type StoredAuth = {
  user: User;
  token?: string | null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (raw) {
          const parsed = JSON.parse(raw) as StoredAuth | User;
          if (parsed && typeof parsed === 'object' && 'user' in parsed) {
            setUser(parsed.user);
            setToken(parsed.token || null);
          } else {
            setUser(parsed as User);
          }
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setIsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = (u: User | null, t: string | null) => {
    if (!u) {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t })).catch(() => {});
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isLoggedIn: !!user,
      isReady,
      login: (u: User, t?: string | null) => {
        setUser(u);
        setToken(t || null);
        persist(u, t || null);
      },
      updateUser: (u: User) => {
        setUser(u);
        persist(u, token);
      },
      logout: () => {
        setUser(null);
        setToken(null);
        persist(null, null);
      },
    }),
    [user, token, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
