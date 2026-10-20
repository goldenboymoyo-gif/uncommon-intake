import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { registerForPush } from '../../lib/push';
import { colors } from '../../theme';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function StaffLayout() {
  const { profile } = useAuth();
  useEffect(() => {
    if (profile) registerForPush(profile.id);
  }, [profile?.id]);
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }} />;
}
