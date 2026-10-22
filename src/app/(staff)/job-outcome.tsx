import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { ChoiceList } from '../../components/ChoiceList';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { useAuth } from '../../lib/auth';
import { useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { colors, space } from '../../theme';

type Student = { id: string; first_names: string; surname: string };

const name = (s: Student) => `${s.first_names} ${s.surname}`;
const toIso = (text: string) => {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
};
const fromIso = (iso: string | null) => (iso ? iso.split('-').reverse().join('/') : '');

// Add a job outcome, or edit one when opened with ?id=.
export default function JobOutcome() {
  const { id } = useLocalSearchParams<{ id?: string }>();
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

  useEffect(() => {
    if (!id) return;
    supabase
      .from('job_outcomes')
      .select('employer, role, started_on, profiles!job_outcomes_student_id_fkey(id, first_names, surname)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setEmployer(data.employer);
        setRole(data.role);
        setStart(fromIso(data.started_on));
        setStudent(data.profiles as unknown as Student);
      });
  }, [id]);

  const matches = (students ?? []).filter((s) => name(s).toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8);

  async function save() {
    if (!student || !employer.trim() || !role.trim() || !profile) return;
    if (start && !toIso(start)) return setError('Please write the start date as DD/MM/YYYY, or leave it empty.');
    setBusy(true);
    setError(null);
    const fields = { student_id: student.id, employer: employer.trim(), role: role.trim(), started_on: start ? toIso(start) : null };
    const { error: err } = id
      ? await supabase.from('job_outcomes').update(fields).eq('id', id)
      : await supabase.from('job_outcomes').insert({ ...fields, recorded_by: profile.id });
    setBusy(false);
    if (err) return setError('We could not save this. Please try again.');
    router.back();
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title={id ? 'Save changes' : 'Save job outcome'} loading={busy} disabled={!student || !employer.trim() || !role.trim()} onPress={save} />}>
        <Text variant="h1">{id ? 'Edit job outcome' : 'Record a job outcome'}</Text>
        <Text variant="small">Only record jobs you have checked with the student.</Text>

        {students && !students.length && !id ? (
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
        {id ? (
          <ConfirmDelete
            label="Delete this job outcome"
            warning="This removes the job outcome from the records and the overview count."
            onConfirm={async () => {
              const { error: err } = await supabase.from('job_outcomes').delete().eq('id', id);
              if (err) throw new Error('We could not delete this. Please try again.');
              router.back();
            }}
          />
        ) : null}
      </Screen>
    </View>
  );
}
