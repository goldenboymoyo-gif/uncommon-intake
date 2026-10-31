import { useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ChoiceList } from '../../components/ChoiceList';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { fetchHubs, useQuery } from '../../lib/data';
import { callFunction } from '../../lib/supabase';
import { colors, space } from '../../theme';

// A new staff member adds their details and chooses their one hub, then waits for approval.
export default function StaffDetails() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { data: hubs } = useQuery(fetchHubs, []);
  const [firstNames, setFirstNames] = useState(profile?.first_names ?? '');
  const [surname, setSurname] = useState(profile?.surname ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [hubName, setHubName] = useState<string | null>(null);
  const [tryAgain, setTryAgain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hub = hubs?.find((h) => h.name === hubName);
  const status = tryAgain ? null : profile?.staff_status;

  async function send() {
    if (!hub) return;
    setBusy(true);
    setError(null);
    try {
      await callFunction('staff-access', { action: 'request', first_names: firstNames, surname, phone, hub_id: hub.id });
      setTryAgain(false);
      await refreshProfile();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'pending' || status === 'rejected') {
    return (
      <Screen centered footer={<Button title="Sign out" variant="ghost" onPress={signOut} />}>
        <Card large style={{ gap: space.md }}>
          <Text variant="h2">{status === 'pending' ? 'Waiting for approval' : 'Your request was not approved'}</Text>
          <Text variant="small">
            {status === 'pending'
              ? 'Your hub lead has been told. You will get a message when they approve you.'
              : 'Please speak to your hub lead. If you chose the wrong hub, you can ask again.'}
          </Text>
          {status === 'pending'
            ? <Button title="Check again" variant="outline" onPress={refreshProfile} />
            : <Button title="Ask again" variant="outline" onPress={() => setTryAgain(true)} />}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="Send for approval" loading={busy} disabled={!firstNames.trim() || !surname.trim() || !phone.trim() || !hub} onPress={send} />}>
      <View style={{ gap: space.xs }}>
        <Text variant="h1">Your staff details</Text>
        <Text variant="small">Your hub lead will check these before you get access.</Text>
      </View>
      <Input label="First names" value={firstNames} onChangeText={setFirstNames} />
      <Input label="Surname" value={surname} onChangeText={setSurname} />
      <Input label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Text variant="smallSemi">Your hub</Text>
      <ChoiceList options={(hubs ?? []).map((h) => h.name)} value={hubName} onChange={(v) => setHubName(v as string)} />
      <Text variant="small">Choose carefully. You can only have one hub, and changing it later needs a transfer request.</Text>
      {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
