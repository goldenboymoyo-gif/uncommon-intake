import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { ChoiceList } from '../../../components/ChoiceList';
import { FeedbackCard } from '../../../components/FeedbackCard';
import { Input } from '../../../components/Input';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { coachTools, CoachKind, practiceQuestions } from '../../../lib/coach';
import { callFunction, supabase } from '../../../lib/supabase';
import type { Suggestions } from '../../../lib/types';
import { colors, space } from '../../../theme';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export default function CoachTool() {
  const kind = useLocalSearchParams<{ kind: CoachKind }>().kind;
  const tool = coachTools[kind] ?? coachTools.cv;
  const { profile } = useAuth();
  const [text, setText] = useState('');
  const [question, setQuestion] = useState(practiceQuestions[0]);
  const [file, setFile] = useState<{ path: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Suggestions | null>(null);
  const isPractice = kind === 'interview_practice';

  async function pickFile() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ type: Object.values(TYPES), copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0] || !profile) return;
    const asset = result.assets[0];
    const ext = asset.name.split('.').pop()?.toLowerCase() ?? '';
    if (!TYPES[ext]) return setError('Please choose a PDF or .docx file.');
    const local = new File(asset.uri);
    if ((asset.size ?? local.size) > MAX_BYTES) return setError('This file is bigger than 5MB.');
    setBusy(true);
    const path = `${profile.id}/coach/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('coach-files').upload(path, await local.arrayBuffer(), { contentType: TYPES[ext] });
    setBusy(false);
    if (upErr) return setError('Upload did not work. Please try again.');
    setFile({ path, name: asset.name });
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      const row = await callFunction<{ feedback: Suggestions }>('coach-feedback', {
        kind,
        text: text.trim() || undefined,
        file_path: file?.path,
        file_name: file?.name,
        question: isPractice ? question : undefined,
        title: isPractice ? question : file?.name ?? tool.title,
      });
      setFeedback(row.feedback);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = isPractice ? text.trim().length > 0 : !!file || text.trim().length > 0;

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="Get feedback" loading={busy} disabled={!canSubmit} onPress={submit} />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">{tool.title}</Text>
          <Text variant="small">{tool.body}</Text>
        </View>

        {isPractice ? (
          <>
            <View style={{ gap: space.sm }}>
              <Text variant="smallSemi">Pick a question</Text>
              <ChoiceList options={practiceQuestions} value={question} onChange={(v) => setQuestion(v as string)} />
            </View>
            <Input label="Your answer" multiline value={text} onChangeText={setText} helper="Answer as you would in a real interview." />
          </>
        ) : (
          <>
            <Button title={file ? `Chosen: ${file.name}` : 'Upload a file (PDF or .docx)'} variant="outline" icon="upload" onPress={pickFile} />
            <Text variant="small" style={{ textAlign: 'center' }}>or</Text>
            <Input label="Paste the text" multiline value={text} onChangeText={setText} />
          </>
        )}

        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
        {feedback ? <FeedbackCard feedback={feedback} note="Use these tips to improve your own work." /> : null}
      </Screen>
    </View>
  );
}
