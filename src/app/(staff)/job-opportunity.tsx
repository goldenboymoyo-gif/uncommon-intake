import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { callFunction, supabase } from '../../lib/supabase';
import { colors } from '../../theme';

// Add a job for students and graduates, or edit one when opened with ?id=.
export default function JobOpportunity() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useAuth();
  const [form, setForm] = useState({ title: '', company: '', location: '', details: '', requirements: '', apply_url: '', closes_on: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    supabase
      .from('job_opportunities')
      .select('title, company, location, details, requirements, apply_url, closes_on')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setForm({ ...data, closes_on: data.closes_on ?? '' });
      });
  }, [id]);

  const url = /^https?:\/\//i.test(form.apply_url.trim()) ? form.apply_url.trim() : `https://${form.apply_url.trim()}`;
  const dateOk = !form.closes_on.trim() || /^\d{4}\/?\d{2}\/?\d{2}$/.test(form.closes_on.trim().replace(/\s/g, '/')) || !Number.isNaN(Date.parse(form.closes_on.trim()));
  const valid = form.title.trim() && form.company.trim() && form.details.trim() && form.apply_url.trim() && dateOk;

  async function save() {
    if (!valid || !profile) return;
    setBusy(true);
    setError(null);
    const fields = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim(),
      details: form.details.trim(),
      requirements: form.requirements.trim(),
      apply_url: url,
      closes_on: form.closes_on.trim() ? new Date(form.closes_on.trim()).toISOString().slice(0, 10) : null,
    };
    const { error: err } = id
      ? await supabase.from('job_opportunities').update(fields).eq('id', id)
      : await supabase.from('job_opportunities').insert({ ...fields, created_by: profile.id });
    if (err) {
      setBusy(false);
      return setError('We could not save the job. Please check the link and try again.');
    }
    if (!id) {
      await callFunction('notify-students', {
        kind: 'general',
        audience: 'learners',
        title: `New job: ${fields.title}`,
        body: `${fields.company} is hiring. Open Jobs to see the details and apply.`,
      }).catch(() => undefined);
    }
    setBusy(false);
    router.back();
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title={id ? 'Save changes' : 'Share this job'} loading={busy} disabled={!valid} onPress={save} />}>
        <Text variant="h1">{id ? 'Edit job' : 'Add a job'}</Text>
        <Input label="Job title" value={form.title} onChangeText={set('title')} />
        <Input label="Company" value={form.company} onChangeText={set('company')} />
        <Input label="Location (optional)" value={form.location} onChangeText={set('location')} />
        <Input label="About the job" multiline value={form.details} onChangeText={set('details')} />
        <Input label="What they need (optional)" multiline value={form.requirements} onChangeText={set('requirements')} />
        <Input label="Application link" value={form.apply_url} onChangeText={set('apply_url')} autoCapitalize="none" keyboardType="url" helper="Where people apply. Their details go straight to the employer." />
        <Input label="Closing date (optional)" value={form.closes_on} onChangeText={set('closes_on')} helper="For example: 2026 12 31. The job hides after this date." error={!dateOk ? 'Please write the date like 2026 12 31.' : null} />
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
        {id ? (
          <ConfirmDelete
            label="Delete this job"
            warning="This removes the job for students and graduates. It cannot be undone."
            onConfirm={async () => {
              const { error: err } = await supabase.from('job_opportunities').delete().eq('id', id);
              if (err) throw new Error('We could not delete the job. Please try again.');
              router.back();
            }}
          />
        ) : null}
      </Screen>
    </View>
  );
}
