import { Platform } from 'react-native';

// A very short silent sound, used to unlock playback while the tap is still happening.
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

/**
 * Browsers only play sound straight after a tap, but Listen first waits for the server.
 * Call this at the start of the tap: it returns a player that may play later, or null on phones.
 */
export function unlockWebAudio(): ((url: string, rate?: number) => Promise<void>) | null {
  if (Platform.OS !== 'web') return null;
  const audio = new Audio(SILENCE);
  audio.play().catch(() => undefined);
  return async (url, rate = 1) => {
    audio.src = url;
    audio.playbackRate = rate;
    await audio.play();
  };
}
