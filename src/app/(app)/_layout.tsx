import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAuth } from '../../lib/auth';
import { registerForPush } from '../../lib/push';
import { colors } from '../../theme';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    if (profile) registerForPush(profile.id);
  }, [profile?.id]);

  // Tapping a decision notification opens the status screen.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const kind = response.notification.request.content.data?.kind;
      if (kind === 'survey') {
        router.push('/surveys');
      } else if (kind === 'decision') {
        refreshProfile();
        router.push('/status');
      } else {
        router.push('/notifications');
      }
    });
    return () => sub.remove();
  }, [refreshProfile]);

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />;
}
