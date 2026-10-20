import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { colors, fonts, layout, radius, space } from '../theme';
import { Text } from './Text';

type Props = TextInputProps & { label: string; helper?: string; error?: string | null; optional?: boolean };

// Label above, helper text below in muted, error text in danger.
export function Input({ label, helper, error, optional, multiline, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="smallSemi">
        {label}
        {optional ? <Text variant="small"> (optional)</Text> : null}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline, error ? { borderColor: colors.danger } : null, style]}
        {...rest}
      />
      {error ? (
        <Text variant="small" style={{ color: colors.danger }}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="small">{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs + 2 },
  input: {
    minHeight: layout.inputHeight,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: space.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 140, paddingTop: space.md, textAlignVertical: 'top' },
});
