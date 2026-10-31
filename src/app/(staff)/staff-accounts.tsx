import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { ChoiceList } from '../../components/ChoiceList';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { fetchHubs, useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { colors, space } from '../../theme';

type Person = { id: string; first_names: string; surname: string; email: string; role: 'staff' | 'admin'; hub_id: string | null; is_hub_lead: boolean };
type Invite = { email: string; hub_id: string; is_lead: boolean };

// Admins set up hub leads here, and can add staff directly, move them or remove them.
const STAFF_ROLES = ['Staff', 'Hub lead'];

export default function StaffAccounts() {
  const { profile } = useAuth();
  const [email, setEmail] = useState('');
  const [hubName, setHubName] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('Staff');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, reload } = useQuery(async () => {
    const [hubs, { data: people, error: peopleError }, { data: invites }] = await Promise.all([
      fetchHubs(),
      supabase.from('profiles').select('id, first_names, surname, email, role, hub_id, is_hub_lead').in('role', ['staff', 'admin']).order('first_names'),
      supabase.from('staff_invites').select('email, hub_id, is_lead').order('email'),
    ]);
    if (peopleError) throw peopleError;
    return { hubs, people: (people ?? []) as Person[], invites: (invites ?? []) as Invite[] };
  }, []);

  const hubLabel = (id: string | null) => data?.hubs.find((h) => h.id === id)?.name ?? 'No hub yet';

  async function add(address: string, hubId: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    const { data: result, error: err } = await supabase.rpc('admin_set_staff', { p_email: address, p_hub: hubId, p_lead: roleName === 'Hub lead' });
    setBusy(false);
    if (err) return setError(err.message);
    setMessage(result === 'added' ? `${address} is now staff at ${hubLabel(hubId)}.` : `Saved. When ${address} creates an account with this email, they become staff at ${hubLabel(hubId)}.`);
    setEmail('');
    setHubName(null);
    setRoleName('Staff');
    reload();
  }

  function removeStaff(person: Person) {
    const go = async () => {
      const { error: err } = await supabase.rpc('admin_remove_staff', { p_person: person.id });
      if (err) return setError(err.message);
      reload();
    };
    if (Platform.OS === 'web') return void go();
    Alert.alert('Remove this staff member?', `${person.email} will lose access to staff screens.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: go },
    ]);
  }

  async function cancelInvite(address: string) {
    await supabase.from('staff_invites').delete().eq('email', address);
    reload();
  }

  const chosenHub = data?.hubs.find((h) => h.name === hubName);

  if (profile?.role !== 'admin') return null;
  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Staff accounts</Text>
          <Text variant="small">Add a hub lead or staff member and choose their hub. They only see applicants, students and surveys from that hub.</Text>
        </View>

        <Card large style={{ gap: space.md }}>
          <Input label="Their email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Text variant="smallSemi">Their hub</Text>
          <ChoiceList options={(data?.hubs ?? []).map((h) => h.name)} value={hubName} onChange={(v) => setHubName(v as string)} />
          <Text variant="smallSemi">Their role</Text>
          <ChoiceList options={STAFF_ROLES} value={roleName} onChange={(v) => setRoleName(v as string)} />
          {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
          {message ? <Text variant="small" style={{ color: colors.success }}>{message}</Text> : null}
          <Button title="Save" loading={busy} disabled={!email.trim() || !chosenHub} onPress={() => chosenHub && add(email.trim(), chosenHub.id)} />
        </Card>

        {data?.invites.length ? <Text variant="h2">Waiting to sign up</Text> : null}
        {data?.invites.map((i) => (
          <Card key={i.email} tone="soft" style={{ gap: space.xs }}>
            <Text variant="bodySemi">{i.email}</Text>
            <Text variant="small">{hubLabel(i.hub_id)}{i.is_lead ? ', hub lead' : ''}</Text>
            <Button title="Cancel" variant="ghost" onPress={() => cancelInvite(i.email)} />
          </Card>
        ))}

        <Text variant="h2">Staff and admins</Text>
        {data?.people.map((p) => (
          <Card key={p.id} style={{ gap: space.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
              <Text variant="bodySemi" style={{ flex: 1 }}>{`${p.first_names} ${p.surname}`.trim() || p.email}</Text>
              <Chip label={p.role === 'admin' ? 'All hubs' : hubLabel(p.hub_id)} tone={p.role === 'staff' && !p.hub_id ? 'warning' : 'brand'} />
            </View>
            <Text variant="small">{p.email}{p.is_hub_lead ? ', hub lead' : ''}</Text>
            {p.role === 'staff' ? (
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button title="Change hub" variant="ghost" onPress={() => { setEmail(p.email); setHubName(null); setRoleName(p.is_hub_lead ? 'Hub lead' : 'Staff'); setMessage('Choose their new hub above, then tap Save.'); }} />
                <Button title="Remove" variant="ghost" onPress={() => removeStaff(p)} />
              </View>
            ) : null}
          </Card>
        ))}
      </Screen>
    </View>
  );
}
