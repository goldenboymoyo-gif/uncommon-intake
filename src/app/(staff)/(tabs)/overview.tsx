import { View } from 'react-native';
import { Href, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { Grid } from '../../../components/Grid';
import { Text } from '../../../components/Text';
import { fetchCurrentIntake, useQuery } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import { colors, radius, space } from '../../../theme';

type Overview = {
  applied: number;
  interviewed: number;
  accepted: number;
  confirmed: number;
  places_total: number | null;
  by_hub: { hub: string; count: number }[];
  job_outcomes: number;
};

// Every number here is counted from real rows in the database. No rows means zero.
export default function OverviewScreen() {
  const { data, loading, reload } = useQuery(async () => {
    const intake = await fetchCurrentIntake();
    if (!intake) return null;
    const { data: o, error } = await supabase.rpc('staff_overview', { p_intake: intake.id });
    if (error) throw error;
    return { intake, overview: o as Overview };
  }, [], 'staff-overview');

  const o = data?.overview;
  const placesLeft = o?.places_total != null ? Math.max(o.places_total - o.accepted, 0) : null;
  const maxHub = Math.max(1, ...(o?.by_hub ?? []).map((h) => h.count));

  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <View style={{ gap: space.xs }}>
        <Text variant="h1">Overview</Text>
        {data?.intake ? <Text variant="small">{data.intake.year} {data.intake.title}</Text> : null}
      </View>

      {!loading && !data ? (
        <EmptyState icon="calendar" title="No intake set up yet" body="Add an intake in the database to see numbers here." />
      ) : (
        <>
          <Grid>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Stat label="Applied" value={o?.applied} icon="file-text" accent={colors.accentBlue} />
              <Stat label="Interviewed" value={o?.interviewed} icon="mic" accent={colors.accentMint} />
            </View>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Stat label="Accepted" value={o?.accepted} icon="check-circle" accent={colors.accentOrange} />
              <Stat label="Places left" value={placesLeft} icon="users" accent={colors.accentRose} note={placesLeft == null ? 'Not set' : undefined} />
            </View>
          </Grid>
          {o && o.accepted > 0 ? <Text variant="small">{o.confirmed} of {o.accepted} accepted applicants have confirmed their place.</Text> : null}

          <Card large style={{ gap: space.md }}>
            <Text variant="h3">Applications by hub</Text>
            {!o?.by_hub.length ? (
              <Text variant="small">No applications sent yet.</Text>
            ) : (
              o.by_hub.map((h) => (
                <View key={h.hub} style={{ gap: space.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="smallSemi">{h.hub}</Text>
                    <Text variant="smallSemi">{h.count}</Text>
                  </View>
                  <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.soft, overflow: 'hidden' }}>
                    <View style={{ width: `${(h.count / maxHub) * 100}%`, height: '100%', backgroundColor: colors.brand }} />
                  </View>
                </View>
              ))
            )}
          </Card>

          <Card large style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Feather name="briefcase" size={20} color={colors.accentBlue} />
              <View style={{ flex: 1 }}>
                <Text variant="h3">Job outcomes</Text>
                <Text variant="small">{o?.job_outcomes ? `${o.job_outcomes} recorded` : 'None recorded yet'}</Text>
              </View>
            </View>
            <Button title="Record a job outcome" variant="outline" icon="plus" onPress={() => router.push('/job-outcome')} />
            {o?.job_outcomes ? <Button title="See and edit job outcomes" variant="ghost" onPress={() => router.push('/job-outcomes' as Href)} /> : null}
          </Card>

          <Card large style={{ gap: space.md }}>
            <Text variant="h3">Jobs and graduates</Text>
            <Text variant="small">Share job openings with students and graduates, and give graduates access to the coach.</Text>
            <Button title="Job opportunities" variant="outline" icon="briefcase" onPress={() => router.push('/job-opportunities' as Href)} />
            <Button title="Add a graduate" variant="ghost" onPress={() => router.push('/graduates' as Href)} />
          </Card>

          <Card large style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Feather name="award" size={20} color={colors.accentOrange} />
              <View style={{ flex: 1 }}>
                <Text variant="h3">2026 graduate stories</Text>
                <Text variant="small">Shown on Home for applicants, with consent only.</Text>
              </View>
            </View>
            <Button title="Manage graduate stories" variant="outline" onPress={() => router.push('/stories' as Href)} />
          </Card>
        </>
      )}
    </Screen>
  );
}

function Stat({ label, value, icon, accent, note }: { label: string; value?: number | null; icon: keyof typeof Feather.glyphMap; accent: string; note?: string }) {
  return (
    <Card style={{ flex: 1, gap: space.sm }}>
      <Feather name={icon} size={20} color={accent} />
      <Text variant="h1">{note ?? value ?? 0}</Text>
      <Text variant="small">{label}</Text>
    </Card>
  );
}
