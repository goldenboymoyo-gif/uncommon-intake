import { Pressable, StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, space } from '../theme';

type Props = ViewProps & { large?: boolean; onPress?: () => void; tone?: 'white' | 'soft' };

export function Card({ large, onPress, tone = 'white', style, children, ...rest }: Props) {
  const base = [
    styles.card,
    large && { borderRadius: radius.lg, padding: space.xl },
    tone === 'soft' && { backgroundColor: colors.soft },
    style,
  ];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [base, pressed && { backgroundColor: colors.soft }]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: space.lg,
    gap: space.sm,
  },
});
