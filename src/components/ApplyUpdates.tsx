import { useEffect } from 'react';
import * as Updates from 'expo-updates';

// New versions download in the background. Only restart soon after opening, so nobody loses their place.
const RESTART_WINDOW_MS = 30 * 1000;
const openedAt = Date.now();

export function ApplyUpdates() {
  const { isUpdatePending } = Updates.useUpdates();
  useEffect(() => {
    if (isUpdatePending && Date.now() - openedAt < RESTART_WINDOW_MS) {
      Updates.reloadAsync().catch((e) => console.warn('update restart failed', e));
    }
  }, [isUpdatePending]);
  return null;
}
