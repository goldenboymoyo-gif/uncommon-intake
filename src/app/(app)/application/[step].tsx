import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { ChoiceList } from '../../../components/ChoiceList';
import { EmptyState } from '../../../components/EmptyState';
import { LetterUpload } from '../../../components/LetterUpload';
import { StepProgress } from '../../../components/StepProgress';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { fetchCurrentIntake, getOrCreateApplication } from '../../../lib/data';
import { AnswerMap, fetchAnswers, fetchFormSetup, FormSetup, isAnswered, letterStep, stepTitle } from '../../../lib/form';
import { TOTAL_STEPS } from '../../../lib/progress';
import { supabase } from '../../../lib/supabase';
import type { Application, FormQuestion } from '../../../lib/types';
import { colors, space } from '../../../theme';

const GENDERS = ['Female', 'Male', 'Prefer not to say'];

// Accepts DD/MM/YYYY and returns YYYY-MM-DD, or null if it is not a real date.
function parseDob(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCDate() !== d || date.getUTCMonth() !== mo - 1 || y < 1900 || date > new Date()) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
const showDob = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '');

export default function ApplicationStep() {
  const step = Number(useLocalSearchParams<{ step: string }>().step) || 1;
  const { profile } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [setup, setSetup] = useState<FormSetup | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [dobText, setDobText] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'offline'>('idle');
  const [busy, setBusy] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    (async () => {
      const intake = await fetchCurrentIntake();
      if (!intake || !profile) return;
      const a = await getOrCreateApplication(intake.id, profile.id);
      const [s, ans] = await Promise.all([fetchFormSetup(intake.id), fetchAnswers(a.id)]);
      setApp(a);
      setSetup(s);
      setAnswers(ans);
      setDobText(showDob(a.date_of_birth));
    })();
  }, [profile?.id]);

  // Autosave: each change is saved a moment after the person stops typing.
  function saveLater(key: string, save: () => Promise<{ error: unknown }>) {
    clearTimeout(timers.current[key]);
    setSaving('saving');
    timers.current[key] = setTimeout(async () => {
      const { error } = await save();
      setSaving(error ? 'offline' : 'saved');
    }, 700);
  }

  function setField<K extends keyof Application>(key: K, value: Application[K]) {
    if (!app) return;
    setApp({ ...app, [key]: value });
    saveLater(String(key), async () => supabase.from('applications').update({ [key]: value }).eq('id', app.id));
  }

  function setAnswer(q: FormQuestion, value: unknown) {
    if (!app) return;
    setAnswers((a) => ({ ...a, [q.id]: value }));
    saveLater(q.id, async () =>
      supabase.from('application_answers').upsert({ application_id: app.id, question_id: q.id, value, updated_at: new Date().toISOString() }),
    );
  }

  if (!app || !setup) {
    return (
      <View style={{ flex: 1 }}>
        <Header onBack={() => router.back()} />
        <ActivityIndicator style={{ marginTop: space.xxl }} color={colors.brand} />
      </View>
    );
  }

  const questions = setup.questions.filter((q) => q.step === step && q.kind !== 'letter_upload');
  const showLetter = step === letterStep(setup);
  const notReady = step > 1 && !setup.questions.some((q) => q.step === step);

  const stepOneErrors = {
    first_names: !app.first_names.trim() ? 'Please enter your first names.' : null,
    surname: !app.surname.trim() ? 'Please enter your surname.' : null,
    gender: !app.gender ? 'Please choose one.' : null,
    dob: !app.date_of_birth ? 'Please enter your date of birth as DD/MM/YYYY.' : null,
    phone: app.phone.replace(/\D/g, '').length < 9 ? 'Please enter a phone or WhatsApp number.' : null,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email.trim()) ? 'Please enter a valid email address.' : null,
  };
  const missing = questions.filter((q) => q.required && !isAnswered(answers[q.id]));
  const stepValid =
    (step !== 1 || !Object.values(stepOneErrors).some(Boolean)) &&
    missing.length === 0 &&
    (!showLetter || !!app.letter_path) &&
    !notReady;

  async function next() {
    setTouched(true);
    if (!stepValid || !app) return;
    setBusy(true);
    const nextStep = Math.max(app.current_step, step + 1);
    await supabase.from('applications').update({ current_step: nextStep }).eq('id', app.id);
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
            <Button title={step >= TOTAL_STEPS ? 'Review your application' : 'Next'} onPress={next} loading={busy} disabled={notReady} />
            <Button title="Save and finish later" variant="ghost" onPress={() => router.navigate('/home')} />
          </>
        }
      >
        <StepProgress current={step} total={TOTAL_STEPS} />
        <View style={{ gap: space.xs }}>
          <Text variant="h1">{stepTitle(setup, step)}</Text>
          <Text variant="small">
            {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'All changes saved' : saving === 'offline' ? 'Not saved yet. Check your connection.' : 'Your answers save as you go.'}
          </Text>
        </View>

        {step === 1 ? (
          <>
            <Input label="First names" value={app.first_names} onChangeText={(v) => setField('first_names', v)} error={touched ? stepOneErrors.first_names : null} />
            <Input label="Surname" value={app.surname} onChangeText={(v) => setField('surname', v)} error={touched ? stepOneErrors.surname : null} />
            <View style={{ gap: space.sm }}>
              <Text variant="smallSemi">Gender</Text>
              <ChoiceList options={GENDERS} value={app.gender} onChange={(v) => setField('gender', v as string)} />
              {touched && stepOneErrors.gender ? <Text variant="small" style={{ color: colors.danger }}>{stepOneErrors.gender}</Text> : null}
            </View>
            <Input
              label="Date of birth"
              placeholder="DD/MM/YYYY"
              keyboardType="numbers-and-punctuation"
              value={dobText}
              onChangeText={(v) => {
                setDobText(v);
                const iso = parseDob(v);
                if (iso || !v) setField('date_of_birth', iso);
              }}
              error={touched ? stepOneErrors.dob : null}
            />
            <Input label="Phone or WhatsApp number" keyboardType="phone-pad" value={app.phone} onChangeText={(v) => setField('phone', v)} error={touched ? stepOneErrors.phone : null} />
            <Input label="Email" keyboardType="email-address" autoCapitalize="none" value={app.email} onChangeText={(v) => setField('email', v)} error={touched ? stepOneErrors.email : null} />
          </>
        ) : notReady ? (
          <EmptyState icon="clock" title="This part of the form is not ready yet" body="We will let you know as soon as it opens. Your answers so far are saved." />
        ) : (
          questions.map((q) => (
            <QuestionField key={q.id} question={q} value={answers[q.id]} onChange={(v) => setAnswer(q, v)} error={touched && missing.includes(q) ? 'Please answer this question.' : null} />
          ))
        )}

        {showLetter && !notReady ? (
          <>
            <LetterUpload application={app} onChange={setApp} />
            {touched && !app.letter_path ? <Text variant="small" style={{ color: colors.danger }}>Please upload your letter.</Text> : null}
          </>
        ) : null}
      </Screen>
    </View>
  );
}

function QuestionField({ question: q, value, onChange, error }: { question: FormQuestion; value: unknown; onChange: (v: unknown) => void; error: string | null }) {
  if (q.kind === 'single_choice' || q.kind === 'multi_choice' || q.kind === 'yes_no') {
    return (
      <View style={{ gap: space.sm }}>
        <Text variant="smallSemi">{q.label}{q.required ? '' : ' (optional)'}</Text>
        {q.help_text ? <Text variant="small">{q.help_text}</Text> : null}
        <ChoiceList
          options={q.kind === 'yes_no' ? ['Yes', 'No'] : q.options}
          multiple={q.kind === 'multi_choice'}
          value={value as string | string[] | null}
          onChange={onChange}
        />
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </View>
    );
  }
  return (
    <Input
      label={q.label}
      optional={!q.required}
      helper={q.help_text ?? (q.kind === 'date' ? 'DD/MM/YYYY' : undefined)}
      value={(value as string) ?? ''}
      onChangeText={onChange}
      multiline={q.kind === 'long_text'}
      keyboardType={q.kind === 'number' ? 'number-pad' : 'default'}
      error={error}
    />
  );
}
