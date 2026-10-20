import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Text } from '../../../components/Text';
import { callFunction } from '../../../lib/supabase';
import { colors, space } from '../../../theme';

const copy = {
  accepted: { verb: 'accept', title: 'Accept this applicant?', button: 'Yes, accept', icon: 'check-circle', color: colors.success },
  waitlisted: { verb: 'waitlist', title: 'Put this applicant on the waiting list?', button: 'Yes, waitlist', icon: 'clock', color: colors.warning },
  not_accepted: { verb: 'decline', title: 'Decline this applicant?', button: 'Yes, decline', icon: 'x-circle', color: colors.danger },
} as const;

export default function Decide() {
  const { id, decision, name } = useLocalSearchParams<{ id: string; decision: keyof typeof copy; name: string }>();
  const c = copy[decision] ?? copy.waitlisted;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await callFunction('decide', { application_id: id, decision });
      router.dismissTo('/board');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen
        footer={
          <>
            <Button title={c.button} haptic loading={busy} variant={decision === 'not_accepted' ? 'danger' : 'primary'} onPress={confirm} />
            <Button title="Go back" variant="ghost" onPress={() => router.back()} />
          </>
        }
      >
        <Feather name={c.icon} size={36} color={c.color} />
        <Text variant="h1">{c.title}</Text>
        <Card large>
          <Text variant="h3">{name}</Text>
          <Text variant="small">
            You are about to {c.verb} this applicant. They will see the decision in the app, get a notification and an email.
          </Text>
        </Card>
        <Text variant="small">This decision is yours. The AI summaries are only there to help you read.</Text>
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
