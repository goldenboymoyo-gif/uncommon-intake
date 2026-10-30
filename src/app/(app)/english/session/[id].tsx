import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { CoachAvatar } from '../../../../components/CoachAvatar';
import { Header } from '../../../../components/Header';
import { Text } from '../../../../components/Text';
import { VoiceNoteButton } from '../../../../components/VoiceNoteButton';
import { useAuth } from '../../../../lib/auth';
import { subjectById } from '../../../../lib/coach';
import { readBytes, recordingInfo } from '../../../../lib/files';
import { callFunction, supabase } from '../../../../lib/supabase';
import { colors, fonts, radius, space } from '../../../../theme';

type Message = { id: string; sender: 'teacher' | 'student'; body: string; speak_text?: string | null; from_voice?: boolean };
type Session = { id: string; kind: string; lesson_id: string | null; title: string; status: string; score: number | null; passed: boolean | null };
type Outcome = { score: number; passed: boolean; kind: string; level?: string };

const teacher = subjectById('general');
const MIN_THINKING_MS = 2500;
const SLOW = 0.7;

function outcomeText(o: Outcome) {
  if (o.kind === 'assessment') return `Your placement is finished. Your starting level is ${o.level}, and your plan is ready.`;
  if (o.kind === 'level_test') return o.passed ? `You passed with ${o.score}%. You are now at level ${o.level}.` : `You scored ${o.score}%, and this test needs 75%. Keep practising and try again soon.`;
  if (o.kind === 'weekly') return `You scored ${o.score}% this week. You can review your answers in your results.`;
  return o.passed ? `Well done. You scored ${o.score}% and passed.` : `You scored ${o.score}%. Let us go over this one again.`;
}

export default function EnglishSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const player = useAudioPlayer(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [progress, setProgress] = useState<{ marked: number; target: number } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: rows }] = await Promise.all([
        supabase.from('english_sessions').select('id, kind, lesson_id, title, status, score, passed').eq('id', id).single(),
        supabase.from('english_messages').select('id, sender, body, speak_text, from_voice').eq('session_id', id).order('created_at'),
      ]);
      setSession(s as Session | null);
      setMessages((rows ?? []) as Message[]);
    })();
  }, [id]);

  const finished = !!outcome || session?.status === 'completed';

  async function send(payload: Record<string, unknown>, shown: string) {
    setBusy(true);
    setError(null);
    const tempId = `temp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, sender: 'student', body: shown }]);
    try {
      const [res] = await Promise.all([
        callFunction<{ messages: Message[]; outcome: Outcome | null; progress: { marked: number; target: number } }>('english-tutor', { session_id: id, ...payload }),
        new Promise((resolve) => setTimeout(resolve, MIN_THINKING_MS)),
      ]);
      setMessages((m) => [...m.filter((x) => x.id !== tempId), ...res.messages]);
      setProgress(res.progress);
      if (res.outcome) setOutcome(res.outcome);
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setError((e as Error).message);
      if (payload.text) setDraft(String(payload.text));
    } finally {
      setBusy(false);
    }
  }

  function sendText() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    send({ text }, text);
  }

  async function listen(message: Message, rate: number) {
    setSpeaking(message.id);
    setError(null);
    try {
      const { url } = await callFunction<{ url: string }>('english-tutor', { action: 'speak', message_id: message.id });
      player.replace({ uri: url });
      player.setPlaybackRate(rate);
      player.play();
    } catch {
      setError('The sound is not available right now. You can read the message instead.');
    } finally {
      setSpeaking(null);
    }
  }

  async function repeat() {
    if (!session?.lesson_id) return;
    setBusy(true);
    try {
      const { id: next } = await callFunction<{ id: string }>('english-tutor', {
        action: 'start',
        kind: session.kind,
        lesson_id: session.lesson_id,
        activity: session.lesson_id,
      });
      router.replace({ pathname: '/english/session/[id]', params: { id: next } });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.soft }}>
      <Header onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border }}>
          <CoachAvatar subject={teacher} size={44} />
          <View style={{ flex: 1 }}>
            <Text variant="bodySemi">Teacher Chipo</Text>
            <Text variant="small" numberOfLines={1}>{session?.title}</Text>
          </View>
          {progress && !finished ? <Text variant="tiny">{progress.marked} marked</Text> : null}
        </View>

        <ScrollView
          ref={scroller}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: space.md, gap: space.sm }}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m) => {
            const mine = m.sender === 'student';
            return (
              <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '84%', gap: 4 }}>
                <View style={{ backgroundColor: mine ? colors.brand : colors.white, borderRadius: radius.lg, borderBottomRightRadius: mine ? 4 : radius.lg, borderBottomLeftRadius: mine ? radius.lg : 4, paddingHorizontal: space.md, paddingVertical: space.sm }}>
                  <Text style={{ color: mine ? colors.white : colors.ink }}>{m.body}</Text>
                  {m.from_voice ? <Text variant="tiny" style={{ color: '#DCE5F7', marginTop: 2 }}>Voice note, the words we heard</Text> : null}
                </View>
                {!mine && !m.id.startsWith('temp') ? (
                  <View style={{ flexDirection: 'row', gap: space.md }}>
                    <Pressable accessibilityRole="button" onPress={() => listen(m, 1)} disabled={!!speaking} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 }}>
                      <Feather name="volume-2" size={14} color={colors.brand} />
                      <Text variant="tiny" style={{ color: colors.brand }}>{speaking === m.id ? 'Getting the sound' : m.speak_text ? 'Listen to this' : 'Listen'}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => listen(m, SLOW)} disabled={!!speaking} style={{ paddingVertical: 2 }}>
                      <Text variant="tiny" style={{ color: colors.brand }}>Slowly</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
          {busy ? <Text variant="small">Chipo is thinking</Text> : null}
          {outcome ? (
            <Card large style={{ gap: space.md }}>
              <Text variant="h3">{outcomeText(outcome)}</Text>
              {!outcome.passed && session?.lesson_id ? <Button title="Try this again" loading={busy} onPress={repeat} /> : null}
              <Button title="Back to English Tutor" variant={outcome.passed ? 'primary' : 'outline'} onPress={() => router.back()} />
            </Card>
          ) : null}
        </ScrollView>

        {error ? <Text variant="small" style={{ color: colors.danger, paddingHorizontal: space.md, paddingBottom: space.xs }}>{error}</Text> : null}

        {finished ? null : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.sm, paddingBottom: insets.bottom + space.sm, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.border }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Type your answer, or use the microphone"
              placeholderTextColor={colors.muted}
              multiline
              style={{ flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: colors.soft, borderRadius: radius.lg, paddingHorizontal: space.md, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: colors.ink }}
            />
            {draft.trim() ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Send" disabled={busy} onPress={sendText} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: busy ? colors.muted : colors.brand, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="send" size={20} color={colors.white} />
              </Pressable>
            ) : (
              <VoiceNoteButton
                disabled={busy}
                onError={setError}
                onRecorded={async (uri) => {
                  if (!profile) return;
                  const { ext, mime } = await recordingInfo(uri, 'audio');
                  setBusy(true);
                  const path = `${profile.id}/voice-${Date.now()}.${ext}`;
                  const { error: upErr } = await supabase.storage.from('coach-files').upload(path, await readBytes(uri), { contentType: mime });
                  if (upErr) {
                    setBusy(false);
                    return setError('Your voice note did not upload. Please try again.');
                  }
                  await send({ audio_path: path }, 'Voice note');
                }}
              />
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
