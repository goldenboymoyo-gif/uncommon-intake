import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  AudioModule,
  RecordingOptions,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { formatTime, MAX_AUDIO_SECONDS } from '../lib/interview';
import { colors, radius, space } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

// Speech only needs mono. Low data mode makes files about half the size.
const preset = (lowData: boolean): RecordingOptions => ({
  ...RecordingPresets.HIGH_QUALITY,
  isMeteringEnabled: true,
  numberOfChannels: 1,
  sampleRate: lowData ? 16000 : 22050,
  bitRate: lowData ? 32000 : 64000,
});

const BARS = 40;

export type AudioResult = { uri: string; durationSeconds: number };

export function AudioRecorder({ lowData, onDone }: { lowData: boolean; onDone: (r: AudioResult | null) => void }) {
  const recorder = useAudioRecorder(preset(lowData));
  const state = useAudioRecorderState(recorder, 100);
  const [levels, setLevels] = useState<number[]>([]);
  const [result, setResult] = useState<AudioResult | null>(null);
  const [denied, setDenied] = useState(false);
  const player = useAudioPlayer(result?.uri ?? null);
  const playback = useAudioPlayerStatus(player);
  const seconds = Math.floor((state.durationMillis ?? 0) / 1000);

  useEffect(() => {
    (async () => {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      setDenied(!perm.granted);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })();
  }, []);

  // Metering is in decibels (about -60 quiet to 0 loud). Turn it into bar heights.
  useEffect(() => {
    if (state.isRecording && state.metering !== undefined) {
      const level = Math.max(0, Math.min(1, (state.metering + 60) / 60));
      setLevels((prev) => [...prev.slice(-(BARS - 1)), level]);
    }
  }, [state.metering, state.isRecording]);

  useEffect(() => {
    if (state.isRecording && seconds >= MAX_AUDIO_SECONDS) stop();
  }, [seconds, state.isRecording]);

  async function start() {
    setResult(null);
    onDone(null);
    setLevels([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stop() {
    const duration = Math.round((state.durationMillis ?? 0) / 1000);
    await recorder.stop();
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (recorder.uri) {
      const r = { uri: recorder.uri, durationSeconds: duration };
      setResult(r);
      onDone(r);
    }
  }

  if (denied) {
    return (
      <Text variant="small" style={{ color: colors.danger }}>
        We need the microphone to record your answer. Please allow it in your phone settings, or answer by text.
      </Text>
    );
  }

  const recording = state.isRecording;
  return (
    <View style={{ gap: space.lg, alignItems: 'center' }}>
      <View
        accessibilityLabel={recording ? 'Recording' : 'Sound level'}
        style={{ height: 64, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: colors.soft, borderRadius: radius.lg, paddingHorizontal: space.md }}
      >
        {Array.from({ length: BARS }, (_, i) => {
          const level = levels[i - (BARS - levels.length)] ?? 0;
          return <View key={i} style={{ width: 3, borderRadius: 2, height: 4 + level * 44, backgroundColor: recording ? colors.brand : colors.border }} />;
        })}
      </View>

      <Text variant="h2" accessibilityLabel={`Time ${formatTime(recording ? seconds : result?.durationSeconds ?? 0)}`}>
        {formatTime(recording ? seconds : result?.durationSeconds ?? 0)}
        <Text variant="small"> / {formatTime(MAX_AUDIO_SECONDS)}</Text>
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Stop recording' : result ? 'Record again' : 'Start recording'}
        onPress={recording ? stop : start}
        style={({ pressed }) => ({
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: recording ? colors.danger : pressed ? colors.brandDark : colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Feather name={recording ? 'square' : 'mic'} size={30} color={colors.white} />
      </Pressable>
      <Text variant="small">{recording ? 'Tap to stop' : result ? 'Tap to record again' : 'Tap to start recording'}</Text>

      {result && !recording ? (
        <Button
          title={playback.playing ? 'Pause' : 'Listen back'}
          variant="outline"
          icon={playback.playing ? 'pause' : 'play'}
          onPress={() => {
            if (playback.playing) return player.pause();
            if (playback.didJustFinish || playback.currentTime >= playback.duration) player.seekTo(0);
            player.play();
          }}
        />
      ) : null}
    </View>
  );
}
