import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, space } from '../theme';
import { initials, isStaff, useAuth } from '../lib/auth';
import { Avatar } from './Avatar';
import { Logo } from './Logo';
import { Text } from './Text';

// Logo on the left. When signed in, a round avatar with initials opens Profile.
// Pass onBack on screens that sit above the tabs.
export function Header({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  return (
    <View
      style={{
        paddingTop: insets.top + space.sm,
        paddingBottom: space.sm,
        paddingHorizontal: layout.sidePadding,
        backgroundColor: colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: layout.tapTarget }}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={8}
            style={{ minHeight: layout.tapTarget, justifyContent: 'center', paddingRight: space.sm }}
          >
            <Text variant="bodySemi" style={{ color: colors.brand }}>Back</Text>
          </Pressable>
        ) : null}
        <Logo />
      </View>
      {session ? (
        <Avatar label={initials(profile)} path={profile?.avatar_path} size={36} onPress={() => router.navigate(isStaff(profile) ? '/account' : '/profile')} />
      ) : null}
    </View>
  );
}
