import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Chip } from '../../../components/Chip';
import { EmptyState } from '../../../components/EmptyState';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { fetchCurrentIntake, formatDate, getOrCreateApplication, intakeState, useMyApplication, useQuery } from '../../../lib/data';
import { STEP_TITLES, TOTAL_STEPS } from '../../../lib/progress';
import { colors, space } from '../../../theme';

export default function ApplicationTab() {
  const { profile } = useAuth();
  const { data: app, loading, reload } = useMyApplication();
  const { data: intake } = useQuery(fetchCurrentIntake);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    if (!intake || !profile) return;
    setStarting(true);
    setError(null);
    try {
      await getOrCreateApplication(intake.id, profile.id);
      router.push({ pathname: '/application/[step]', params: { step: '1' } });
    } catch {
      setError('We could not start your application. Please check your connection and try again.');
    } finally {
      setStarting(false);
    }
  }

  if (!loading && !app && intakeState(intake ?? null) !== 'open') {
    return (
      <Screen withTabBar refreshing={loading} onRefresh={reload}>
        <Text variant="h1">Application</Text>
        <EmptyState
          icon="calendar"
          title={intakeState(intake ?? null) === 'not_yet' ? `Applications open on ${formatDate(intake?.opens_at)}` : 'Applications are closed'}
          body={intakeState(intake ?? null) === 'not_yet' ? 'Come back on that day to start your application.' : 'We will show the form here when the next intake opens.'}
        />
      </Screen>
    );
  }

  const steps = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);
  const current = app?.current_step ?? 1;

  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <View style={{ gap: space.xs }}>
        <Text variant="h1">Application</Text>
        <Text variant="small">
          {app?.submitted_at
            ? `Sent on ${formatDate(app.submitted_at)}. You can no longer change it.`
            : '2 short steps. Your answers save as you go, so you can finish later.'}
        </Text>
      </View>

      {!app ? (
        <Card large>
          <Text variant="h2">Ready to apply?</Text>
          <Text variant="small">Have your CV ready as a PDF or Word file (up to 5MB). No CV? You can write about yourself instead.</Text>
          <Button title="Start application" loading={starting} onPress={start} haptic />
          {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          {steps.map((n) => {
            const done = !!app.submitted_at || n < current;
            const isCurrent = !app.submitted_at && n === current;
            const locked = !app.submitted_at && n > current;
            return (
              <Card
                key={n}
                onPress={locked || app.submitted_at ? undefined : () => router.push({ pathname: '/application/[step]', params: { step: String(n) } })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: locked ? 0.6 : 1 }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? colors.successBg : isCurrent ? colors.brand : colors.soft }}>
                  {done ? <Feather name="check" size={16} color={colors.success} /> : <Text variant="smallSemi" style={{ color: isCurrent ? colors.white : colors.muted }}>{n}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemi">{STEP_TITLES[n]}</Text>
                </View>
                {isCurrent ? <Chip label="Next" tone="brand" /> : null}
              </Card>
            );
          })}
          {!app.submitted_at && current > TOTAL_STEPS ? (
            <Button title="Review your application" onPress={() => router.push('/application/review')} />
          ) : null}
          {app.submitted_at ? <Button title="See your status" variant="outline" onPress={() => router.push('/status')} /> : null}
        </View>
      )}
    </Screen>
  );
}
