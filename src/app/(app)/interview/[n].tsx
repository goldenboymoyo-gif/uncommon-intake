import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { StepProgress } from '../../../components/StepProgress';
import { AudioRecorder, AudioResult } from '../../../components/AudioRecorder';
import { VideoRecorder, VideoResult } from '../../../components/VideoRecorder';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { useQuery } from '../../../lib/data';
import { fetchInterview, QUESTION_COUNT } from '../../../lib/interview';
import { enqueueAnswer } from '../../../lib/uploadQueue';
import { colors, space } from '../../../theme';

export default function InterviewQuestion() {
  const n = Number(useLocalSearchParams<{ n: string }>().n) || 1;
  const { profile } = useAuth();
  const { data } = useQuery(() => fetchInterview(profile!.id), [profile?.id]);
  const [text, setText] = useState<string | null>(null);
  const [media, setMedia] = useState<AudioResult | VideoResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data || !profile) return <View style={{ flex: 1 }}><Header onBack={() => router.back()} /></View>;
  const { app, questions, answers } = data;
  const question = questions.find((q) => q.position === n);
  const format = app.low_data && app.interview_format === 'video' ? 'audio' : app.interview_format ?? 'text';
  const existing = question ? answers[question.id] : undefined;
  const textValue = text ?? existing?.text_answer ?? '';

  if (!question) {
    return (
      <View style={{ flex: 1 }}>
        <Header onBack={() => router.back()} />
        <Screen><Text>This question is not ready yet.</Text></Screen>
      </View>
    );
  }

  const canSave = format === 'text' ? textValue.trim().length >= 2 : !!media;

  async function save() {
    if (!canSave || !question || !profile) return;
    setBusy(true);
    setError(null);
    try {
      if (format === 'text') {
        await enqueueAnswer({ userId: profile.id, applicationId: app.id, questionId: question.id, format, text: textValue.trim() });
      } else if (media) {
        // iOS cameras save .mov files; Android saves .mp4.
        const isMov = media.uri.toLowerCase().endsWith('.mov');
        const ext = format === 'audio' ? 'm4a' : isMov ? 'mov' : 'mp4';
        const mime = format === 'audio' ? 'audio/mp4' : isMov ? 'video/quicktime' : 'video/mp4';
        await enqueueAnswer({
          userId: profile.id,
          applicationId: app.id,
          questionId: question.id,
          format,
          localUri: media.uri,
          ext,
          mime,
          durationSeconds: media.durationSeconds,
        });
      }
      const next = questions.find((q) => q.position > n && !answers[q.id]);
      if (next) router.replace({ pathname: '/interview/[n]', params: { n: String(next.position) } });
      else router.back();
    } catch {
      setError('We could not save your answer on this phone. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen
        footer={
          <>
            <Button title="Save answer" haptic loading={busy} disabled={!canSave} onPress={save} />
            <Button title="Back to all questions" variant="ghost" onPress={() => router.back()} />
          </>
        }
      >
        <StepProgress current={n} total={QUESTION_COUNT} label="Question" />
        <Card large tone="soft">
          <Text variant="h2">{question.prompt}</Text>
        </Card>

        {existing ? (
          <Text variant="small">You already answered this. A new answer will replace the old one.</Text>
        ) : null}

        {format === 'text' ? (
          <Input label="Your answer" multiline value={textValue} onChangeText={setText} helper="Write in your own words. There is no word limit." />
        ) : format === 'audio' ? (
          <AudioRecorder lowData={app.low_data} onDone={setMedia} />
        ) : (
          <VideoRecorder onDone={setMedia} />
        )}

        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
