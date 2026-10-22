import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { supabase } from '../../lib/supabase';
import { space } from '../../theme';

export default function Verify() {
  const { email, terms } = useLocalSearchParams<{ email: string; terms?: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(60);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function verify() {
    const token = code.replace(/\D/g, '');
    if (token.length < 6) return setError('Please enter the code from your email.');
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    setBusy(false);
    if (err || !data.user) return setError('That code did not work. Check it, or ask for a new one.');
    if (terms === '1') {
      // Not awaited: the signed-in screens open straight away.
      supabase.from('profiles').update({ terms_accepted_at: new Date().toISOString() }).eq('id', data.user.id).then(() => undefined);
    }
    // The root layout now shows the signed-in screens.
  }

  async function resend() {
    setWait(60);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: terms === '1' } });
    if (err) setError('We could not send a new code. Please try again in a minute.');
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen
        centered
        footer={
          <>
            <Button title="Continue" loading={busy} onPress={verify} haptic />
            <Button
              title={wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
              variant="ghost"
              disabled={wait > 0}
              onPress={resend}
            />
          </>
        }
      >
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Check your email</Text>
          <Text variant="small">We sent a code to {email}. It can take a minute to arrive. Check your spam folder too.</Text>
        </View>
        <Input
          label="Code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={10}
          autoFocus
          onSubmitEditing={verify}
          error={error}
          style={{ fontSize: 22, letterSpacing: 6 }}
        />
      </Screen>
    </View>
  );
}
