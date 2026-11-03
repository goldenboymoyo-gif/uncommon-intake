import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { AiLabel } from '../../../components/AiLabel';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Chip, reviewStatusChip } from '../../../components/Chip';
import { Input } from '../../../components/Input';
import { AudioPlayback, VideoPlayback } from '../../../components/MediaPlayer';
import { Text } from '../../../components/Text';
import { peopleDecide } from '../../../content';
import { useAuth } from '../../../lib/auth';
import { formatDate, useQuery } from '../../../lib/data';
import { fetchQuestions } from '../../../lib/interview';
import { STEP_TITLES } from '../../../lib/progress';
import { callFunction, supabase } from '../../../lib/supabase';
import type { Application, InterviewAnswer } from '../../../lib/types';
import { colors, layout, radius, space } from '../../../theme';

type Note = { id: string; note: string; created_at: string; profiles: { first_names: string; surname: string } | null };
type Tab = 'answers' | 'form' | 'notes';

async function load(id: string) {
  const { data: app, error } = await supabase.from('applications').select('*').eq('id', id).single();
  if (error) throw error;
  const a = app as Application;
  const [questions, { data: hub }, { data: answers }, { data: notes }] = await Promise.all([
    fetchQuestions(a.id, a.intake_id),
    a.hub_id ? supabase.from('hubs').select('name, city').eq('id', a.hub_id).single() : Promise.resolve({ data: null }),
    supabase.from('interview_answers').select('*').eq('application_id', a.id),
    supabase.from('staff_notes').select('id, note, created_at, profiles(first_names, surname)').eq('application_id', a.id).order('created_at', { ascending: false }),
  ]);
  return {
    app: a,
    hub: hub as { name: string; city: string | null } | null,
    questions,
    answers: (answers ?? []) as InterviewAnswer[],
    notes: (notes ?? []) as unknown as Note[],
  };
}

export default function ApplicantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { data, reload, loading } = useQuery(() => load(id), [id]);
  const [tab, setTab] = useState<Tab>('answers');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!data) return <View style={{ flex: 1 }}><Header onBack={() => router.back()} /></View>;
  const { app, hub, questions, answers, notes } = data;
  const chip = reviewStatusChip[app.review_status];
  const decided = !!app.decision;

  async function update(fields: Partial<Application>, key: string) {
    setBusy(key);
    setError(null);
    const { error: err } = await supabase.from('applications').update(fields).eq('id', app.id);
    setBusy(null);
    if (err) setError('We could not save this. Please try again.');
    reload();
  }

  async function addNote() {
    if (!note.trim() || !profile) return;
    setBusy('note');
    await supabase.from('staff_notes').insert({ application_id: app.id, author_id: profile.id, note: note.trim() });
    setNote('');
    setBusy(null);
    reload();
  }

  async function openFile(path: string | null) {
    if (!path) return;
    const { data: signed } = await supabase.storage.from('application-cvs').createSignedUrl(path, 60 * 10);
    if (signed?.signedUrl) Linking.openURL(signed.signedUrl);
  }

  async function rerun(answerId: string) {
    setBusy(answerId);
    setError(null);
    try {
      await callFunction('process-answer', { answer_id: answerId });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
    reload();
  }

  const decide = (decision: 'accepted' | 'waitlisted' | 'not_accepted') =>
    router.push({ pathname: '/decide/[id]', params: { id: app.id, decision, name: `${app.first_names} ${app.surname}` } });

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen
        refreshing={loading}
        onRefresh={reload}
        footer={
          // The waiting list is not final: staff can still accept or decline from it.
          decided && app.decision !== 'waitlisted' ? null : (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button title="Decline" variant="danger" fullWidth={false} style={{ flex: 1 }} onPress={() => decide('not_accepted')} />
              {!decided ? <Button title="Waitlist" variant="outline" fullWidth={false} style={{ flex: 1 }} onPress={() => decide('waitlisted')} /> : null}
              <Button title="Accept" fullWidth={false} style={{ flex: 1 }} onPress={() => decide('accepted')} />
            </View>
          )
        }
      >
        <View style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
            <Chip label={chip.label} tone={chip.tone} />
            {app.needs_help && app.review_status !== 'needs_help' ? <Chip label="Needs help" tone="danger" /> : null}
          </View>
          <Text variant="h1">{app.first_names} {app.surname}</Text>
          <Text variant="small">
            {app.submitted_at ? `Applied ${formatDate(app.submitted_at)}` : 'Form not sent yet'}
            {app.interview_format ? ` · Answers by ${app.interview_format}` : ''}
            {app.low_data ? ' · Low data mode' : ''}
          </Text>
        </View>

        {!decided ? (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {app.review_status !== 'in_review' ? (
              <Button
                title="Start review"
                variant="outline"
                icon="eye"
                fullWidth={false}
                style={{ flex: 1 }}
                loading={busy === 'review'}
                onPress={() => update({ review_status: 'in_review', reviewer_id: profile?.id } as Partial<Application>, 'review')}
              />
            ) : null}
            <Button
              title={app.needs_help ? 'Help given' : 'Needs help'}
              variant="outline"
              icon={app.needs_help ? 'check' : 'life-buoy'}
              fullWidth={false}
              style={{ flex: 1 }}
              loading={busy === 'help'}
              onPress={() =>
                update(
                  app.needs_help ? { needs_help: false, review_status: 'in_review' } : { needs_help: true, review_status: 'needs_help' },
                  'help',
                )
              }
            />
          </View>
        ) : (
          <Card tone="soft">
            <Text variant="bodySemi">Decision: {reviewStatusChip[app.decision!].label}</Text>
            <Text variant="small">
              Made on {formatDate(app.decided_at)}.{app.place_confirmed_at ? ` Place confirmed on ${formatDate(app.place_confirmed_at)}.` : ''}
            </Text>
          </Card>
        )}

        <Segments value={tab} onChange={setTab} />

        {tab === 'answers' ? (
          questions.length === 0 ? (
            <Text variant="small">{app.submitted_at ? 'The questions have not been written yet.' : 'Questions are written after the application is sent.'}</Text>
          ) : (
            questions.map((q) => {
              const a = answers.find((x) => x.question_id === q.id);
              return (
                <Card key={q.id} large style={{ gap: space.md }}>
                  <Text variant="tiny">QUESTION {q.position}</Text>
                  <Text variant="h3">{q.prompt}</Text>
                  {q.ai_generated ? <AiLabel note={q.based_on ? `written from the CV: ${q.based_on}` : 'written from the CV'} /> : null}
                  {!a ? (
                    <Text variant="small">Not answered yet.</Text>
                  ) : (
                    <>
                      {a.format === 'audio' && a.media_path ? <AudioPlayback path={a.media_path} /> : null}
                      {a.format === 'video' && a.media_path ? <VideoPlayback path={a.media_path} /> : null}
                      {a.media_deleted_at ? <Text variant="small">The recording was deleted after 90 days. The text is below.</Text> : null}

                      <View style={{ gap: space.xs }}>
                        <Text variant="smallSemi">{a.format === 'text' ? 'Answer' : 'What they said (speech to text)'}</Text>
                        <Text>{a.format === 'text' ? a.text_answer : a.transcript ?? 'The text version is not ready yet.'}</Text>
                        {a.format !== 'text' && a.transcript ? <AiLabel note="speech to text, may have small mistakes" /> : null}
                      </View>

                      {a.ai_summary ? (
                        <View style={{ gap: space.sm, backgroundColor: colors.soft, borderRadius: radius.sm, padding: space.md }}>
                          <AiLabel note="summary to help you read, not a score" />
                          <Text variant="small" style={{ color: colors.ink }}>{a.ai_summary.summary}</Text>
                          {a.ai_summary.checklist.map((c, i) => (
                            <View key={i} style={{ gap: 2 }}>
                              <Text variant="smallSemi">{c.item}</Text>
                              <Text variant="small">{c.what_the_answer_says}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Button
                          title={a.state === 'failed' ? 'Try the summary again' : 'Make the summary now'}
                          variant="ghost"
                          icon="refresh-cw"
                          loading={busy === a.id}
                          disabled={a.format !== 'text' && !a.media_path && !a.transcript}
                          onPress={() => rerun(a.id)}
                        />
                      )}
                    </>
                  )}
                </Card>
              );
            })
          )
        ) : null}

        {tab === 'form' ? (
          <>
            <Card style={{ gap: space.md }}>
              <Text variant="h3">{STEP_TITLES[1]}</Text>
              <Row label="Email" value={app.email} />
              <Row label="Phone or WhatsApp" value={app.phone} />
              <Row label="Where they live" value={app.location || 'Not filled in'} />
              <Row label="At the hub every weekday, 9am to 4pm" value={app.available_daily == null ? 'Not answered' : app.available_daily ? 'Yes' : 'No'} />
              <Row label="Will volunteer to teach children" value={app.will_teach_children == null ? 'Not answered' : app.will_teach_children ? 'Yes' : 'No'} />
              <Row label="Hub" value={hub ? `${hub.name}${hub.city ? `, ${hub.city}` : ''}` : 'Not chosen'} />
            </Card>
            <Card style={{ gap: space.md }}>
              <Text variant="h3">{STEP_TITLES[2]}</Text>
              {app.cv_path ? (
                <Button title={`Open CV (${app.cv_name ?? 'file'})`} variant="outline" icon="file-text" onPress={() => openFile(app.cv_path)} />
              ) : app.about_text ? (
                <Row label="No CV. They wrote about themselves:" value={app.about_text} />
              ) : (
                <Text variant="small">No CV uploaded yet.</Text>
              )}
              {app.letter_path ? (
                <Button title={`Open motivation letter (${app.letter_name ?? 'file'})`} variant="outline" icon="mail" onPress={() => openFile(app.letter_path)} />
              ) : (
                <Text variant="small">No motivation letter uploaded.</Text>
              )}
            </Card>
          </>
        ) : null}

        {tab === 'notes' ? (
          <>
            <Input label="Add a note for the team" multiline value={note} onChangeText={setNote} helper="Only staff can see notes." />
            <Button title="Save note" variant="outline" loading={busy === 'note'} disabled={!note.trim()} onPress={addNote} />
            {notes.map((n) => (
              <Card key={n.id}>
                <Text>{n.note}</Text>
                <Text variant="tiny">{n.profiles ? `${n.profiles.first_names} ${n.profiles.surname}` : 'Staff'} · {formatDate(n.created_at)}</Text>
              </Card>
            ))}
          </>
        ) : null}

        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="users" size={16} color={colors.brand} />
          <Text variant="smallSemi" style={{ color: colors.brand }}>{peopleDecide}</Text>
        </View>
      </Screen>
    </View>
  );
}

function Segments({ value, onChange }: { value: Tab; onChange: (t: Tab) => void }) {
  const options: { key: Tab; label: string }[] = [
    { key: 'answers', label: 'Interview' },
    { key: 'form', label: 'Application' },
    { key: 'notes', label: 'Notes' },
  ];
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border }} accessibilityRole="tablist">
      {options.map((o) => {
        const on = value === o.key;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={{ flex: 1, minHeight: layout.tapTarget, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: on ? colors.brand : 'transparent', marginBottom: -1 }}
          >
            <Text variant={on ? 'bodySemi' : 'body'} style={{ color: on ? colors.brand : colors.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="small">{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
