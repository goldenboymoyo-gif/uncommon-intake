import { useCallback, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Chip } from '../../../components/Chip';
import { CoachAvatar } from '../../../components/CoachAvatar';
import { Text } from '../../../components/Text';
import { subjectById } from '../../../lib/coach';
import { EnglishOverview, EnglishStart, SKILL_LABELS, startEnglish } from '../../../lib/english';
import { callFunction } from '../../../lib/supabase';
import { colors, radius, space } from '../../../theme';

const teacher = subjectById('general');

function Bar({ label, score }: { label: string; score: number | null }) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="smallSemi">{label}</Text>
        <Text variant="small">{score === null ? 'Not measured yet' : `${score}%`}</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.soft, overflow: 'hidden' }}>
        <View style={{ width: `${score ?? 0}%`, height: '100%', backgroundColor: colors.brand }} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flexBasis: '30%', flexGrow: 1, backgroundColor: colors.soft, borderRadius: radius.sm, padding: space.sm }}>
      <Text variant="h3">{value}</Text>
      <Text variant="tiny">{label}</Text>
    </View>
  );
}

export default function EnglishTutor() {
  const [data, setData] = useState<EnglishOverview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openModule, setOpenModule] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setError(null);
      callFunction<EnglishOverview>('english-tutor', { action: 'overview' })
        .then(setData)
        .catch((e) => setError((e as Error).message));
    }, []),
  );

  async function start(key: string, input: EnglishStart) {
    setBusy(key);
    setError(null);
    try {
      const id = await startEnglish(input);
      router.push({ pathname: '/english/session/[id]', params: { id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <CoachAvatar subject={teacher} />
          <View style={{ flex: 1 }}>
            <Text variant="h1">English Tutor</Text>
            <Text variant="small">Learn with Teacher Chipo, at your own level.</Text>
          </View>
        </View>
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
        {!data && !error ? <ActivityIndicator color={colors.brand} /> : null}

        {data && !data.level ? (
          <>
            <Card large style={{ gap: space.md }}>
              <Text variant="h2">First, let us find your level</Text>
              <Text variant="small">Chipo will ask 12 short questions. They start easy and change as you answer. Nobody fails this. Your answers set where your lessons begin.</Text>
              <Button
                title={data.active_assessment ? 'Continue your placement' : 'Start my placement'}
                loading={busy === 'assessment'}
                onPress={() => (data.active_assessment ? router.push({ pathname: '/english/session/[id]', params: { id: data.active_assessment } }) : start('assessment', { kind: 'assessment' }))}
              />
            </Card>
          </>
        ) : null}

        {data?.level ? (
          <>
            <Card large style={{ backgroundColor: colors.brand, borderColor: colors.brand, gap: space.sm }}>
              <Text variant="tiny" style={{ color: '#DCE5F7' }}>YOUR LEVEL</Text>
              <Text variant="h1" style={{ color: colors.white }}>{data.level}</Text>
              {data.recommended ? (
                <>
                  <Text style={{ color: '#DCE5F7' }}>Next for you: {data.recommended.title}</Text>
                  <Button title="Start next lesson" variant="outline" loading={busy === 'next'} onPress={() => start('next', { kind: 'lesson', lesson_id: data.recommended!.id })} />
                </>
              ) : null}
            </Card>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              <Stat label="Day streak" value={data.streak} />
              <Stat label="Points" value={data.points} />
              <Stat label="Lessons passed" value={data.lessons_passed} />
              <Stat label="Minutes learning" value={data.learning_minutes} />
              <Stat label="Words learned" value={data.words} />
              <Stat label="Spoken answers" value={data.speaking_answers} />
            </View>

            <View style={{ gap: space.sm }}>
              <Text variant="h2">Today</Text>
              {data.daily.map((d) => (
                <Card key={d.id} onPress={d.done || busy ? undefined : () => start(d.id, { kind: 'daily', activity: d.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <Feather name={d.done ? 'check-circle' : 'circle'} size={20} color={d.done ? colors.success : colors.muted} />
                  <Text variant="bodySemi" style={{ flex: 1 }}>{d.title}</Text>
                  {busy === d.id ? <ActivityIndicator color={colors.brand} /> : null}
                </Card>
              ))}
            </View>

            {data.plan ? (
              <Card large style={{ gap: space.sm }}>
                <Text variant="h2">Your plan</Text>
                {data.plan.objectives.map((o) => <Text key={o} variant="small" style={{ color: colors.ink }}>• {o}</Text>)}
                <Text variant="small">{data.plan.daily} {data.plan.weekly}</Text>
                <Text variant="small">Target: {data.plan.target}</Text>
              </Card>
            ) : null}

            <View style={{ gap: space.sm }}>
              <Text variant="h2">Your skills</Text>
              {Object.entries(SKILL_LABELS).map(([skill, label]) => <Bar key={skill} label={label} score={data.skills[skill]?.score ?? null} />)}
              <Text variant="small">Based on your marked answers. A skill shows after 3 answers.</Text>
              {data.writing_scores.recent !== null && data.writing_scores.first !== null ? (
                <Text variant="small">Writing: your first answers scored {data.writing_scores.first}%, and your latest scored {data.writing_scores.recent}%.</Text>
              ) : null}
            </View>

            {data.mistakes.length ? (
              <Card tone="soft" style={{ gap: space.xs }}>
                <Text variant="bodySemi">Chipo is helping you with</Text>
                {data.mistakes.map((m) => <Text key={m.pattern} variant="small">• {m.pattern}</Text>)}
              </Card>
            ) : null}

            <View style={{ gap: space.sm }}>
              <Text variant="h2">Tests</Text>
              <Button title={data.can_weekly ? 'Take the weekly test' : 'Weekly test done for this week'} variant="outline" disabled={!data.can_weekly} loading={busy === 'weekly'} onPress={() => start('weekly', { kind: 'weekly' })} />
              {data.level_test.next ? (
                <>
                  <Button title={`Level test for ${data.level_test.next}`} variant="outline" disabled={!data.level_test.ready} loading={busy === 'level_test'} onPress={() => start('level_test', { kind: 'level_test' })} />
                  {!data.level_test.ready ? (
                    <Text variant="small">{data.level_test.lessons_needed ? `Pass ${data.level_test.lessons_needed} more lessons at ${data.level} to open this test.` : 'You can try this test again soon. Practise your lessons first.'}</Text>
                  ) : null}
                </>
              ) : null}
              <Button title="See my results and answers" variant="ghost" onPress={() => router.push('/english/results')} />
            </View>

            <View style={{ gap: space.sm }}>
              <Text variant="h2">All lessons</Text>
              {data.modules.map((m) => {
                const open = openModule === m.id;
                return (
                  <View key={m.id} style={{ gap: space.sm }}>
                    <Card onPress={() => setOpenModule(open ? null : m.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodySemi">{m.title}</Text>
                        <Text variant="small">{m.lessons.filter((l) => l.passed).length} of {m.lessons.length} passed at {data.level}</Text>
                      </View>
                      <Feather name={open ? 'minus' : 'plus'} size={20} color={colors.muted} />
                    </Card>
                    {open
                      ? m.lessons.map((l) => (
                          <Card key={l.id} tone="soft" onPress={busy ? undefined : () => start(l.id, { kind: 'lesson', lesson_id: l.id })} style={{ gap: 2 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm }}>
                              <Text variant="bodySemi" style={{ flex: 1 }}>{l.title}</Text>
                              {busy === l.id ? <ActivityIndicator color={colors.brand} /> : l.passed ? <Chip label="Passed" tone="success" /> : null}
                            </View>
                            <Text variant="small">{l.objective}</Text>
                          </Card>
                        ))
                      : null}
                  </View>
                );
              })}
            </View>

            <View style={{ gap: space.sm }}>
              <Text variant="h2">Milestones</Text>
              {data.achievements.map((a) => (
                <View key={a.title} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Feather name="award" size={18} color={a.earned ? colors.accentOrange : colors.border} />
                  <Text variant="small" style={{ color: a.earned ? colors.ink : colors.muted }}>{a.title}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </Screen>
    </View>
  );
}
