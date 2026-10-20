import { Text } from 'react-native';
import { colors, fonts } from '../theme';

// Text wordmark for now. Swap the body of this component for the official SVG later.
export function Logo({ size = 24, color = colors.brand }: { size?: number; color?: string }) {
  return (
    <Text
      accessibilityRole="header"
      accessibilityLabel="uncommon"
      style={{ fontFamily: fonts.heading, fontSize: size, lineHeight: size * 1.2, color, letterSpacing: -0.5 }}
    >
      uncommon
    </Text>
  );
}
