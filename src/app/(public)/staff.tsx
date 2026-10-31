import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { supabase } from '../../lib/supabase';
import { space } from '../../theme';

// Staff sign up here with their work email. Applicants use the normal sign up.
export default function StaffSignUp() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@uncommon\.org$/.test(clean)) return setError('Please use your @uncommon.org work email.');
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
    setBusy(false);
    if (err) return setError('We could not send the code right now. Please try again in a few minutes.');
    router.push({ pathname: '/verify', params: { email: clean, staff: '1' } });
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen centered footer={<Button title="Send me a code" loading={busy} onPress={submit} />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Staff sign up</Text>
          <Text variant="small">For Uncommon staff only. Enter your work email and we will email you a code. Your hub lead then approves your account.</Text>
        </View>
        <Input
          label="Work email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          onSubmitEditing={submit}
          error={error}
        />
      </Screen>
    </View>
  );
}
