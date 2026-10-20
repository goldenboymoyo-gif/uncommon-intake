import { ActivityIndicator, Pressable, PressableProps, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, layout, radius, space } from '../theme';
import { Text } from './Text';

type Variant = 'primary' | 'outline' | 'danger' | 'ghost';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  /** Light haptic tap for important actions like submit or decide. */
  haptic?: boolean;
  fullWidth?: boolean;
};

export function Button({ title, variant = 'primary', loading, disabled, icon, haptic, fullWidth = true, onPress, style, ...rest }: Props) {
  const isDisabled = disabled || loading;
  const textColor = variant === 'primary' ? colors.white : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.brand : colors.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(e);
      }}
      style={(state) => [
        styles.base,
        fullWidth && { alignSelf: 'stretch' },
        variants[variant],
        state.pressed && pressed[variant],
        isDisabled && { opacity: 0.5 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.row}>
          {icon && <Feather name={icon} size={18} color={textColor} />}
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: textColor }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.buttonHeight,
    borderRadius: radius.sm,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});

const variants = StyleSheet.create({
  primary: { backgroundColor: colors.brand },
  outline: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
});

const pressed = StyleSheet.create({
  primary: { backgroundColor: colors.brandDark },
  outline: { backgroundColor: colors.soft },
  danger: { backgroundColor: colors.dangerBg },
  ghost: { backgroundColor: colors.soft },
});
