import { View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { formatDate, useQuery } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import { colors, space } from '../../../theme';

type SurveyRow = { id: string; title: string; description: string | null; due_at: string | null; done: boolean };

export default function Surveys() {
  const { profile } = useAuth();
  const { data, loading, reload } = useQuery(async () => {
    const [{ data: surveys }, { data: mine }] = await Promise.all([
      supabase.from('surveys').select('id, title, description, due_at').eq('is_open', true).order('created_at', { ascending: false }),
      supabase.from('survey_responses').select('survey_id').eq('student_id', profile!.id),
    ]);
    const done = new Set((mine ?? []).map((r: { survey_id: string }) => r.survey_id));
    return (surveys ?? []).map((s) => ({ ...s, done: done.has(s.id) })) as SurveyRow[];
  }, [profile?.id]);

  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <View style={{ gap: space.xs }}>
        <Text variant="h1">Surveys</Text>
        <Text variant="small">Short surveys from your instructors. Your answers help make the bootcamp better.</Text>
      </View>
      {!loading && !data?.length ? (
        <EmptyState icon="clipboard" accent={colors.accentMint} title="No surveys right now" body="We will let you know when there is a new one." />
      ) : (
        data?.map((s) => (
          <Card key={s.id} large onPress={s.done ? undefined : () => router.push({ pathname: '/surveys/[id]', params: { id: s.id } })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Chip label={s.done ? 'Done' : 'To do'} tone={s.done ? 'success' : 'brand'} />
              {!s.done ? <Feather name="chevron-right" size={20} color={colors.muted} /> : null}
            </View>
            <Text variant="h3">{s.title}</Text>
            {s.description ? <Text variant="small">{s.description}</Text> : null}
            {s.due_at ? <Text variant="small">Please answer by {formatDate(s.due_at)}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
