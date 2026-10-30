import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Text';
import { useQuery } from '../../lib/data';
import { callFunction } from '../../lib/supabase';
import { space } from '../../theme';

type Student = {
  id: string;
  name: string;
  level: string | null;
  last_active_on: string | null;
  lessons_passed: number;
  learning_minutes: number;
  recent_score: number | null;
  recent_results: { title: string; score: number | null; passed: boolean | null }[];
  reasons: string[];
};

// Learning progress only. Chats with the tutor stay private.
export default function EnglishProgress() {
  const { data, loading, reload } = useQuery(() => callFunction<{ students: Student[]; common: { pattern: string; times: number }[] }>('english-tutor', { action: 'staff_overview' }), []);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">English progress</Text>
          <Text variant="small">Levels, scores and activity for students and graduates. Their chats stay private. This is to help people learn and is never used for admission.</Text>
        </View>

        {data?.common.length ? (
          <Card tone="soft" style={{ gap: space.xs }}>
            <Text variant="h3">Common difficulties</Text>
            {data.common.map((c) => <Text key={c.pattern} variant="small">• {c.pattern} ({c.times} times)</Text>)}
          </Card>
        ) : null}

        {!loading && !data?.students.length ? <EmptyState icon="book-open" title="No students yet" /> : null}
        {data?.students.map((s) => (
          <Card key={s.id} style={{ gap: space.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
              <Text variant="bodySemi" style={{ flex: 1 }}>{s.name || 'Name not added'}</Text>
              <Chip label={s.level ?? 'No level yet'} tone="brand" />
            </View>
            <Text variant="small">
              {s.lessons_passed} lessons passed, {s.learning_minutes} minutes{s.recent_score !== null ? `, recent score ${s.recent_score}%` : ''}
            </Text>
            {s.recent_results.map((r, i) => <Text key={`${r.title}${i}`} variant="tiny">{r.title}: {r.score ?? 0}%</Text>)}
            {s.reasons.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
                {s.reasons.map((why) => <Chip key={why} label={why} tone="warning" />)}
              </View>
            ) : null}
          </Card>
        ))}
      </Screen>
    </View>
  );
}
