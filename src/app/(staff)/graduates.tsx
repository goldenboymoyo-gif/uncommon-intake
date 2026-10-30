import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { callFunction } from '../../lib/supabase';
import { colors } from '../../theme';

// Gives a graduate access to the career coach and job opportunities.
export default function Graduates() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const { name } = await callFunction<{ name: string }>('set-graduate', { email: email.trim() });
      setDone(`${name || 'This person'} is now a graduate. They can use the coach and see jobs.`);
      setEmail('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="Mark as graduate" loading={busy} disabled={!email.includes('@')} onPress={save} />}>
        <Text variant="h1">Add a graduate</Text>
        <Text variant="small">The graduate creates an account first. Type the email on their account to give them the career coach and job opportunities.</Text>
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
        {done ? <Text variant="small" style={{ color: colors.success }}>{done}</Text> : null}
      </Screen>
    </View>
  );
}
