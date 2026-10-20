import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ChoiceList } from '../../components/ChoiceList';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors, layout, space } from '../../theme';

type Draft = { prompt: string; kind: 'text' | 'scale' };
const kinds = { 'Written answer': 'text', 'Scale from 1 to 5': 'scale' } as const;

export default function NewSurvey() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Draft[]>([{ prompt: '', kind: 'text' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim() && questions.length > 0 && questions.every((q) => q.prompt.trim());
  const setQ = (i: number, patch: Partial<Draft>) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  async function save() {
    if (!valid || !profile) return;
    setBusy(true);
    setError(null);
    const { data: survey, error: err } = await supabase
      .from('surveys')
      .insert({ title: title.trim(), description: description.trim() || null, created_by: profile.id })
      .select('id')
      .single();
    if (err || !survey) {
      setBusy(false);
      return setError('We could not create the survey. Please try again.');
    }
    const { error: qErr } = await supabase
      .from('survey_questions')
      .insert(questions.map((q, i) => ({ survey_id: survey.id, position: i, prompt: q.prompt.trim(), kind: q.kind })));
    setBusy(false);
    if (qErr) return setError('The survey was created but the questions were not saved. Please try again.');
    router.back();
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="Send to students" haptic loading={busy} disabled={!valid} onPress={save} />}>
        <Text variant="h1">New survey</Text>
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Short description" optional value={description} onChangeText={setDescription} />

        {questions.map((q, i) => (
          <Card key={i} style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="tiny">QUESTION {i + 1}</Text>
              {questions.length > 1 ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove question ${i + 1}`} hitSlop={10} onPress={() => setQuestions((qs) => qs.filter((_, j) => j !== i))} style={{ minHeight: layout.tapTarget, justifyContent: 'center' }}>
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
            <Input label="Question" value={q.prompt} onChangeText={(v) => setQ(i, { prompt: v })} />
            <ChoiceList
              options={Object.keys(kinds)}
              value={Object.keys(kinds).find((k) => kinds[k as keyof typeof kinds] === q.kind)}
              onChange={(v) => setQ(i, { kind: kinds[v as keyof typeof kinds] })}
            />
          </Card>
        ))}
        <Button title="Add a question" variant="outline" icon="plus" onPress={() => setQuestions((qs) => [...qs, { prompt: '', kind: 'text' }])} />
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
