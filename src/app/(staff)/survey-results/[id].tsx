import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { AiLabel } from '../../../components/AiLabel';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Text } from '../../../components/Text';
import { useQuery } from '../../../lib/data';
import { callFunction, supabase } from '../../../lib/supabase';
import { colors, layout, radius, space } from '../../../theme';

type Question = { id: string; prompt: string; kind: 'text' | 'scale' | 'single_choice' };
type Response = { id: string; question_id: string; value: unknown };
type Theme = { id: string; question_id: string; theme: string; response_ids: string[] };

export default function SurveyResults() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const { data, reload, loading } = useQuery(async () => {
    const [{ data: survey }, { data: questions }, { data: responses }, { data: themes }] = await Promise.all([
      supabase.from('surveys').select('title, is_open').eq('id', id).single(),
      supabase.from('survey_questions').select('id, prompt, kind').eq('survey_id', id).order('position'),
      supabase.from('survey_responses').select('id, question_id, value').eq('survey_id', id),
      supabase.from('survey_themes').select('id, question_id, theme, response_ids').eq('survey_id', id),
    ]);
    return {
      survey,
      questions: (questions ?? []) as Question[],
      responses: (responses ?? []) as Response[],
      themes: (themes ?? []) as Theme[],
    };
  }, [id]);

  async function findThemes(questionId: string) {
    setBusy(questionId);
    setError(null);
    try {
      await callFunction('survey-themes', { question_id: questionId });
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function toggleOpen() {
    if (!data?.survey) return;
    await supabase.from('surveys').update({ is_open: !data.survey.is_open }).eq('id', id);
    reload();
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload}>
        <Text variant="h1">{data?.survey?.title ?? ''}</Text>
        {data?.survey ? (
          <Button title={data.survey.is_open ? 'Close this survey' : 'Open this survey again'} variant="outline" onPress={toggleOpen} />
        ) : null}

        {data?.questions.map((q, i) => {
          const answers = data.responses.filter((r) => r.question_id === q.id);
          const themes = data.themes.filter((t) => t.question_id === q.id);
          return (
            <Card key={q.id} large style={{ gap: space.md }}>
              <Text variant="tiny">QUESTION {i + 1} · {answers.length} {answers.length === 1 ? 'ANSWER' : 'ANSWERS'}</Text>
              <Text variant="h3">{q.prompt}</Text>

              {q.kind === 'scale' ? <ScaleResults values={answers.map((a) => Number(a.value))} /> : null}

              {q.kind === 'text' ? (
                <>
                  {themes.length ? (
                    <View style={{ gap: space.sm }}>
                      <AiLabel note="themes, tap one to see the answers behind it" />
                      {themes.map((t) => (
                        <View key={t.id} style={{ backgroundColor: colors.soft, borderRadius: radius.sm }}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ expanded: open === t.id }}
                            onPress={() => setOpen(open === t.id ? null : t.id)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, minHeight: layout.tapTarget }}
                          >
                            <Text variant="bodySemi" style={{ flex: 1 }}>{t.theme}</Text>
                            <Text variant="small">{t.response_ids.length}</Text>
                            <Feather name={open === t.id ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
                          </Pressable>
                          {open === t.id ? (
                            <View style={{ paddingHorizontal: space.md, paddingBottom: space.md, gap: space.sm }}>
                              {answers.filter((a) => t.response_ids.includes(a.id)).map((a) => (
                                <Text key={a.id} variant="small" style={{ color: colors.ink }}>“{String(a.value)}”</Text>
                              ))}
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  ) : null}
                  <Button
                    title={themes.length ? 'Find themes again' : 'Find themes'}
                    variant="ghost"
                    icon="layers"
                    loading={busy === q.id}
                    disabled={answers.length < 3}
                    onPress={() => findThemes(q.id)}
                  />
                  <View style={{ gap: space.sm }}>
                    <Text variant="smallSemi">All answers</Text>
                    {answers.length ? answers.map((a) => (
                      <Text key={a.id} variant="small" style={{ color: colors.ink }}>• {String(a.value)}</Text>
                    )) : <Text variant="small">No answers yet.</Text>}
                  </View>
                </>
              ) : null}
            </Card>
          );
        })}
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}

function ScaleResults({ values }: { values: number[] }) {
  if (!values.length) return <Text variant="small">No answers yet.</Text>;
  const counts = [1, 2, 3, 4, 5].map((n) => values.filter((v) => v === n).length);
  const max = Math.max(1, ...counts);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="small">Average {avg.toFixed(1)} out of 5</Text>
      {counts.map((c, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text variant="smallSemi" style={{ width: 16 }}>{i + 1}</Text>
          <View style={{ flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: colors.soft, overflow: 'hidden' }}>
            <View style={{ width: `${(c / max) * 100}%`, height: '100%', backgroundColor: colors.brand }} />
          </View>
          <Text variant="small" style={{ width: 24, textAlign: 'right' }}>{c}</Text>
        </View>
      ))}
    </View>
  );
}
