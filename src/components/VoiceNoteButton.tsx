import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { colors } from '../theme';

const MAX_MILLIS = 2 * 60 * 1000;

// Tap to record, tap again to send. Used in the coach chat.
export function VoiceNoteButton({ disabled, onRecorded, onError }: { disabled?: boolean; onRecorded: (uri: string) => void; onError: (message: string) => void }) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, numberOfChannels: 1, sampleRate: 22050, bitRate: 48000 });
  const state = useAudioRecorderState(recorder, 250);

  async function start() {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return onError('Please allow the microphone to send a voice note, or type your answer.');
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      onError('We could not start the microphone. Please type your answer.');
    }
  }

  async function stop() {
    await recorder.stop();
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    if (recorder.uri) onRecorded(recorder.uri);
  }

  useEffect(() => {
    if (state.isRecording && (state.durationMillis ?? 0) >= MAX_MILLIS) stop();
  }, [state.isRecording, state.durationMillis]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={state.isRecording ? 'Stop and send voice note' : 'Record a voice note'}
      disabled={disabled}
      onPress={state.isRecording ? stop : start}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: state.isRecording ? colors.danger : disabled ? colors.muted : colors.brand, alignItems: 'center', justifyContent: 'center' }}
    >
      <Feather name={state.isRecording ? 'square' : 'mic'} size={20} color={colors.white} />
    </Pressable>
  );
}
