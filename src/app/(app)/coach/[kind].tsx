import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ChoiceList } from '../../../components/ChoiceList';
import { CoachIntro } from '../../../components/CoachAvatar';
import { FeedbackCard } from '../../../components/FeedbackCard';
import { Input } from '../../../components/Input';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { careers, coachTips, coachTools, CoachKind } from '../../../lib/coach';
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
  const isPractice = kind === 'interview_practice';
  const { profile } = useAuth();

  // First the student picks the career; that picks the coach.
  const options = isPractice ? careers : careers.filter((c) => c.id !== 'hr');
  const [careerLabel, setCareerLabel] = useState<string | null>(null);
  const [customCareer, setCustomCareer] = useState('');
  const career = options.find((c) => c.label === careerLabel) ?? null;
  const careerName = career?.id === 'other' ? customCareer.trim() : career?.label ?? '';
  const careerReady = !!career && (career.id !== 'other' || customCareer.trim().length > 2);

  const [questions, setQuestions] = useState<string[] | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ path: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Suggestions | null>(null);

  function chooseCareer(label: string) {
    setCareerLabel(label);
    setQuestions(null);
    setQuestion(null);
    setFeedback(null);
  }

  async function loadQuestions() {
    setBusy(true);
    setError(null);
    try {
      const res = await callFunction<{ questions: string[] }>('coach-feedback', { action: 'questions', career: careerName });
      setQuestions(res.questions);
      setQuestion(res.questions[0] ?? null);
      setFeedback(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

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
        career: careerName,
        text: text.trim() || undefined,
        file_path: file?.path,
        file_name: file?.name,
        question: isPractice ? question : undefined,
        title: `${careerName}: ${isPractice ? question : file?.name ?? tool.title}`,
      });
      setFeedback(row.feedback);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = careerReady && (isPractice ? !!question && text.trim().length > 0 : !!file || text.trim().length > 0);
  const showWork = careerReady && (!isPractice || !!questions);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={showWork ? <Button title="Get feedback" loading={busy} disabled={!canSubmit} onPress={submit} /> : undefined}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">{tool.title}</Text>
          <Text variant="small">{tool.body}</Text>
        </View>

        <View style={{ gap: space.sm }}>
          <Text variant="smallSemi">{isPractice ? 'Which interview are you practising for?' : 'Which job is it for?'}</Text>
          <ChoiceList options={options.map((c) => c.label)} value={careerLabel} onChange={(v) => chooseCareer(v as string)} />
          {career?.id === 'other' ? (
            <Input
              label="Type the career"
              value={customCareer}
              onChangeText={(v) => {
                setCustomCareer(v);
                setQuestions(null);
              }}
              helper="For example: data analyst, IT support or sales."
            />
          ) : null}
        </View>

        {career && careerReady ? (
          <Card tone="soft" large style={{ gap: space.md }}>
            <CoachIntro career={career} customCareer={customCareer} />
            {isPractice ? (
              <Text variant="small">I will ask you questions that come up in real {careerName.toLowerCase()} interviews. Answer as you would on the day.</Text>
            ) : (
              <View style={{ gap: space.xs }}>
                <Text variant="bodySemi">What a good {kind === 'cv' ? 'CV' : 'cover letter'} has</Text>
                {coachTips[kind as 'cv' | 'cover_letter'].map((t) => (
                  <Text key={t} variant="small" style={{ color: colors.ink }}>• {t}</Text>
                ))}
              </View>
            )}
          </Card>
        ) : null}

        {careerReady && isPractice && !questions ? <Button title="Get interview questions" loading={busy} onPress={loadQuestions} /> : null}

        {showWork && isPractice && questions ? (
          <>
            <View style={{ gap: space.sm }}>
              <Text variant="smallSemi">Pick a question</Text>
              <ChoiceList
                options={questions}
                value={question}
                onChange={(v) => {
                  setQuestion(v as string);
                  setFeedback(null);
                }}
              />
              <Button title="Give me new questions" variant="ghost" icon="refresh-cw" loading={busy} onPress={loadQuestions} />
            </View>
            <Input label="Your answer" multiline value={text} onChangeText={setText} helper="Answer as you would in a real interview." />
          </>
        ) : null}

        {showWork && !isPractice ? (
          <>
            <Button title={file ? `Chosen: ${file.name}` : 'Upload a file (PDF or .docx)'} variant="outline" icon="upload" onPress={pickFile} />
            <Text variant="small" style={{ textAlign: 'center' }}>or</Text>
            <Input label="Paste the text" multiline value={text} onChangeText={setText} />
          </>
        ) : null}

        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
        {feedback ? <FeedbackCard feedback={feedback} note="Use these tips to improve your own work." /> : null}
      </Screen>
    </View>
  );
}
