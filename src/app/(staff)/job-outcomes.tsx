import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Grid } from '../../components/Grid';
import { Text } from '../../components/Text';
import { formatDate, useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { space } from '../../theme';

type Row = {
  id: string;
  employer: string;
  role: string;
  started_on: string | null;
  profiles: { first_names: string; surname: string } | null;
};

// Every recorded job outcome. Tap one to edit or delete it.
export default function JobOutcomes() {
  const { data, loading, reload } = useQuery(async () => {
    const { data: rows, error } = await supabase
      .from('job_outcomes')
      .select('id, employer, role, started_on, profiles!job_outcomes_student_id_fkey(first_names, surname)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (rows ?? []) as unknown as Row[];
  }, [], 'job-outcomes');

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload} footer={<Button title="Record a job outcome" icon="plus" onPress={() => router.push('/job-outcome')} />}>
        <Text variant="h1">Job outcomes</Text>
        {!loading && !data?.length ? (
          <EmptyState icon="briefcase" title="No job outcomes yet" body="Record a job when a student starts work." />
        ) : (
          <Grid>
            {(data ?? []).map((j) => (
              <Card key={j.id} onPress={() => router.push({ pathname: '/job-outcome', params: { id: j.id } })} style={{ gap: space.xs }}>
                <Text variant="bodySemi">{j.profiles ? `${j.profiles.first_names} ${j.profiles.surname}` : 'Student'}</Text>
                <Text variant="small">
                  {j.role} at {j.employer}
                  {j.started_on ? `, started ${formatDate(j.started_on)}` : ''}
                </Text>
              </Card>
            ))}
          </Grid>
        )}
      </Screen>
    </View>
  );
}
