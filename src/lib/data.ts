import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { Application, GraduateStory, Hub, Intake } from './types';

/** Small loader: runs `fn` on mount and whenever the screen comes back into focus. */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setData(await run());
      setError(null);
    } catch (e) {
      setError((e as Error).message || 'We could not load this. Pull down to try again.');
    } finally {
      setLoading(false);
    }
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  return { data, error, loading, reload, setData };
}

/** The intake applicants can apply to now, or the newest one. */
export async function fetchCurrentIntake(): Promise<Intake | null> {
  const { data, error } = await supabase
    .from('intakes')
    .select('*')
    .order('is_open', { ascending: false })
    .order('year', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Intake | null;
}

/** Only rows with consent and staff approval come back (enforced by RLS too). */
export async function fetchGraduateStories(): Promise<GraduateStory[]> {
  const { data, error } = await supabase
    .from('graduate_stories')
    .select('id, name, role, employer, story, photo_path')
    .eq('consent_given', true)
    .not('approved_by', 'is', null)
    .eq('graduation_year', 2026)
    .order('approved_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GraduateStory[];
}

export function useMyApplication() {
  const { profile } = useAuth();
  return useQuery(async () => {
    if (!profile) return null;
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('applicant_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as Application | null;
  }, [profile?.id]);
}

/** Returns the person's application for the intake, creating it with step 1 details if needed. */
export async function getOrCreateApplication(intakeId: string, userId: string) {
  const { data: existing } = await supabase
    .from('applications')
    .select('*')
    .eq('applicant_id', userId)
    .eq('intake_id', intakeId)
    .maybeSingle();
  if (existing) return existing as Application;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  const { data, error } = await supabase
    .from('applications')
    .insert({
      applicant_id: userId,
      intake_id: intakeId,
      first_names: profile?.first_names ?? '',
      surname: profile?.surname ?? '',
      phone: profile?.phone ?? '',
      email: profile?.email ?? '',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Application;
}

/** The real Uncommon hubs, from the hubs table. */
export async function fetchHubs(): Promise<Hub[]> {
  const { data, error } = await supabase.from('hubs').select('id, name, area, city, status').neq('status', 'closed').order('city').order('name');
  if (error) throw error;
  return (data ?? []) as Hub[];
}

export function useUnreadCount() {
  const { profile } = useAuth();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .is('read_at', null)
      .then(({ count: c }) => setCount(c ?? 0));
  }, [profile]);
  return count;
}

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
