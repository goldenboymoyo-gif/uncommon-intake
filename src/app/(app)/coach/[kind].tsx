import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { CoachAvatar } from '../../../components/CoachAvatar';
import { Input } from '../../../components/Input';
import { Text } from '../../../components/Text';
import { CoachSubject, coachTopics, CoachTopic, subjectsFor } from '../../../lib/coach';
import { callFunction } from '../../../lib/supabase';
import { colors, space } from '../../../theme';

// Pick the career or lesson. That picks the coach, and the chat opens with the coach's first question.
export default function CoachPick() {
  const kind = useLocalSearchParams<{ kind: CoachTopic }>().kind;
  const topic: CoachTopic = kind in coachTopics ? kind : 'cv';
  const tool = coachTopics[topic];
  const [starting, setStarting] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function start(subject: CoachSubject) {
    setStarting(subject.id);
    setError(null);
    try {
      const chat = await callFunction<{ id: string }>('coach-chat', { action: 'start', topic, subject_id: subject.id, subject: custom.trim() });
      router.replace({ pathname: '/coach/chat/[id]', params: { id: chat.id } });
    } catch (e) {
      setError((e as Error).message);
      setStarting(null);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">{tool.title}</Text>
          <Text variant="small">{tool.pick}</Text>
        </View>

        {subjectsFor(topic).map((subject) => (
          <Card
            key={subject.id}
            onPress={starting ? undefined : () => (subject.id === 'other' ? setTyping(true) : start(subject))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}
          >
            <CoachAvatar subject={subject} />
            <View style={{ flex: 1 }}>
              <Text variant="bodySemi">{subject.label}</Text>
              <Text variant="small">With Coach {subject.coach}</Text>
            </View>
            {starting === subject.id ? <ActivityIndicator color={colors.brand} /> : null}
          </Card>
        ))}

        {typing ? (
          <View style={{ gap: space.md }}>
            <Input label="Type the tech career" value={custom} onChangeText={setCustom} helper="For example: data analyst, IT support or cyber security." />
            <Button
              title="Start chat"
              loading={starting === 'other'}
              disabled={custom.trim().length < 3}
              onPress={() => {
                const other = subjectsFor(topic).find((s) => s.id === 'other');
                if (other) start(other);
              }}
            />
          </View>
        ) : null}

        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
