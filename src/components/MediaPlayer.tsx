import { createElement, useEffect, useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/interview';
import { colors, radius, space } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

// Files are private. Staff get a link that stops working after 30 minutes.
function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    supabase.storage
      .from('interview-media')
      .createSignedUrl(path, 60 * 30)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [path]);
  return url;
}

export function AudioPlayback({ path }: { path: string }) {
  const url = useSignedUrl(path);
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <View style={{ flex: 1 }}>
        <Button
          title={status.playing ? 'Pause' : 'Play answer'}
          variant="outline"
          icon={status.playing ? 'pause' : 'play'}
          disabled={!url}
          onPress={() => {
            if (status.playing) return player.pause();
            if (status.didJustFinish) player.seekTo(0);
            player.play();
          }}
        />
      </View>
      <Text variant="small">
        {formatTime(status.currentTime ?? 0)} / {formatTime(status.duration ?? 0)}
      </Text>
    </View>
  );
}

export function VideoPlayback({ path }: { path: string }) {
  const url = useSignedUrl(path);
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ width: '100%', aspectRatio: 3 / 4, maxHeight: 420, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.ink }}>
        {url ? (Platform.OS === 'web' ? <WebVideo url={url} /> : <PhoneVideo url={url} />) : null}
      </View>
      {/* If a video will not play here (some phone formats), it opens in the device's own player. */}
      <Button title="Open the video" variant="ghost" icon="external-link" disabled={!url} onPress={() => url && Linking.openURL(url)} />
    </View>
  );
}

function PhoneVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return <VideoView player={player} style={{ flex: 1 }} nativeControls contentFit="contain" />;
}

// Browsers play best with their own video player and its controls.
function WebVideo({ url }: { url: string }) {
  return createElement('video', {
    src: url,
    controls: true,
    playsInline: true,
    preload: 'metadata',
    style: { width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' },
  });
}
