import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Chip, ChipTone } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { useQuery } from '../../../lib/data';
import { fetchInterview, QUESTION_COUNT } from '../../../lib/interview';
import { supabase } from '../../../lib/supabase';
import { runQueue, useUploadQueue } from '../../../lib/uploadQueue';
import { colors, space } from '../../../theme';

export default function InterviewOverview() {
  const { profile } = useAuth();
  const queue = useUploadQueue();
  const { data, loading, reload } = useQuery(() => fetchInterview(profile!.id), [profile?.id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the queue finishes sending something, refresh the list.
  useEffect(() => {
    reload();
  }, [queue.length]);

  if (!data) return <View style={{ flex: 1 }}><Header onBack={() => router.back()} /></View>;
  const { app, questions, answers } = data;
  const pending = queue.filter((q) => q.applicationId === app.id);
  const notReady = questions.length < QUESTION_COUNT;
  // An answer counts as sent once its text is saved or its recording is uploaded.
  const sent = (questionId: string) => {
    const a = answers[questionId];
    return !!a && (a.format === 'text' || !!a.media_path);
  };

  const statusFor = (questionId: string): { label: string; tone: ChipTone } => {
    const queued = pending.find((p) => p.questionId === questionId);
    if (queued) return queued.attempts > 0 ? { label: 'Waiting for network', tone: 'warning' } : { label: 'Sending…', tone: 'warning' };
    if (sent(questionId)) return { label: 'Sent', tone: 'success' };
    return { label: 'Not answered', tone: 'neutral' };
  };

  const allSent = !notReady && questions.every((q) => sent(q.id)) && pending.length === 0;
  const firstOpen = questions.find((q) => !sent(q.id) && !pending.some((p) => p.questionId === q.id));

  async function finish() {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from('applications').update({ interview_sent_at: new Date().toISOString() }).eq('id', app.id);
    setBusy(false);
    if (err) return setError('We could not send this. Check your connection and try again.');
    router.replace('/status');
  }

  if (app.interview_sent_at) {
    return (
      <View style={{ flex: 1 }}>
        <Header onBack={() => router.back()} />
        <Screen>
          <EmptyState icon="check-circle" accent={colors.accentMint} title="Your interview answers are sent" body="Our team will review them. You can follow along on your status page." />
          <Button title="See your status" onPress={() => router.replace('/status')} />
        </Screen>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen
        refreshing={loading}
        onRefresh={() => {
          runQueue();
          reload();
        }}
        footer={
          notReady ? null : allSent ? (
            <Button title="Send my interview" haptic loading={busy} onPress={finish} />
          ) : (
            <Button
              title={firstOpen ? `Answer question ${firstOpen.position}` : 'Waiting for uploads'}
              disabled={!firstOpen}
              onPress={() => firstOpen && router.push({ pathname: '/interview/[n]', params: { n: String(firstOpen.position) } })}
            />
          )
        }
      >
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Your interview</Text>
          <Text variant="small">5 questions. Answer them in any order. Tap a question to answer or change it.</Text>
        </View>

        {notReady ? (
          <EmptyState icon="clock" title="The interview questions are not ready yet" body="We will send you a notification when you can start." />
        ) : (
          questions.map((q) => {
            const s = statusFor(q.id);
            return (
              <Card key={q.id} onPress={() => router.push({ pathname: '/interview/[n]', params: { n: String(q.position) } })} style={{ gap: space.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="tiny">QUESTION {q.position} OF {QUESTION_COUNT}</Text>
                  <Chip label={s.label} tone={s.tone} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Text variant="bodySemi" style={{ flex: 1 }}>{q.prompt}</Text>
                  <Feather name="chevron-right" size={20} color={colors.muted} />
                </View>
              </Card>
            );
          })
        )}

        {pending.length ? (
          <Card tone="soft" style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Feather name="wifi-off" size={18} color={colors.warning} />
            <Text variant="small" style={{ flex: 1, color: colors.ink }}>
              {pending.length === 1 ? '1 answer is' : `${pending.length} answers are`} saved on your phone. We will keep trying to send {pending.length === 1 ? 'it' : 'them'}.
            </Text>
          </Card>
        ) : null}
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
