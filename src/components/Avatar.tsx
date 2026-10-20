import { Pressable, View } from 'react-native';
import { colors, fonts } from '../theme';
import { Text } from './Text';

export function Avatar({ label, size = 40, onPress }: { label: string; size?: number; onPress?: () => void }) {
  const circle = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.bodyBold, color: colors.white, fontSize: size * 0.38 }}>{label}</Text>
    </View>
  );
  if (!onPress) return circle;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onPress} hitSlop={8}>
      {circle}
    </Pressable>
  );
}
