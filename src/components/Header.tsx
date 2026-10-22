import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, space } from '../theme';
import { initials, isStaff, useAuth } from '../lib/auth';
import { Avatar } from './Avatar';
import { Logo } from './Logo';
import { Text } from './Text';

// Logo on the left and, when signed in, a round photo or initials on the right that opens Profile.
// The logo never moves: screens that need Back show it on its own row underneath.
export function Header({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  return (
    <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: layout.sidePadding, backgroundColor: colors.white }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: layout.tapTarget }}>
        <Logo />
        {session ? (
          <Avatar
            label={initials(profile)}
            path={profile?.avatar_path}
            size={34}
            onPress={() => router.navigate(isStaff(profile) ? '/account' : '/profile')}
          />
        ) : null}
      </View>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: layout.tapTarget }}
        >
          <Text variant="bodySemi" style={{ color: colors.brand }}>Back</Text>
        </Pressable>
      ) : (
        <View style={{ height: space.sm }} />
      )}
    </View>
  );
}
