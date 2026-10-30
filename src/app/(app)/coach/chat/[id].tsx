import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Feather from '@expo/vector-icons/Feather';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CoachAvatar } from '../../../../components/CoachAvatar';
import { ConfirmDelete } from '../../../../components/ConfirmDelete';
import { Header } from '../../../../components/Header';
import { Text } from '../../../../components/Text';
import { VoiceNoteButton } from '../../../../components/VoiceNoteButton';
import { useAuth } from '../../../../lib/auth';
import { CoachTopic, subjectById } from '../../../../lib/coach';
import { readBytes, recordingInfo } from '../../../../lib/files';
import { callFunction, supabase } from '../../../../lib/supabase';
import { colors, fonts, radius, space } from '../../../../theme';

type Message = { id: string; sender: 'coach' | 'student'; body: string; from_voice?: boolean };
type Chat = { id: string; topic: CoachTopic; subject_id: string; subject: string };

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_THINKING_MS = 2500;
const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export default function CoachChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [speaking, setSpeaking] = useState<string | null>(null);
  const player = useAudioPlayer(null);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: rows }] = await Promise.all([
        supabase.from('coach_chats').select('id, topic, subject_id, subject').eq('id', id).single(),
        supabase.from('coach_messages').select('id, sender, body, from_voice').eq('chat_id', id).order('created_at'),
      ]);
      setChat(c as Chat | null);
      setMessages((rows ?? []) as Message[]);
    })();
  }, [id]);

  const subject = chat ? subjectById(chat.subject_id) : null;
  const canAttach = chat?.topic === 'cv' || chat?.topic === 'cover_letter';

  async function send(payload: Record<string, unknown>, shown: string) {
    setBusy(true);
    setError(null);
    const tempId = `temp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, sender: 'student', body: shown }]);
    try {
      const [res] = await Promise.all([
        callFunction<{ messages: Message[] }>('coach-chat', { chat_id: id, ...payload }),
        new Promise((resolve) => setTimeout(resolve, MIN_THINKING_MS)),
      ]);
      setMessages((m) => [...m.filter((x) => x.id !== tempId), ...res.messages]);
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

  async function sendFile() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ type: Object.values(TYPES), copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0] || !profile) return;
    const asset = result.assets[0];
    const ext = asset.name.split('.').pop()?.toLowerCase() ?? '';
    if (!TYPES[ext]) return setError('Please choose a PDF or .docx file.');
    if ((asset.size ?? 0) > MAX_BYTES) return setError('This file is bigger than 5MB.');
    setBusy(true);
    const path = `${profile.id}/coach/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('coach-files').upload(path, await readBytes(asset.uri), { contentType: TYPES[ext] });
    if (upErr) {
      setBusy(false);
      return setError('Upload did not work. Please try again.');
    }
    await send({ file_path: path, file_name: asset.name }, `I sent my file: ${asset.name}`);
  }

  async function listen(message: Message) {
    setSpeaking(message.id);
    setError(null);
    try {
      const { url } = await callFunction<{ url: string }>('coach-chat', { action: 'speak', text: message.body });
      player.replace({ uri: url });
      player.play();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSpeaking(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.soft }}>
      <Header onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {subject ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.border }}>
            <CoachAvatar subject={subject} size={44} />
            <View style={{ flex: 1 }}>
              <Text variant="bodySemi">Coach {subject.coach}</Text>
              <Text variant="small" numberOfLines={1}>{chat?.subject}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Delete this chat" hitSlop={10} onPress={() => setConfirming((c) => !c)}>
              <Feather name="trash-2" size={20} color={colors.muted} />
            </Pressable>
          </View>
        ) : null}
        {confirming ? (
          <View style={{ padding: space.md, backgroundColor: colors.white }}>
            <ConfirmDelete
              label="Delete this chat"
              warning="This removes the whole chat. It cannot be undone."
              onConfirm={async () => {
                const { error: err } = await supabase.from('coach_chats').delete().eq('id', id);
                if (err) throw new Error('We could not delete the chat. Please try again.');
                router.back();
              }}
            />
          </View>
        ) : null}

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
                  {m.from_voice ? <Text variant="tiny" style={{ color: mine ? '#DCE5F7' : colors.muted, marginTop: 2 }}>Voice note, the words we heard</Text> : null}
                </View>
                {!mine && chat?.topic === 'english' ? (
                  <Pressable accessibilityRole="button" onPress={() => listen(m)} disabled={!!speaking} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2 }}>
                    <Feather name="volume-2" size={14} color={colors.brand} />
                    <Text variant="tiny" style={{ color: colors.brand }}>{speaking === m.id ? 'Getting the sound' : 'Listen'}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
          {busy && subject ? <Text variant="small">Coach {subject.coach} is typing</Text> : null}
        </ScrollView>

        {error ? <Text variant="small" style={{ color: colors.danger, paddingHorizontal: space.md, paddingBottom: space.xs }}>{error}</Text> : null}

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, paddingHorizontal: space.sm, paddingTop: space.sm, paddingBottom: insets.bottom + space.sm, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.border }}>
          {canAttach ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Upload a file" disabled={busy} onPress={sendFile} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="paperclip" size={22} color={colors.muted} />
            </Pressable>
          ) : null}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type your message"
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
      </KeyboardAvoidingView>
    </View>
  );
}
