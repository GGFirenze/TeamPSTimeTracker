import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase, restQuery, getAccessToken } from '../lib/supabase';
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

async function fetchProfileViaRest(
  userId: string,
  token: string | null
): Promise<Profile | null> {
  try {
    const rows = await restQuery<Profile[]>(
      `profiles?id=eq.${userId}&select=*&limit=1`,
      { token }
    );
    return rows?.[0] ?? null;
  } catch (err) {
    console.error('Profile fetch failed:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const AUTH_TIMEOUT_MS = 8000;
    const timeout = setTimeout(() => {
      if (!settled) {
        console.warn('Auth init timed out');
        settled = true;
        setIsLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const settle = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
      }
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        console.info('Auth event:', event);

        if (event === 'SIGNED_IN' && s) {
          const params = new URLSearchParams(window.location.search);
          if (params.has('code')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          const token = s.access_token || getAccessToken();
          const p = await fetchProfileViaRest(s.user.id, token);
          setProfile(p);
        } else {
          setProfile(null);
        }
        settle();
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (settled) return;
      if (!s) {
        settle();
        return;
      }
      setSession(s);
      setUser(s.user);
      const p = await fetchProfileViaRest(s.user.id, s.access_token);
      setProfile(p);
      settle();
    }).catch((err) => {
      console.error('getSession failed:', err);
      settle();
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

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
