import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { EmptyState } from '../../../components/EmptyState';
import { Text } from '../../../components/Text';
import { fetchOpenJobs, formatDate, useQuery } from '../../../lib/data';
import { colors, space } from '../../../theme';

// Job opportunities from Uncommon staff, for students and graduates.
export default function Jobs() {
  const { data, loading, reload } = useQuery(fetchOpenJobs, [], 'open-jobs');
  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <View style={{ gap: space.xs }}>
        <Text variant="h1">Jobs</Text>
        <Text variant="small">Openings shared by Uncommon staff. You apply directly with the employer.</Text>
      </View>
      {!loading && !data?.length ? (
        <EmptyState icon="briefcase" title="No jobs right now" body="New openings will show here, and we will send you a notification." />
      ) : (
        data?.map((job) => (
          <Card key={job.id} onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })} style={{ gap: 2 }}>
            <Text variant="bodySemi">{job.title}</Text>
            <Text variant="small" style={{ color: colors.brand }}>{job.company}{job.location ? `, ${job.location}` : ''}</Text>
            {job.closes_on ? <Text variant="tiny">Apply by {formatDate(job.closes_on)}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
