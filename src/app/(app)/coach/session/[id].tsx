import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../../../components/Header';
import { Screen } from '../../../../components/Screen';
import { Card } from '../../../../components/Card';
import { FeedbackCard } from '../../../../components/FeedbackCard';
import { Text } from '../../../../components/Text';
import { coachTools, CoachKind } from '../../../../lib/coach';
import { formatDate, useQuery } from '../../../../lib/data';
import { supabase } from '../../../../lib/supabase';
import type { Suggestions } from '../../../../lib/types';
import { space } from '../../../../theme';

type Session = { kind: CoachKind; title: string; input_text: string | null; feedback: Suggestions | null; created_at: string };

export default function CoachSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useQuery(async () => {
    const { data: row } = await supabase.from('coach_sessions').select('kind, title, input_text, feedback, created_at').eq('id', id).single();
    return row as Session | null;
  }, [id]);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen>
        {data ? (
          <>
            <View style={{ gap: space.xs }}>
              <Text variant="h1">{coachTools[data.kind].title}</Text>
              <Text variant="small">{formatDate(data.created_at)}</Text>
            </View>
            {data.kind === 'interview_practice' && data.title ? <Text variant="h3">{data.title}</Text> : null}
            {data.input_text ? (
              <Card>
                <Text variant="tiny">WHAT YOU SENT</Text>
                <Text numberOfLines={12}>{data.input_text}</Text>
              </Card>
            ) : null}
            {data.feedback ? <FeedbackCard feedback={data.feedback} /> : null}
          </>
        ) : null}
      </Screen>
    </View>
  );
}
