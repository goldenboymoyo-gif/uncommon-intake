import { Image, Pressable, View } from 'react-native';
import { useAvatarUrl } from '../lib/avatar';
import { colors, fonts } from '../theme';
import { Text } from './Text';

// Shows the profile photo if there is one, otherwise the person's initials.
export function Avatar({ label, path, size = 40, onPress }: { label: string; path?: string | null; size?: number; onPress?: () => void }) {
  const url = useAvatarUrl(path);
  const circle = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={{ fontFamily: fonts.bodyBold, color: colors.white, fontSize: size * 0.38 }}>{label}</Text>
      )}
    </View>
  );
  if (!onPress) return circle;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onPress} hitSlop={8}>
      {circle}
    </Pressable>
  );
}
