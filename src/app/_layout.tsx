import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { NunitoSans_400Regular, NunitoSans_600SemiBold, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { AuthProvider, isStaff, useAuth } from '../lib/auth';
import { ApplyUpdates } from '../components/ApplyUpdates';
import { UploadQueueRunner } from '../lib/uploadQueue';
import { setUpWebsite } from '../lib/webPush';
import { BrandSplash } from '../components/BrandSplash';
import { ConnectionProblem } from '../components/ConnectionProblem';
import { Platform } from 'react-native';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') setUpWebsite();
  }, []);

  const [fontsLoaded] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          {Platform.OS !== 'web' && !__DEV__ ? <ApplyUpdates /> : null}
          {fontsLoaded ? <RootStack /> : <BrandSplash />}
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { session, profile, loading, profileFailed } = useAuth();
  const ready = !loading && (!session || !!profile || profileFailed);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return <BrandSplash />;
  if (session && !profile) return <ConnectionProblem />;
  const signedIn = !!session && !!profile;
  const staff = signedIn && isStaff(profile);
  // New staff stay on their own screens until they are approved.
  const joining = signedIn && (!!profile?.staff_status || (profile?.role === 'staff' && !profile.hub_id));

  return (
    <>
      {signedIn && !staff ? <UploadQueueRunner /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(public)" />
        </Stack.Protected>
        <Stack.Protected guard={joining}>
          <Stack.Screen name="(join)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !staff && !joining}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={staff && !joining}>
          <Stack.Screen name="(staff)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
