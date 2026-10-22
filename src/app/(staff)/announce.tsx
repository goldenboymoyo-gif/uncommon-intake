import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { callFunction } from '../../lib/supabase';
import { colors, space } from '../../theme';

// Staff send a short message to every student. It appears in Notifications and as a phone pop-up.
export default function Announce() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const { sent } = await callFunction<{ sent: number }>('notify-students', { kind: 'general', title, body });
      setResult(sent ? `Sent to ${sent} ${sent === 1 ? 'student' : 'students'}.` : 'There are no students yet.');
      setTitle('');
      setBody('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="Send to all students" haptic loading={busy} disabled={!title.trim() || !body.trim()} onPress={send} />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Message all students</Text>
          <Text variant="small">Students see it in Notifications and as a pop-up on their phone.</Text>
        </View>
        <Input label="Title" value={title} onChangeText={setTitle} maxLength={80} />
        <Input label="Message" multiline value={body} onChangeText={setBody} maxLength={300} helper={`${body.length} / 300`} />
        {result ? <Text variant="smallSemi" style={{ color: colors.success }}>{result}</Text> : null}
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
