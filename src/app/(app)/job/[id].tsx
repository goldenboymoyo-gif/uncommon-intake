import { Linking, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Text } from '../../../components/Text';
import { fetchOpenJobs, formatDate, useQuery } from '../../../lib/data';
import { colors, space } from '../../../theme';

export default function JobDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading } = useQuery(fetchOpenJobs, [], 'open-jobs');
  const job = data?.find((j) => j.id === id);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={job ? <Button title="Apply on the employer's page" onPress={() => Linking.openURL(job.apply_url)} /> : undefined}>
        {job ? (
          <>
            <View style={{ gap: space.xs }}>
              <Text variant="h1">{job.title}</Text>
              <Text variant="bodySemi" style={{ color: colors.brand }}>{job.company}{job.location ? `, ${job.location}` : ''}</Text>
              {job.closes_on ? <Text variant="small">Apply by {formatDate(job.closes_on)}</Text> : null}
            </View>
            <View style={{ gap: space.xs }}>
              <Text variant="h3">About the job</Text>
              <Text style={{ color: colors.ink }}>{job.details}</Text>
            </View>
            {job.requirements ? (
              <View style={{ gap: space.xs }}>
                <Text variant="h3">What they need</Text>
                <Text style={{ color: colors.ink }}>{job.requirements}</Text>
              </View>
            ) : null}
            <Text variant="small">Your application goes straight to the employer. Uncommon does not see it.</Text>
          </>
        ) : !loading ? (
          <EmptyState icon="briefcase" title="This job is no longer open" />
        ) : null}
      </Screen>
    </View>
  );
}
