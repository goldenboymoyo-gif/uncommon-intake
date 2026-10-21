import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { AiNotice } from '../../../components/AiNotice';
import { hasCvOrAbout } from '../../../components/CvUpload';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { fetchCurrentIntake, fetchHubs, getOrCreateApplication, useQuery } from '../../../lib/data';
import { STEP_TITLES } from '../../../lib/progress';
import { callFunction, supabase } from '../../../lib/supabase';
import { colors, layout, radius, space } from '../../../theme';

export default function Review() {
  const { profile } = useAuth();
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery(async () => {
    const intake = await fetchCurrentIntake();
    if (!intake || !profile) return null;
    const [app, hubs] = await Promise.all([getOrCreateApplication(intake.id, profile.id), fetchHubs()]);
    return { app, hub: hubs.find((h) => h.id === app.hub_id) ?? null };
  }, [profile?.id]);

  if (!data) return <View style={{ flex: 1 }}><Header onBack={() => router.back()} /></View>;
  const { app, hub } = data;

  const detailsDone = !!(app.first_names.trim() && app.surname.trim() && app.email.trim() && app.phone.trim() && app.location.trim() && app.hub_id);
  const ready = detailsDone && hasCvOrAbout(app);

  async function send() {
    if (!ready || !understood) return;
    setBusy(true);
    setError(null);
    const now = new Date().toISOString();
    const { error: err } = await supabase.from('applications').update({ submitted_at: now, ai_notice_seen_at: now }).eq('id', app.id);
    if (err) {
      setBusy(false);
      return setError('We could not send your application. Check your connection and try again.');
    }
    // Start writing the interview questions now. If it fails, the interview screen tries again.
    await callFunction('generate-questions', { application_id: app.id }).catch(() => undefined);
    setBusy(false);
    router.replace('/interview/consent');
  }

  const edit = (step: number) => router.push({ pathname: '/application/[step]', params: { step: String(step) } });

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="Send my application" haptic loading={busy} disabled={!ready || !understood} onPress={send} />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Review your application</Text>
          <Text variant="small">Check everything is right. After you send it, you cannot change it.</Text>
        </View>

        <Section title={STEP_TITLES[1]} onEdit={() => edit(1)}>
          <Row label="Name" value={`${app.first_names} ${app.surname}`.trim() || 'Not filled in'} missing={!app.first_names.trim() || !app.surname.trim()} />
          <Row label="Email" value={app.email || 'Not filled in'} missing={!app.email.trim()} />
          <Row label="Phone or WhatsApp" value={app.phone || 'Not filled in'} missing={!app.phone.trim()} />
          <Row label="Where you live" value={app.location || 'Not filled in'} missing={!app.location.trim()} />
          <Row label="Hub" value={hub ? `${hub.name}${hub.city ? `, ${hub.city}` : ''}` : 'Not chosen'} missing={!hub} />
        </Section>

        <Section title={STEP_TITLES[2]} onEdit={() => edit(2)}>
          {app.cv_path ? (
            <Row label="CV" value={app.cv_name ?? 'Uploaded'} />
          ) : (
            <Row label="About you (no CV)" value={app.about_text?.trim() || 'Not filled in'} missing={!hasCvOrAbout(app)} />
          )}
        </Section>

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
          <Text style={{ flex: 1 }}>I have read how my CV and answers are used, and what I have shared is true.</Text>
        </Pressable>

        {!ready ? <Text variant="small" style={{ color: colors.danger }}>Something is missing. Tap Edit on a section to finish it.</Text> : null}
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
      <Text style={{ color: missing ? colors.danger : colors.ink }} numberOfLines={6}>{value}</Text>
    </View>
  );
}
