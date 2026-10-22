import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './secureStorage';

// Only public values live in the app. All secrets stay in Supabase Edge Functions.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isConfigured = Boolean(url && anonKey);

// Every request gets a time limit so a bad connection can never leave a screen loading forever.
// File uploads and AI work get longer.
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const ms = href.includes('/storage/v1/object') ? 300_000 : href.includes('/functions/v1/') ? 90_000 : 25_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  init?.signal?.addEventListener('abort', () => controller.abort());
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export const supabase = createClient(url || 'http://localhost', anonKey || 'missing', {
  global: { fetch: fetchWithTimeout },
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is open.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

// Calls an Edge Function and turns its error into a simple message for the screen.
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let message = 'Something went wrong. Please try again.';
    try {
      const details = await (error as { context?: Response }).context?.json();
      if (details?.error) message = details.error;
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }
  return data as T;
}
