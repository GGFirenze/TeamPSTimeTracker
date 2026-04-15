import { createClient } from '@supabase/supabase-js';
import { processLock } from '@supabase/auth-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

// Bypass the Web Locks API deadlock during OAuth code exchange.
// See: supabase-js #2013, #2111, PR #2235
export const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lock: processLock,
  },
});

export async function restQuery<T>(
  path: string,
  options?: { token?: string | null; method?: string; body?: unknown; upsert?: boolean }
): Promise<T> {
  const { token, method = 'GET', body, upsert = false } = options ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const prefer: string[] = [];
  if (method === 'POST' || method === 'PATCH') prefer.push('return=representation');
  if (upsert) prefer.push('resolution=merge-duplicates');

  const headers: Record<string, string> = {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token || ANON_KEY}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (prefer.length) headers['Prefer'] = prefer.join(',');

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`REST ${res.status}: ${await res.text()}`);
    const text = await res.text();
    return text ? JSON.parse(text) : (undefined as T);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export function getAccessToken(): string | null {
  try {
    const key = Object.keys(localStorage).find(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    if (!key) return null;
    const parsed = JSON.parse(localStorage.getItem(key) || '');
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
}
