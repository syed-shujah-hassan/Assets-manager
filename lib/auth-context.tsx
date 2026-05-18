import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './api';

interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  isReady: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'rms_auth_user_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (raw) {
          setUser(JSON.parse(raw));
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

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isReady,
    login: (u: User) => {
      setUser(u);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)).catch(() => {});
    },
    logout: () => {
      setUser(null);
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    },
  }), [user, isReady]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
