import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { HubPicker } from '../../../components/HubPicker';
import { CvUpload, LetterUpload, hasDocuments } from '../../../components/CvUpload';
import { StepProgress } from '../../../components/StepProgress';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { fetchCurrentIntake, fetchHubs, getOrCreateApplication } from '../../../lib/data';
import { STEP_TITLES, TOTAL_STEPS } from '../../../lib/progress';
import { supabase } from '../../../lib/supabase';
import type { Application, Hub } from '../../../lib/types';
import { colors, space } from '../../../theme';

export default function ApplicationStep() {
  const step = Math.min(Math.max(Number(useLocalSearchParams<{ step: string }>().step) || 1, 1), TOTAL_STEPS);
  const { profile } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  const [busy, setBusy] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    (async () => {
      const intake = await fetchCurrentIntake();
      if (!intake || !profile) return;
      const [a, h] = await Promise.all([getOrCreateApplication(intake.id, profile.id), fetchHubs()]);
      setApp(a);
      setHubs(h);
    })();
  }, [profile?.id]);

  // Autosave: each change is saved a moment after the person stops typing.
  function setField<K extends keyof Application>(key: K, value: Application[K]) {
    if (!app) return;
    setApp({ ...app, [key]: value });
    clearTimeout(timers.current[String(key)]);
    setSaving('saving');
    timers.current[String(key)] = setTimeout(async () => {
      const { error } = await supabase.from('applications').update({ [key]: value }).eq('id', app.id);
      setSaving(error ? 'offline' : 'saved');
    }, 700);
  }

  if (!app) {
    return (
      <View style={{ flex: 1 }}>
        <Header onBack={() => router.back()} />
        <ActivityIndicator style={{ marginTop: space.xxl }} color={colors.brand} />
      </View>
    );
  }

  const errors = {
    first_names: !app.first_names.trim() ? 'Please enter your first names.' : null,
    surname: !app.surname.trim() ? 'Please enter your surname.' : null,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email.trim()) ? 'Please enter a valid email address.' : null,
    phone: app.phone.replace(/\D/g, '').length < 9 ? 'Please enter a phone or WhatsApp number.' : null,
    location: !app.location.trim() ? 'Please tell us where you live.' : null,
    hub: !app.hub_id ? 'Please choose a hub.' : null,
  };
  const stepValid = step === 1 ? !Object.values(errors).some(Boolean) : hasDocuments(app);

  async function next() {
    setTouched(true);
    if (!stepValid || !app) return;
    setBusy(true);
    await supabase.from('applications').update({ current_step: Math.max(app.current_step, step + 1) }).eq('id', app.id);
    setBusy(false);
    setTouched(false);
    if (step >= TOTAL_STEPS) router.replace('/application/review');
    else router.replace({ pathname: '/application/[step]', params: { step: String(step + 1) } });
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen
        footer={
          <>
            <Button title={step >= TOTAL_STEPS ? 'Review your application' : 'Next'} onPress={next} loading={busy} />
            <Button title="Save and finish later" variant="ghost" onPress={() => router.navigate('/home')} />
          </>
        }
      >
        <StepProgress current={step} total={TOTAL_STEPS} />
        <View style={{ gap: space.xs }}>
          <Text variant="h1">{STEP_TITLES[step]}</Text>
          <Text variant="small">
            {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'All changes saved' : saving === 'offline' ? 'Not saved yet. Check your connection.' : 'Your answers save as you go.'}
          </Text>
        </View>

        {step === 1 ? (
          <>
            <Input label="First names" value={app.first_names} onChangeText={(v) => setField('first_names', v)} autoComplete="given-name" error={touched ? errors.first_names : null} />
            <Input label="Surname" value={app.surname} onChangeText={(v) => setField('surname', v)} autoComplete="family-name" error={touched ? errors.surname : null} />
            <Input label="Email" keyboardType="email-address" autoCapitalize="none" value={app.email} onChangeText={(v) => setField('email', v)} error={touched ? errors.email : null} />
            <Input label="Phone or WhatsApp number" keyboardType="phone-pad" value={app.phone} onChangeText={(v) => setField('phone', v)} error={touched ? errors.phone : null} />
            <Input
              label="Where do you live?"
              placeholder="For example: Mbare, Harare"
              value={app.location}
              onChangeText={(v) => setField('location', v)}
              helper="Your suburb or area, and your town or city."
              error={touched ? errors.location : null}
            />
            <View style={{ gap: space.sm }}>
              <Text variant="h3">Choose a hub</Text>
              <Text variant="small">The Innovation Hub where you would like to study. Pick the one easiest for you to reach every day.</Text>
              <HubPicker hubs={hubs} value={app.hub_id} onChange={(id) => setField('hub_id', id)} />
              {touched && errors.hub ? <Text variant="small" style={{ color: colors.danger }}>{errors.hub}</Text> : null}
            </View>
          </>
        ) : (
          <>
            <Text>
              Upload your CV as a PDF or Word file, up to 5MB. After you send your application, AI reads your CV and writes 5 interview
              questions about your own experience.
            </Text>
            <CvUpload application={app} onChange={setApp} onAboutChange={(v) => setField('about_text', v)} showErrors={touched} />
            <Text variant="h3">Motivation letter</Text>
            <Text>Tell us why you want to join the bootcamp and what you hope to do with technology. Upload it as a PDF or Word file, up to 5MB.</Text>
            <LetterUpload application={app} onChange={setApp} showErrors={touched} />
          </>
        )}
      </Screen>
    </View>
  );
}
