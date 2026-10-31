import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { Chip, reviewStatusChip } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { Grid } from '../../../components/Grid';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { fetchCurrentIntake, formatDate, useQuery } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import type { ReviewStatus } from '../../../lib/types';
import { colors, fonts, layout, radius, space } from '../../../theme';

type Row = {
  id: string;
  first_names: string;
  surname: string;
  review_status: ReviewStatus;
  needs_help: boolean;
  submitted_at: string | null;
  updated_at: string;
  hubs: { name: string } | null;
};

const filters: (ReviewStatus | 'all')[] = [
  'all', 'ready_to_review', 'in_review', 'all_answered', 'in_progress', 'not_started', 'needs_help', 'accepted', 'waitlisted', 'not_accepted',
];

export default function Board() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data, loading, reload } = useQuery(async () => {
    const intake = await fetchCurrentIntake();
    if (!intake) return [];
    const { data: rows, error } = await supabase
      .from('applications')
      .select('id, first_names, surname, review_status, needs_help, submitted_at, updated_at, hubs(name)')
      .eq('intake_id', intake.id)
      .order('updated_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (rows ?? []) as unknown as Row[];
  }, [], 'staff-board');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.length ?? 0 };
    data?.forEach((r) => {
      c[r.review_status] = (c[r.review_status] ?? 0) + 1;
      if (r.needs_help && r.review_status !== 'needs_help') c.needs_help = (c.needs_help ?? 0) + 1;
    });
    return c;
  }, [data]);

  const visible = (data ?? []).filter((r) => {
    const matches = filter === 'all' || r.review_status === filter || (filter === 'needs_help' && r.needs_help);
    const q = search.trim().toLowerCase();
    return matches && (!q || `${r.first_names} ${r.surname}`.toLowerCase().includes(q));
  });

  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <Text variant="h1">Review board</Text>
      {profile?.role === 'staff' && !profile.hub_id ? (
        <Card tone="soft"><Text variant="small">An admin needs to choose your hub. You will see your hub's applicants after that.</Text></Card>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.soft, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, minHeight: layout.inputHeight }}>
        <Feather name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Search by name"
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, minHeight: layout.inputHeight }}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.sidePadding, flexGrow: 0 }} contentContainerStyle={{ gap: space.sm, alignItems: 'center' }}>
        <View style={{ width: layout.sidePadding - space.sm }} />
        {filters.map((f) => {
          const on = filter === f;
          const label = f === 'all' ? 'All' : reviewStatusChip[f].label;
          return (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(f)}
              style={{ height: 36, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: on ? colors.brand : colors.soft }}
            >
              <Text variant="smallSemi" style={{ color: on ? colors.white : colors.ink }}>
                {label} {counts[f] ? `(${counts[f]})` : ''}
              </Text>
            </Pressable>
          );
        })}
        <View style={{ width: layout.sidePadding - space.sm }} />
      </ScrollView>

      {!loading && visible.length === 0 ? (
        <EmptyState icon="inbox" title={data?.length ? 'No applicants match this filter' : 'No applications yet'} body={data?.length ? undefined : 'New applications will show here.'} />
      ) : (
        <Grid>
          {visible.map((r) => {
            const chip = reviewStatusChip[r.review_status];
            return (
              <Card key={r.id} onPress={() => router.push({ pathname: '/applicant/[id]', params: { id: r.id } })} style={{ gap: space.sm }}>
                <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
                  <Chip label={chip.label} tone={chip.tone} />
                  {r.needs_help && r.review_status !== 'needs_help' ? <Chip label="Needs help" tone="danger" /> : null}
                  {!r.submitted_at ? <Chip label="Form not sent" /> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySemi">{r.first_names} {r.surname}</Text>
                    <Text variant="small">
                      {r.hubs?.name ? `${r.hubs.name} · ` : ''}
                      {r.submitted_at ? `Applied ${formatDate(r.submitted_at)}` : `Updated ${formatDate(r.updated_at)}`}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </Grid>
      )}
    </Screen>
  );
}
