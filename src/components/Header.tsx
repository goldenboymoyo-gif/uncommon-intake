import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, space } from '../theme';
import { initials, useAuth } from '../lib/auth';
import { Avatar } from './Avatar';
import { Logo } from './Logo';

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
            style={{ width: layout.tapTarget, height: layout.tapTarget, justifyContent: 'center', marginLeft: -space.sm, paddingLeft: space.sm }}
          >
            <Feather name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
        ) : null}
        <Logo />
      </View>
      {session ? <Avatar label={initials(profile)} size={36} onPress={() => router.navigate('/profile')} /> : null}
    </View>
  );
}
