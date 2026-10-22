import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  /** True when signed in but the profile could not be loaded (for example, no network). */
  profileFailed: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFailed, setProfileFailed] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // Loads the profile, trying up to 3 times. A failed attempt never clears a profile we
  // already have, so a weak network can not send the app back to the loading screen.
  const loadProfile = useCallback(async (userId: string | null) => {
    if (!userId) {
      setProfile(null);
      setProfileFailed(false);
      return;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        if (userIdRef.current === userId) setProfile(data as Profile);
        setProfileFailed(false);
        return;
      }
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
    if (userIdRef.current === userId) setProfileFailed(true);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      userIdRef.current = data.session?.user.id ?? null;
      setSession(data.session);
      await loadProfile(userIdRef.current);
      setLoading(false);
    });
    // Supabase holds a lock while this callback runs, so database calls wait until it returns.
    // Only reload the profile when the signed-in person changes, not on every token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      const nextId = next?.user.id ?? null;
      if (nextId === userIdRef.current) return;
      userIdRef.current = nextId;
      if (!nextId) setProfile(null);
      setTimeout(() => loadProfile(nextId), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: AuthState = {
    session,
    profile,
    loading,
    profileFailed,
    refreshProfile: () => loadProfile(userIdRef.current),
    signOut: async () => {
      await supabase.auth.signOut();
      userIdRef.current = null;
      setProfile(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export const isStaff = (p?: Profile | null) => p?.role === 'staff' || p?.role === 'admin';
export const initials = (p?: Pick<Profile, 'first_names' | 'surname'> | null) =>
  `${p?.first_names?.trim()[0] ?? ''}${p?.surname?.trim()[0] ?? ''}`.toUpperCase() || '?';
