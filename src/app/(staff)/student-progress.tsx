import { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { confirmedProjects, socialSummary, StudentProgress as Numbers } from '../../lib/studentProgress';
import { colors, space } from '../../theme';

type Overview = {
  code: string | null;
  checked_in_today: number;
  students: { id: string; name: string; email: string; hub: string | null; progress: Numbers }[];
};

// For supporting students. Nothing here changes a student's place automatically.
export default function StudentProgress() {
  const { profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { data, loading, reload } = useQuery(async () => {
    const { data: result, error: err } = await supabase.rpc('hub_progress');
    if (err) throw err;
    return result as Overview;
  }, []);

  async function act(call: () => PromiseLike<{ error: { message: string } | null }>) {
    setError(null);
    const { error: err } = await call();
    if (err) setError(err.message);
    reload();
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Student progress</Text>
          <Text variant="small">This is to help students. It never changes a student's place on its own.</Text>
        </View>
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}

        {profile?.role === 'staff' ? (
          <Card large style={{ gap: space.sm, alignItems: 'center' }}>
            <Text variant="h3">Today's attendance code</Text>
            {data?.code ? (
              <>
                <Text variant="h1" style={{ letterSpacing: 6 }}>{data.code}</Text>
                <Text variant="small">Show this to students at the hub. It works today only.</Text>
              </>
            ) : (
              <Button title="Open today's code" onPress={() => act(() => supabase.rpc('open_attendance_code'))} />
            )}
          </Card>
        ) : null}
        <Text variant="bodySemi">{data?.checked_in_today ?? 0} students checked in today</Text>

        {!loading && !data?.students.length ? <EmptyState icon="users" title="No students yet" /> : null}
        {data?.students.map((s) => {
          const p = s.progress;
          const waiting = p.projects.filter((x) => x.status === 'waiting');
          return (
            <Card key={s.id} style={{ gap: space.xs }}>
              <Text variant="bodySemi">{s.name || s.email}</Text>
              {profile?.role === 'admin' ? <Text variant="tiny">{s.hub ?? 'No hub'}</Text> : null}
              <Text variant="small">Attended {p.attended} of {p.days_open} days</Text>
              <Text variant="small">{confirmedProjects(p)} confirmed projects</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, alignItems: 'center' }}>
                <Chip label={p.linkedin_url ? 'Posted this week' : 'No post this week'} tone={p.linkedin_url ? 'success' : 'warning'} />
                {p.linkedin_missed ? <Chip label={`${p.linkedin_missed} missed`} tone="warning" /> : null}
              </View>
              {p.linkedin_url ? <Button title="Open LinkedIn post" variant="ghost" onPress={() => Linking.openURL(p.linkedin_url!)} /> : null}
              {socialSummary(p).map((n) => <Text key={n.platform} variant="tiny">{n.platform}: {n.followers} followers, self reported</Text>)}
              {waiting.map((w) => (
                <View key={w.id} style={{ gap: space.xs, borderTopWidth: 1, borderColor: colors.border, paddingTop: space.sm }}>
                  <Text variant="smallSemi">{w.title}</Text>
                  <Button title="Open project" variant="ghost" onPress={() => Linking.openURL(w.url)} />
                  <Button title="Confirm project" variant="outline" onPress={() => act(() => supabase.rpc('review_project', { p_project: w.id, p_confirmed: true }))} />
                  <Button title="Not confirmed" variant="ghost" onPress={() => act(() => supabase.rpc('review_project', { p_project: w.id, p_confirmed: false }))} />
                </View>
              ))}
            </Card>
          );
        })}
      </Screen>
    </View>
  );
}
