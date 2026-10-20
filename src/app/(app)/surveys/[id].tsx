import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { ChoiceList } from '../../../components/ChoiceList';
import { Input } from '../../../components/Input';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { useQuery } from '../../../lib/data';
import { supabase } from '../../../lib/supabase';
import { colors, layout, radius, space } from '../../../theme';

type Question = { id: string; prompt: string; kind: 'text' | 'scale' | 'single_choice'; options: string[] };

export default function SurveyAnswer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery(async () => {
    const [{ data: survey }, { data: questions }] = await Promise.all([
      supabase.from('surveys').select('title, description').eq('id', id).single(),
      supabase.from('survey_questions').select('id, prompt, kind, options').eq('survey_id', id).order('position'),
    ]);
    return { survey, questions: (questions ?? []) as Question[] };
  }, [id]);

  const questions = data?.questions ?? [];
  const complete = questions.length > 0 && questions.every((q) => values[q.id] !== undefined && String(values[q.id]).trim() !== '');

  async function send() {
    if (!complete || !profile) return;
    setBusy(true);
    setError(null);
    const rows = questions.map((q) => ({ survey_id: id, question_id: q.id, student_id: profile.id, value: values[q.id] }));
    const { error: err } = await supabase.from('survey_responses').insert(rows);
    setBusy(false);
    if (err) return setError('We could not send your answers. Please try again.');
    router.back();
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="Send answers" loading={busy} disabled={!complete} onPress={send} haptic />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">{data?.survey?.title ?? ''}</Text>
          {data?.survey?.description ? <Text variant="small">{data.survey.description}</Text> : null}
        </View>
        {questions.map((q, i) => (
          <View key={q.id} style={{ gap: space.sm }}>
            {q.kind === 'text' ? (
              <Input label={`${i + 1}. ${q.prompt}`} multiline value={(values[q.id] as string) ?? ''} onChangeText={(v) => setValues((s) => ({ ...s, [q.id]: v }))} />
            ) : (
              <>
                <Text variant="smallSemi">{i + 1}. {q.prompt}</Text>
                {q.kind === 'scale' ? (
                  <Scale value={values[q.id] as number | undefined} onChange={(v) => setValues((s) => ({ ...s, [q.id]: v }))} />
                ) : (
                  <ChoiceList options={q.options} value={values[q.id] as string} onChange={(v) => setValues((s) => ({ ...s, [q.id]: v }))} />
                )}
              </>
            )}
          </View>
        ))}
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}

// 1 to 5. 1 means "not at all", 5 means "very much".
function Scale({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <View style={{ gap: space.xs }}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === n }}
            onPress={() => onChange(n)}
            style={{ flex: 1, height: layout.tapTarget + 4, borderRadius: radius.sm, borderWidth: 1, borderColor: value === n ? colors.brand : colors.border, backgroundColor: value === n ? colors.brand : colors.white, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text variant="bodySemi" style={{ color: value === n ? colors.white : colors.ink }}>{n}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="tiny">Not at all</Text>
        <Text variant="tiny">Very much</Text>
      </View>
    </View>
  );
}
