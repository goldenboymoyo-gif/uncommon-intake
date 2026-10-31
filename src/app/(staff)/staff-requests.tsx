import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Text';
import { formatDate, useQuery } from '../../lib/data';
import { callFunction } from '../../lib/supabase';
import { colors, space } from '../../theme';

type Request = {
  user_id: string;
  kind: 'join' | 'transfer';
  created_at: string;
  hubs: { name: string } | null;
  profiles: { first_names: string; surname: string; email: string; phone: string } | null;
};

// Hub leads see requests for their own hub. Admins see every hub.
export default function StaffRequests() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data, loading, reload } = useQuery(async () => (await callFunction<{ requests: Request[] }>('staff-access', { action: 'list' })).requests, []);

  async function decide(userId: string, approve: boolean) {
    setBusy(userId);
    setError(null);
    try {
      await callFunction('staff-access', { action: 'decide', user_id: userId, approve });
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Staff requests</Text>
          <Text variant="small">Only approve people you know work at this hub. They will see applicants' private details.</Text>
        </View>
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
        {!loading && !data?.length ? <EmptyState icon="users" title="Nobody is waiting" /> : null}
        {data?.map((r) => (
          <Card key={r.user_id} style={{ gap: space.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
              <Text variant="bodySemi" style={{ flex: 1 }}>{`${r.profiles?.first_names ?? ''} ${r.profiles?.surname ?? ''}`.trim() || r.profiles?.email}</Text>
              <Chip label={r.kind === 'join' ? 'New staff' : 'Transfer'} tone="brand" />
            </View>
            <Text variant="small">{r.profiles?.email}</Text>
            <Text variant="small">{r.profiles?.phone}</Text>
            <Text variant="small">{r.kind === 'join' ? 'Wants to join' : 'Wants to move to'} {r.hubs?.name}, asked on {formatDate(r.created_at)}</Text>
            <Button title="Approve" loading={busy === r.user_id} onPress={() => decide(r.user_id, true)} />
            <Button title="Reject" variant="ghost" disabled={!!busy} onPress={() => decide(r.user_id, false)} />
          </Card>
        ))}
      </Screen>
    </View>
  );
}
