import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { AiNotice } from '../../../components/AiNotice';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { fetchCurrentIntake, formatDate, getOrCreateApplication, useQuery } from '../../../lib/data';
import { fetchAnswers, fetchFormSetup, isAnswered, letterStep, stepTitle } from '../../../lib/form';
import { TOTAL_STEPS } from '../../../lib/progress';
import { supabase } from '../../../lib/supabase';
import { colors, layout, radius, space } from '../../../theme';

const show = (v: unknown) => (Array.isArray(v) ? v.join(', ') : isAnswered(v) ? String(v) : 'Not answered');

export default function Review() {
  const { profile } = useAuth();
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery(async () => {
    const intake = await fetchCurrentIntake();
    if (!intake || !profile) return null;
    const app = await getOrCreateApplication(intake.id, profile.id);
    const [setup, answers] = await Promise.all([fetchFormSetup(intake.id), fetchAnswers(app.id)]);
    return { app, setup, answers };
  }, [profile?.id]);

  if (!data) return <View style={{ flex: 1 }}><Header onBack={() => router.back()} /></View>;
  const { app, setup, answers } = data;

  const missingRequired = setup.questions.some((q) => q.kind !== 'letter_upload' && q.required && !isAnswered(answers[q.id]));
  const ready = setup.complete && !missingRequired && !!app.letter_path && !!app.date_of_birth && !!app.gender;

  async function send() {
    if (!ready || !understood) return;
    setBusy(true);
    setError(null);
    const now = new Date().toISOString();
    const { error: err } = await supabase.from('applications').update({ submitted_at: now, ai_notice_seen_at: now }).eq('id', app.id);
    setBusy(false);
    if (err) return setError('We could not send your application. Check your connection and try again.');
    router.replace('/interview/consent');
  }

  const edit = (step: number) => router.push({ pathname: '/application/[step]', params: { step: String(step) } });

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen
        footer={
          <Button
            title="Send my application"
            haptic
            loading={busy}
            disabled={!ready || !understood}
            onPress={send}
          />
        }
      >
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Review your application</Text>
          <Text variant="small">Check everything is right. After you send it, you cannot change it.</Text>
        </View>

        <Section title={stepTitle(setup, 1)} onEdit={() => edit(1)}>
          <Row label="First names" value={app.first_names} />
          <Row label="Surname" value={app.surname} />
          <Row label="Gender" value={show(app.gender)} />
          <Row label="Date of birth" value={app.date_of_birth ? formatDate(app.date_of_birth) : 'Not answered'} />
          <Row label="Phone or WhatsApp" value={app.phone} />
          <Row label="Email" value={app.email} />
        </Section>

        {Array.from({ length: TOTAL_STEPS - 1 }, (_, i) => i + 2).map((step) => (
          <Section key={step} title={stepTitle(setup, step)} onEdit={() => edit(step)}>
            {setup.questions.filter((q) => q.step === step && q.kind !== 'letter_upload').map((q) => (
              <Row key={q.id} label={q.label} value={show(answers[q.id])} missing={q.required && !isAnswered(answers[q.id])} />
            ))}
            {step === letterStep(setup) ? (
              <Row label="Motivational letter" value={app.letter_name ?? 'Not uploaded'} missing={!app.letter_path} />
            ) : null}
          </Section>
        ))}

        <AiNotice />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: understood }}
          onPress={() => setUnderstood((u) => !u)}
          style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start', minHeight: layout.tapTarget }}
        >
          <View style={{ width: 24, height: 24, borderRadius: radius.sm / 2, borderWidth: 1.5, borderColor: understood ? colors.brand : colors.muted, backgroundColor: understood ? colors.brand : colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            {understood ? <Feather name="check" size={16} color={colors.white} /> : null}
          </View>
          <Text style={{ flex: 1 }}>I have read how my answers are used, and my answers are true.</Text>
        </Pressable>

        {!ready ? (
          <Text variant="small" style={{ color: colors.danger }}>
            {setup.complete ? 'Some answers are missing. Tap Edit on a section to finish it.' : 'Part of the form is not ready yet. You can send your application once it opens.'}
          </Text>
        ) : null}
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <Card style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="h3" style={{ flex: 1 }}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${title}`} onPress={onEdit} hitSlop={10} style={{ minHeight: layout.tapTarget, justifyContent: 'center' }}>
          <Text variant="smallSemi" style={{ color: colors.brand }}>Edit</Text>
        </Pressable>
      </View>
      {children}
    </Card>
  );
}

function Row({ label, value, missing }: { label: string; value: string; missing?: boolean }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="small">{label}</Text>
      <Text style={{ color: missing ? colors.danger : colors.ink }}>{value}</Text>
    </View>
  );
}
