import { useState } from 'react';
import { View } from 'react-native';
import { Href, router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { supabase } from '../../lib/supabase';
import { colors, space } from '../../theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setError('Please enter a valid email address.');
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: false } });
    setBusy(false);
    if (err) {
      return setError(
        /signups not allowed|not found/i.test(err.message)
          ? 'We could not find an account with this email. Please create an account first.'
          : 'We could not send the code right now. Please try again in a few minutes.',
      );
    }
    router.push({ pathname: '/verify', params: { email: clean } });
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen
        centered
        footer={
          <>
            <Button title="Send me a code" loading={busy} onPress={submit} />
            <Button title="Create an account instead" variant="ghost" onPress={() => router.replace('/sign-up')} />
          </>
        }
      >
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Welcome back</Text>
          <Text variant="small">Enter the email you signed up with. We will email you a code.</Text>
        </View>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          onSubmitEditing={submit}
          error={error}
        />
        <Text variant="small" style={{ color: colors.muted }}>
          Staff with an account use the same screen with their work email.
        </Text>
        <Button title="New staff? Sign up here" variant="ghost" onPress={() => router.push('/staff' as Href)} />
      </Screen>
    </View>
  );
}
