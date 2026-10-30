import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { formatDate, useQuery } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import { colors, space } from '../../../theme';

type Answer = { id: string; question: string; student_answer: string; correct_answer: string; is_correct: boolean; explanation: string };
type Result = { id: string; title: string; score: number | null; passed: boolean | null; completed_at: string; english_answers: Answer[] };

// Every finished lesson and test, with the person's answers and why they were right or wrong.
export default function EnglishResults() {
  const { profile } = useAuth();
  const [open, setOpen] = useState<string | null>(null);
  const { data, loading, reload } = useQuery(async () => {
    const { data: rows, error } = await supabase
      .from('english_sessions')
      .select('id, title, score, passed, completed_at, english_answers(id, question, student_answer, correct_answer, is_correct, explanation)')
      .eq('user_id', profile!.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return (rows ?? []) as Result[];
  }, [profile?.id]);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload}>
        <Text variant="h1">My results</Text>
        {!loading && !data?.length ? <EmptyState icon="award" title="No results yet" body="Finish a lesson or test and your results will show here." /> : null}
        {data?.map((r) => (
          <Card key={r.id} onPress={() => setOpen(open === r.id ? null : r.id)} style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
              <View style={{ flex: 1 }}>
                <Text variant="bodySemi">{r.title}</Text>
                <Text variant="small">{formatDate(r.completed_at)}</Text>
              </View>
              <Chip label={`${r.score ?? 0}%`} tone={r.passed ? 'success' : 'warning'} />
            </View>
            {open === r.id
              ? r.english_answers.map((a) => (
                  <View key={a.id} style={{ gap: 2, borderTopWidth: 1, borderColor: colors.border, paddingTop: space.sm }}>
                    <Text variant="smallSemi">{a.question}</Text>
                    <Text variant="small" style={{ color: a.is_correct ? colors.success : colors.danger }}>Your answer: {a.student_answer}</Text>
                    {!a.is_correct ? <Text variant="small" style={{ color: colors.ink }}>Correct answer: {a.correct_answer}</Text> : null}
                    <Text variant="small">{a.explanation}</Text>
                  </View>
                ))
              : null}
          </Card>
        ))}
      </Screen>
    </View>
  );
}
