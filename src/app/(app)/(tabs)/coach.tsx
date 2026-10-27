import { View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { coachTools, CoachKind } from '../../../lib/coach';
import { formatDate, useQuery } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import { colors, space } from '../../../theme';

type SessionRow = { id: string; kind: CoachKind; title: string; created_at: string };

export default function Coach() {
  const { profile } = useAuth();
  const student = profile?.role === 'student';
  const { data: history, loading, reload } = useQuery(async () => {
    if (!student) return [];
    const { data } = await supabase
      .from('coach_sessions')
      .select('id, kind, title, created_at')
      .eq('student_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(30);
    return (data ?? []) as SessionRow[];
  }, [student, profile?.id]);

  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <View style={{ gap: space.xs }}>
        <Text variant="h1">Career coach</Text>
        <Text variant="small">Feedback to help you get ready for work. You always write your own words.</Text>
      </View>

      {(Object.keys(coachTools) as CoachKind[]).map((kind) => {
        const tool = coachTools[kind];
        return (
          <Card
            key={kind}
            large
            onPress={student ? () => router.push({ pathname: '/coach/[kind]', params: { kind } }) : undefined}
            style={{ gap: space.sm, opacity: student ? 1 : 0.7 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Feather name={tool.icon} size={22} color={tool.accent} />
              {!student ? <Chip label="Opens when you join" /> : null}
            </View>
            <Text variant="h3">{tool.title}</Text>
            <Text variant="small">{tool.body}</Text>
          </Card>
        );
      })}

      {student ? (
        <View style={{ gap: space.md }}>
          <Text variant="h2">Your history</Text>
          {!loading && !history?.length ? (
            <EmptyState icon="clock" title="Nothing here yet" body="Feedback you get from the coach will show here." />
          ) : (
            history?.map((h) => (
              <Card key={h.id} onPress={() => router.push({ pathname: '/coach/session/[id]', params: { id: h.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Feather name={coachTools[h.kind].icon} size={18} color={coachTools[h.kind].accent} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemi" numberOfLines={1}>{h.title || coachTools[h.kind].title}</Text>
                  <Text variant="small">{formatDate(h.created_at)}</Text>
                </View>
              </Card>
            ))
          )}
        </View>
      ) : null}
    </Screen>
  );
}
