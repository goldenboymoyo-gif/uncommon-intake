import { View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { Grid } from '../../../components/Grid';
import { Text } from '../../../components/Text';
import { formatDate, useQuery } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import { colors, space } from '../../../theme';

type Row = { id: string; title: string; is_open: boolean; created_at: string; survey_responses: { student_id: string }[] };

export default function StaffSurveys() {
  const { data, loading, reload } = useQuery(async () => {
    const { data: rows, error } = await supabase
      .from('surveys')
      .select('id, title, is_open, created_at, survey_responses(student_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (rows ?? []) as Row[];
  });

  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <Text variant="h1">Surveys</Text>
      <Button title="New survey" icon="plus" onPress={() => router.push('/survey-new')} />
      {!loading && !data?.length ? (
        <EmptyState icon="clipboard" accent={colors.accentMint} title="No surveys yet" body="Create a survey and students will see it in their Surveys tab." />
      ) : (
        <Grid>
          {(data ?? []).map((s) => {
            const people = new Set(s.survey_responses.map((r) => r.student_id)).size;
            return (
              <Card key={s.id} onPress={() => router.push({ pathname: '/survey-results/[id]', params: { id: s.id } })}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={s.is_open ? 'Open' : 'Closed'} tone={s.is_open ? 'success' : 'neutral'} />
                </View>
                <Text variant="h3">{s.title}</Text>
                <Text variant="small">
                  {people} {people === 1 ? 'student has' : 'students have'} answered · {formatDate(s.created_at)}
                </Text>
              </Card>
            );
          })}
        </Grid>
      )}
    </Screen>
  );
}
