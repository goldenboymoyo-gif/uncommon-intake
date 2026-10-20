import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { ChoiceList } from '../../components/ChoiceList';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { colors, space } from '../../theme';

type Student = { id: string; first_names: string; surname: string };

export default function JobOutcome() {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [employer, setEmployer] = useState('');
  const [role, setRole] = useState('');
  const [start, setStart] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: students } = useQuery(async () => {
    const { data } = await supabase.from('profiles').select('id, first_names, surname').eq('role', 'student').order('first_names');
    return (data ?? []) as Student[];
  });

  const name = (s: Student) => `${s.first_names} ${s.surname}`;
  const matches = (students ?? []).filter((s) => name(s).toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8);

  function parseDate(text: string) {
    const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
  }

  async function save() {
    if (!student || !employer.trim() || !role.trim() || !profile) return;
    if (start && !parseDate(start)) return setError('Please write the start date as DD/MM/YYYY, or leave it empty.');
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from('job_outcomes').insert({
      student_id: student.id,
      employer: employer.trim(),
      role: role.trim(),
      started_on: start ? parseDate(start) : null,
      recorded_by: profile.id,
    });
    setBusy(false);
    if (err) return setError('We could not save this. Please try again.');
    router.back();
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="Save job outcome" loading={busy} disabled={!student || !employer.trim() || !role.trim()} onPress={save} />}>
        <Text variant="h1">Record a job outcome</Text>
        <Text variant="small">Only record jobs you have checked with the student.</Text>

        {students && !students.length ? (
          <Text variant="small">There are no students yet. Students appear here after they confirm their place.</Text>
        ) : (
          <View style={{ gap: space.sm }}>
            <Input label="Student" placeholder="Search by name" value={student ? name(student) : search} onChangeText={(v) => { setStudent(null); setSearch(v); }} />
            {!student && search.trim() ? (
              <ChoiceList options={matches.map(name)} value={null} onChange={(v) => setStudent(matches.find((s) => name(s) === v) ?? null)} />
            ) : null}
          </View>
        )}
        <Input label="Employer" value={employer} onChangeText={setEmployer} />
        <Input label="Job title" value={role} onChangeText={setRole} />
        <Input label="Start date" optional placeholder="DD/MM/YYYY" value={start} onChangeText={setStart} />
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
