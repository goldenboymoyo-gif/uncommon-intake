import { View } from 'react-native';
import { Href, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { Text } from '../../../components/Text';
import { CoachAvatar } from '../../../components/CoachAvatar';
import { isLearner, useAuth } from '../../../lib/auth';
import { coachTools, CoachKind, coachTopics, CoachTopic, subjectById } from '../../../lib/coach';
import { formatDate, useQuery } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import { colors, space } from '../../../theme';

type SessionRow = { id: string; kind: CoachKind; title: string; created_at: string };
type ChatRow = { id: string; topic: CoachTopic; subject_id: string; subject: string; updated_at: string };

export default function Coach() {
  const { profile } = useAuth();
  const student = isLearner(profile);
  const { data: history, loading, reload } = useQuery(async () => {
    if (!student) return { chats: [] as ChatRow[], sessions: [] as SessionRow[] };
    const { data: chats } = await supabase
      .from('coach_chats')
      .select('id, topic, subject_id, subject, updated_at')
      .eq('user_id', profile!.id)
      .order('updated_at', { ascending: false })
      .limit(30);
    const { data } = await supabase
      .from('coach_sessions')
      .select('id, kind, title, created_at')
      .eq('student_id', profile!.id)
      .order('created_at', { ascending: false })
      .limit(30);
    return { chats: (chats ?? []) as ChatRow[], sessions: (data ?? []) as SessionRow[] };
  }, [student, profile?.id]);

  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <View style={{ gap: space.xs }}>
        <Text variant="h1">Career coach</Text>
        <Text variant="small">Chat with a coach to get ready for work. You always write your own words.</Text>
      </View>

      {(Object.keys(coachTopics) as CoachTopic[]).map((kind) => {
        const tool = coachTopics[kind];
        return (
          <Card
            key={kind}
            large
            onPress={student ? () => (kind === 'english' ? router.push('/english' as Href) : router.push({ pathname: '/coach/[kind]', params: { kind } })) : undefined}
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
          <Text variant="h2">Your chats</Text>
          {!loading && !history?.chats.length && !history?.sessions.length ? (
            <EmptyState icon="clock" title="Nothing here yet" body="Your chats with the coaches will show here." />
          ) : null}
          {history?.chats.map((c) => {
            const subject = subjectById(c.subject_id);
            return (
              <Card key={c.id} onPress={() => router.push({ pathname: '/coach/chat/[id]', params: { id: c.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <CoachAvatar subject={subject} size={44} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemi" numberOfLines={1}>Coach {subject.coach}</Text>
                  <Text variant="small" numberOfLines={1}>{coachTopics[c.topic].title}: {c.subject}</Text>
                </View>
                <Text variant="tiny">{formatDate(c.updated_at)}</Text>
              </Card>
            );
          })}
          {history?.sessions.map((h) => (
              <Card key={h.id} onPress={() => router.push({ pathname: '/coach/session/[id]', params: { id: h.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Feather name={coachTools[h.kind].icon} size={18} color={coachTools[h.kind].accent} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemi" numberOfLines={1}>{h.title || coachTools[h.kind].title}</Text>
                  <Text variant="small">{formatDate(h.created_at)}</Text>
                </View>
              </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
