import { View } from 'react-native';
import { Href, router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Grid } from '../../components/Grid';
import { Text } from '../../components/Text';
import { useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { space } from '../../theme';

type Story = { id: string; name: string; role: string; employer: string; consent_given: boolean; approved_by: string | null };

// 2026 graduate stories. Only stories with written consent are shown on the Home screen.
export default function Stories() {
  const { data, loading, reload } = useQuery(async () => {
    const { data: rows, error } = await supabase
      .from('graduate_stories')
      .select('id, name, role, employer, consent_given, approved_by')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (rows ?? []) as Story[];
  }, [], 'staff-stories');

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload} footer={<Button title="Add a graduate story" icon="plus" onPress={() => router.push('/story-edit' as Href)} />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">2026 graduate stories</Text>
          <Text variant="small">Stories appear on the Home screen for applicants once the graduate has given written consent.</Text>
        </View>
        {!loading && !data?.length ? (
          <EmptyState icon="award" title="No stories yet" body="Add the first one when a graduate agrees to share their story." />
        ) : (
          <Grid>
            {(data ?? []).map((s) => (
              <Card key={s.id} onPress={() => router.push(`/story-edit?id=${s.id}` as Href)} style={{ gap: space.xs }}>
                <Chip label={s.consent_given && s.approved_by ? 'Showing on Home' : 'Hidden'} tone={s.consent_given && s.approved_by ? 'success' : 'neutral'} />
                <Text variant="bodySemi">{s.name}</Text>
                <Text variant="small">{s.role} at {s.employer}</Text>
              </Card>
            ))}
          </Grid>
        )}
      </Screen>
    </View>
  );
}
