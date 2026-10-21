import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Text';
import { peopleDecide } from '../../content';
import { useAuth } from '../../lib/auth';
import { formatDate, useMyApplication } from '../../lib/data';
import { callFunction } from '../../lib/supabase';
import type { Application } from '../../lib/types';
import { colors, space } from '../../theme';

type Stage = { title: string; body: string; date?: string | null; done: boolean };

function stages(app: Application): Stage[] {
  const reviewStarted = app.review_status === 'in_review' || app.review_status === 'needs_help' || !!app.decision;
  return [
    { title: 'Application received', body: 'We have your details and your CV.', date: app.submitted_at, done: !!app.submitted_at },
    { title: 'Interview answers sent', body: 'We have your 5 answers.', date: app.interview_sent_at, done: !!app.interview_sent_at },
    { title: 'Review by staff', body: 'A member of our team reads your application and answers.', done: reviewStarted },
    { title: 'Decision', body: 'We will tell you in the app, with a notification, and by email.', date: app.decided_at, done: !!app.decision },
  ];
}

const decisionText = {
  accepted: { title: 'You have a place', body: 'Well done. Our team has offered you a place in the bootcamp. Please confirm you are taking it.', icon: 'award', color: colors.success, bg: colors.successBg },
  waitlisted: { title: 'You are on the waiting list', body: 'Our team has put you on the waiting list. If a place opens up, we will tell you here and by email.', icon: 'clock', color: colors.warning, bg: colors.warningBg },
  not_accepted: { title: 'Not this time', body: 'Thank you for applying. Our team was not able to offer you a place this time. We wish you all the best.', icon: 'heart', color: colors.muted, bg: colors.soft },
} as const;

export default function Status() {
  const { refreshProfile } = useAuth();
  const { data: app, loading, reload } = useMyApplication();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmPlace() {
    if (!app) return;
    setBusy(true);
    setError(null);
    try {
      await callFunction('confirm-place', { application_id: app.id });
      await refreshProfile();
      router.replace('/home');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const decision = app?.decision ? decisionText[app.decision] : null;

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload}>
        <Text variant="h1">Application status</Text>

        {!app?.submitted_at ? (
          <EmptyState icon="file-text" title="You have not sent an application yet" body="Your status will show here after you send it." />
        ) : (
          <>
            {decision ? (
              <Card large style={{ backgroundColor: decision.bg, borderColor: decision.bg, gap: space.md }}>
                <Feather name={decision.icon} size={26} color={decision.color} />
                <Text variant="h2">{decision.title}</Text>
                <Text>{decision.body}</Text>
                {app.decision === 'accepted' && !app.place_confirmed_at ? (
                  <Button title="Confirm my place" haptic loading={busy} onPress={confirmPlace} />
                ) : null}
                {app.place_confirmed_at ? (
                  <Text variant="smallSemi" style={{ color: colors.success }}>You confirmed your place on {formatDate(app.place_confirmed_at)}.</Text>
                ) : null}
                {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
              </Card>
            ) : null}

            <Card large style={{ gap: 0 }}>
              {stages(app).map((s, i, all) => (
                <View key={s.title} style={{ flexDirection: 'row', gap: space.md }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: s.done ? colors.success : colors.soft, borderWidth: s.done ? 0 : 1, borderColor: colors.border }}>
                      {s.done ? <Feather name="check" size={16} color={colors.white} /> : null}
                    </View>
                    {i < all.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: s.done ? colors.success : colors.border }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: i < all.length - 1 ? space.xl : 0, gap: 2 }}>
                    <Text variant="bodySemi" style={{ color: s.done ? colors.ink : colors.muted }}>{s.title}</Text>
                    <Text variant="small">{s.done && s.date ? formatDate(s.date) : s.body}</Text>
                  </View>
                </View>
              ))}
            </Card>

            {!app.interview_sent_at ? (
              <Button title="Go to your interview" onPress={() => router.push(app.recording_consent_at ? '/interview' : '/interview/consent')} />
            ) : null}
          </>
        )}

        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="users" size={16} color={colors.brand} />
          <Text variant="smallSemi" style={{ color: colors.brand }}>{peopleDecide}</Text>
        </View>
      </Screen>
    </View>
  );
}
