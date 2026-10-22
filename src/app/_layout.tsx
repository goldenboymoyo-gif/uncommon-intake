import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { NunitoSans_400Regular, NunitoSans_600SemiBold, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { AuthProvider, isStaff, useAuth } from '../lib/auth';
import { UploadQueueRunner } from '../lib/uploadQueue';
import { BrandSplash } from '../components/BrandSplash';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
          {fontsLoaded ? <RootStack /> : <BrandSplash />}
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { session, profile, loading } = useAuth();
  const ready = !loading && (!session || profile);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return <BrandSplash />;
  const signedIn = !!session && !!profile;
  const staff = signedIn && isStaff(profile);

  return (
    <>
      {signedIn && !staff ? <UploadQueueRunner /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(public)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !staff}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={staff}>
          <Stack.Screen name="(staff)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
