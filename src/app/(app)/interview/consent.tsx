import { useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import NetInfo from '@react-native-community/netinfo';
import { Header } from '../../../components/Header';
import { Screen } from '../../../components/Screen';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Text } from '../../../components/Text';
import { useAuth } from '../../../lib/auth';
import { fetchInterview, InterviewData } from '../../../lib/interview';
import { supabase } from '../../../lib/supabase';
import type { AnswerFormat } from '../../../lib/types';
import { colors, layout, radius, space } from '../../../theme';

const info: { icon: keyof typeof Feather.glyphMap; title: string; body: string }[] = [
  { icon: 'help-circle', title: 'Why we record', body: 'Your answers help our team get to know you. Speaking or typing, whatever is easiest for you.' },
  { icon: 'lock', title: 'Who sees it', body: 'Only the Uncommon staff who review applications. Your files are private.' },
  { icon: 'trash-2', title: 'How long we keep it', body: 'Audio and video are kept for about 90 days, then deleted automatically. The written text stays with your application.' },
  { icon: 'cpu', title: 'What the AI does', body: 'AI turns speech into text and writes a short summary for staff. It does not judge your face, voice or feelings. People decide, not the AI.' },
];

const formats: { value: AnswerFormat; icon: keyof typeof Feather.glyphMap; title: string; body: string }[] = [
  { value: 'text', icon: 'type', title: 'Text', body: 'Type your answers.' },
  { value: 'audio', icon: 'mic', title: 'Audio', body: 'Record your voice. Up to 3 minutes each.' },
  { value: 'video', icon: 'video', title: 'Short video', body: 'Record a short video. Up to 90 seconds each.' },
];

export default function Consent() {
  const { profile } = useAuth();
  const [data, setData] = useState<InterviewData | null>(null);
  const [format, setFormat] = useState<AnswerFormat | null>(null);
  const [lowData, setLowData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    fetchInterview(profile.id).then((d) => {
      setData(d);
      if (d?.app.interview_format) setFormat(d.app.interview_format);
      if (d?.app.low_data) setLowData(true);
    });
    // Suggest low data mode on mobile data.
    NetInfo.fetch().then((s) => {
      if (s.type === 'cellular' || s.details?.isConnectionExpensive) setLowData(true);
    });
  }, [profile?.id]);

  useEffect(() => {
    if (lowData && format === 'video') setFormat(null);
  }, [lowData, format]);

  async function agree() {
    if (!data || !format) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase
      .from('applications')
      .update({ interview_format: format, low_data: lowData, recording_consent_at: new Date().toISOString() })
      .eq('id', data.app.id);
    setBusy(false);
    if (err) return setError('We could not save this. Check your connection and try again.');
    router.replace('/interview');
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title="I agree, continue" haptic loading={busy} disabled={!format} onPress={agree} />}>
        <View style={{ gap: space.xs }}>
          <Text variant="h1">Before your interview</Text>
          <Text variant="small">You will answer 5 short questions, one at a time. You can stop and finish later.</Text>
        </View>

        <Card large tone="soft" style={{ gap: space.lg }}>
          {info.map((i) => (
            <View key={i.title} style={{ flexDirection: 'row', gap: space.md }}>
              <Feather name={i.icon} size={20} color={colors.accentBlue} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodySemi">{i.title}</Text>
                <Text variant="small">{i.body}</Text>
              </View>
            </View>
          ))}
        </Card>

        <View style={{ gap: space.md }}>
          <Text variant="h2">How do you want to answer?</Text>
          {formats.map((f) => {
            const disabled = f.value === 'video' && lowData;
            const on = format === f.value;
            return (
              <Pressable
                key={f.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, disabled }}
                disabled={disabled}
                onPress={() => setFormat(f.value)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.sm, borderWidth: on ? 2 : 1, borderColor: on ? colors.brand : colors.border, opacity: disabled ? 0.5 : 1, minHeight: layout.tapTarget }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={f.icon} size={20} color={on ? colors.brand : colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodySemi">{f.title}</Text>
                  <Text variant="small">{disabled ? 'Not available in low data mode.' : f.body}</Text>
                </View>
                {on ? <Feather name="check-circle" size={22} color={colors.brand} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodySemi">Low data mode</Text>
            <Text variant="small">Smaller audio files and no video. Good for mobile data.</Text>
          </View>
          <Switch
            value={lowData}
            onValueChange={setLowData}
            trackColor={{ true: colors.brand, false: colors.border }}
            thumbColor={colors.white}
            accessibilityLabel="Low data mode"
          />
        </Card>

        <View style={{ gap: space.sm }}>
          <Text variant="h3">Tips</Text>
          <Text variant="small">• Find a quiet place.</Text>
          <Text variant="small">• Your answers are saved on your phone first, and sent when your network is good.</Text>
          <Text variant="small">• There are no trick questions. Just be yourself.</Text>
        </View>
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      </Screen>
    </View>
  );
}
