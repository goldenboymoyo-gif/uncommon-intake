import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { formatTime, MAX_VIDEO_SECONDS } from '../lib/interview';
import { colors, radius, space } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

export type VideoResult = { uri: string; durationSeconds: number };

// iPhones record mp4 and most other browsers can too. Older Chrome falls back to webm.
const FORMATS = ['video/mp4', 'video/webm;codecs=vp8,opus', 'video/webm'];

// Website version of the video answer. Keeps files small: 480p, about 5 MB a minute.
export function VideoRecorder({ onDone }: { onDone: (r: VideoResult | null) => void }) {
  const preview = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [needsPermission, setNeedsPermission] = useState(true);
  const [problem, setProblem] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<VideoResult | null>(null);

  const stopCamera = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };

  useEffect(() => stopCamera, []);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= MAX_VIDEO_SECONDS) recorder.current?.stop();
  }, [seconds, recording]);

  // Shows the camera, or the recorded answer once there is one.
  useEffect(() => {
    const video = preview.current;
    if (!video) return;
    if (result) {
      video.srcObject = null;
      video.src = result.uri;
    } else if (stream.current) {
      video.src = '';
      video.srcObject = stream.current;
      video.play().catch(() => undefined);
    }
  }, [result, needsPermission]);

  async function openCamera() {
    setProblem(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      return setProblem('This browser cannot record video. Please open this page in Safari or Chrome.');
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      setNeedsPermission(false);
    } catch {
      setProblem('We could not open your camera. Please allow the camera and microphone in your browser, then try again.');
    }
  }

  function start() {
    if (!stream.current) return;
    setResult(null);
    onDone(null);
    setSeconds(0);
    const mimeType = FORMATS.find((f) => MediaRecorder.isTypeSupported(f));
    const chunks: Blob[] = [];
    const started = Date.now();
    const rec = new MediaRecorder(stream.current, { mimeType, videoBitsPerSecond: 600000, audioBitsPerSecond: 64000 });
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onstop = () => {
      setRecording(false);
      const r = { uri: URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })), durationSeconds: Math.round((Date.now() - started) / 1000) };
      setResult(r);
      onDone(r);
    };
    recorder.current = rec;
    rec.start(1000);
    setRecording(true);
  }

  if (needsPermission) {
    return (
      <View style={{ gap: space.md }}>
        <Text variant="small">We need your camera and microphone to record a video answer. Keep this page open while you record.</Text>
        <Button title="Allow camera and microphone" onPress={openCamera} />
        {problem ? <Text variant="small" style={{ color: colors.danger }}>{problem}</Text> : null}
      </View>
    );
  }

  return (
    <View style={{ gap: space.md, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 420, aspectRatio: 3 / 4, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ink }}>
        <video
          ref={preview}
          autoPlay={!result}
          playsInline
          muted={!result}
          controls={!!result}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: result ? undefined : 'scaleX(-1)' }}
        />
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
        onPress={() => {
          if (recording) return recorder.current?.stop();
          if (result) {
            setResult(null);
            onDone(null);
            return;
          }
          start();
        }}
        style={({ pressed }) => ({ width: 72, height: 72, borderRadius: 36, backgroundColor: recording ? colors.danger : pressed ? colors.brandDark : colors.brand, alignItems: 'center', justifyContent: 'center' })}
      >
        <Feather name={recording ? 'square' : result ? 'rotate-ccw' : 'video'} size={28} color={colors.white} />
      </Pressable>
      <Text variant="small">{recording ? 'Tap to stop. Keep this page open.' : result ? 'Watch it back, or tap to record again' : 'Tap to start recording'}</Text>
    </View>
  );
}
