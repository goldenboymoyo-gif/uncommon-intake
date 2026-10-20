import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { formatTime, MAX_VIDEO_SECONDS } from '../lib/interview';
import { colors, radius, space } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

export type VideoResult = { uri: string; durationSeconds: number };

// Short video answers. Small files: 480p on Android, 4:3 (640x480) on iOS.
export function VideoRecorder({ onDone }: { onDone: (r: VideoResult | null) => void }) {
  const camera = useRef<CameraView>(null);
  const [cam, requestCam] = useCameraPermissions();
  const [mic, requestMic] = useMicrophonePermissions();
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<VideoResult | null>(null);
  const player = useVideoPlayer(result?.uri ?? null);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  if (!cam || !mic) return null;
  if (!cam.granted || !mic.granted) {
    return (
      <View style={{ gap: space.md }}>
        <Text variant="small">We need your camera and microphone to record a video answer.</Text>
        <Button
          title="Allow camera and microphone"
          onPress={async () => {
            await requestCam();
            await requestMic();
          }}
        />
      </View>
    );
  }

  async function start() {
    if (!camera.current) return;
    setResult(null);
    onDone(null);
    setSeconds(0);
    setRecording(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const started = Date.now();
    const video = await camera.current.recordAsync({ maxDuration: MAX_VIDEO_SECONDS, maxFileSize: 40 * 1024 * 1024 });
    setRecording(false);
    if (video?.uri) {
      const r = { uri: video.uri, durationSeconds: Math.round((Date.now() - started) / 1000) };
      setResult(r);
      onDone(r);
    }
  }

  return (
    <View style={{ gap: space.md, alignItems: 'center' }}>
      <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ink }}>
        {result && !recording ? (
          <VideoView player={player} style={{ flex: 1 }} nativeControls contentFit="cover" />
        ) : (
          <CameraView
            ref={camera}
            style={{ flex: 1 }}
            mode="video"
            facing="front"
            videoQuality={Platform.OS === 'android' ? '480p' : '4:3'}
            onCameraReady={() => setReady(true)}
          />
        )}
        {recording ? (
          <View style={{ position: 'absolute', top: space.md, left: space.md, flexDirection: 'row', alignItems: 'center', gap: space.xs, backgroundColor: 'rgba(2,8,23,0.6)', paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radius.pill }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
            <Text variant="smallSemi" style={{ color: colors.white }}>{formatTime(seconds)} / {formatTime(MAX_VIDEO_SECONDS)}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Stop recording' : result ? 'Record again' : 'Start recording'}
        disabled={!ready && !result}
        onPress={() => {
          if (recording) return camera.current?.stopRecording();
          if (result) {
            setResult(null);
            onDone(null);
            return;
          }
          start();
        }}
        style={({ pressed }) => ({
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: recording ? colors.danger : pressed ? colors.brandDark : colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: !ready && !result ? 0.5 : 1,
        })}
      >
        <Feather name={recording ? 'square' : result ? 'rotate-ccw' : 'video'} size={28} color={colors.white} />
      </Pressable>
      <Text variant="small">{recording ? 'Tap to stop' : result ? 'Watch it back, or tap to record again' : 'Tap to start recording'}</Text>
    </View>
  );
}
