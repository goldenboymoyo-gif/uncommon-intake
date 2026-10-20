import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { supabase } from '../../lib/supabase';
import { colors, layout, radius, space } from '../../theme';

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const phoneOk = (v: string) => v.replace(/[^\d]/g, '').length >= 9;

export default function SignUp() {
  const [form, setForm] = useState({ first_names: '', surname: '', phone: '', email: '' });
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const errors = {
    first_names: !form.first_names.trim() ? 'Please enter your first names.' : null,
    surname: !form.surname.trim() ? 'Please enter your surname.' : null,
    phone: !phoneOk(form.phone) ? 'Please enter a phone or WhatsApp number.' : null,
    email: !emailOk(form.email) ? 'Please enter a valid email address.' : null,
  };
  const valid = !Object.values(errors).some(Boolean) && agreed;

  async function submit() {
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    setError(null);
    const email = form.email.trim().toLowerCase();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: { first_names: form.first_names.trim(), surname: form.surname.trim(), phone: form.phone.trim() },
      },
    });
    setBusy(false);
    if (err) return setError('We could not send the code. Check your email address and try again.');
    router.push({ pathname: '/verify', params: { email, terms: '1' } });
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="Send me a code" loading={busy} onPress={submit} haptic />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Create your account</Text>
          <Text variant="small">You need an account to apply. We will email you a code to sign in. No password needed.</Text>
        </View>
        <Input label="First names" value={form.first_names} onChangeText={set('first_names')} autoComplete="given-name" textContentType="givenName" error={touched ? errors.first_names : null} />
        <Input label="Surname" value={form.surname} onChangeText={set('surname')} autoComplete="family-name" textContentType="familyName" error={touched ? errors.surname : null} />
        <Input label="Phone or WhatsApp number" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" helper="We only use this if we need to reach you about your application." error={touched ? errors.phone : null} />
        <Input label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" helper="We send your sign in code and your decision here." error={touched ? errors.email : null} />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={() => setAgreed((a) => !a)}
          style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start', minHeight: layout.tapTarget }}
        >
          <View style={{ width: 24, height: 24, borderRadius: radius.sm / 2, borderWidth: 1.5, borderColor: agreed ? colors.brand : colors.muted, backgroundColor: agreed ? colors.brand : colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            {agreed ? <Feather name="check" size={16} color={colors.white} /> : null}
          </View>
          <Text style={{ flex: 1 }}>
            I agree to the{' '}
            <Text style={{ color: colors.brand, textDecorationLine: 'underline' }} onPress={() => router.push('/terms')}>
              terms and privacy notice
            </Text>
            .
          </Text>
        </Pressable>
        {touched && !agreed ? <Text variant="small" style={{ color: colors.danger }}>Please agree to the terms to continue.</Text> : null}
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
