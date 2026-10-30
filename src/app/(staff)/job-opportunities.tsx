import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Text';
import { formatDate, useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import type { JobOpportunity } from '../../lib/types';
import { colors, space } from '../../theme';

// Jobs staff have shared with students and graduates. Tap one to edit or delete it.
export default function JobOpportunities() {
  const { data, loading, reload } = useQuery(async () => {
    const { data: rows, error } = await supabase.from('job_opportunities').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (rows ?? []) as JobOpportunity[];
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload} footer={<Button title="Add a job" icon="plus" onPress={() => router.push('/job-opportunity')} />}>
        <Text variant="h1">Job opportunities</Text>
        {!loading && !data?.length ? (
          <EmptyState icon="briefcase" title="No jobs shared yet" body="Add a job with its application link. Students and graduates get a notification." />
        ) : (
          data?.map((job) => (
            <Card key={job.id} onPress={() => router.push({ pathname: '/job-opportunity', params: { id: job.id } })} style={{ gap: 2 }}>
              <Text variant="bodySemi">{job.title}</Text>
              <Text variant="small" style={{ color: colors.brand }}>{job.company}</Text>
              <Text variant="tiny">{job.closes_on ? `Closes ${formatDate(job.closes_on)}` : `Added ${formatDate(job.created_at)}`}</Text>
            </Card>
          ))
        )}
      </Screen>
    </View>
  );
}
