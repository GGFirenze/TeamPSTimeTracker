import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: (url: RequestInfo | URL, init?: RequestInit) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      return fetch(url, { ...init, signal: controller.signal }).finally(() =>
        clearTimeout(timeoutId)
      );
    },
  },
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.auth.refreshSession();
      }
    });
  }
});
