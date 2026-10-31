import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ChoiceList } from '../../components/ChoiceList';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { fetchHubs, useQuery } from '../../lib/data';
import { callFunction, supabase } from '../../lib/supabase';
import { colors, space } from '../../theme';

// Staff stay at their hub until the new hub's lead, or an admin, approves the move.
export default function StaffTransfer() {
  const { profile } = useAuth();
  const [hubName, setHubName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data, reload } = useQuery(async () => {
    const [hubs, { data: request }] = await Promise.all([
      fetchHubs(),
      supabase.from('staff_requests').select('hub_id').eq('user_id', profile!.id).maybeSingle(),
    ]);
    return { hubs, requested: request?.hub_id as string | undefined };
  }, [profile?.id]);

  const current = data?.hubs.find((h) => h.id === profile?.hub_id);
  const requested = data?.hubs.find((h) => h.id === data.requested);
  const others = (data?.hubs ?? []).filter((h) => h.id !== profile?.hub_id);
  const chosen = others.find((h) => h.name === hubName);

  async function send() {
    if (!chosen) return;
    setBusy(true);
    setError(null);
    try {
      await callFunction('staff-access', { action: 'transfer', hub_id: chosen.id });
      setHubName(null);
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={requested ? undefined : <Button title="Ask for this transfer" loading={busy} disabled={!chosen} onPress={send} />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Transfer to another hub</Text>
          <Text variant="small">Your hub now: {current?.name}. You stay here until your transfer is approved.</Text>
        </View>
        {requested ? (
          <Card tone="soft"><Text variant="small">You asked to move to {requested.name}. You will get a message when it is decided.</Text></Card>
        ) : (
          <ChoiceList options={others.map((h) => h.name)} value={hubName} onChange={(v) => setHubName(v as string)} />
        )}
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
