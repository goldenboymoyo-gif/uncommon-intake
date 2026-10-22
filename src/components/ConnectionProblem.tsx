import { useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { colors, layout, space } from '../theme';
import { Button } from './Button';
import { Logo } from './Logo';
import { Text } from './Text';

// Shown when signed in but the account could not load, instead of a loading screen that never ends.
export function ConnectionProblem() {
  const { refreshProfile, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, padding: layout.sidePadding, justifyContent: 'center', gap: space.lg }}>
      <Logo height={16} />
      <Feather name="wifi-off" size={32} color={colors.accentOrange} />
      <Text variant="h2">We could not load your account</Text>
      <Text variant="small">Check your internet connection, then try again.</Text>
      <Button
        title="Try again"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          await refreshProfile();
          setBusy(false);
        }}
      />
      <Button title="Sign out" variant="ghost" onPress={signOut} />
    </View>
  );
}
