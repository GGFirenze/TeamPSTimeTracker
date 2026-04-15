import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  accessToken: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Failed to fetch profile:', error.message);
        return;
      }
      setProfile(data);
    } catch (err) {
      console.error('Profile fetch exception:', err);
    }
  }, []);

  useEffect(() => {
    let settled = false;

    const AUTH_TIMEOUT_MS = 8000;
    const timeout = setTimeout(() => {
      if (!settled) {
        console.warn('Auth init timed out, falling back to no-session state');
        settled = true;
        setIsLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        console.info('Auth event:', event, s?.user?.email);

        if (event === 'SIGNED_IN' && s) {
          const params = new URLSearchParams(window.location.search);
          if (params.has('code')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }

        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (settled) return;
      if (!s) {
        settled = true;
        clearTimeout(timeout);
        setIsLoading(false);
        return;
      }
      setSession(s);
      setUser(s.user);
      await fetchProfile(s.user.id);
      settled = true;
      clearTimeout(timeout);
      setIsLoading(false);
    }).catch((err) => {
      console.error('getSession failed:', err);
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Force clear even if signOut API fails
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin: profile?.is_admin ?? false,
        accessToken: session?.access_token ?? null,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
