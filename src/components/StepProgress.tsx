import { View } from 'react-native';
import { colors, space } from '../theme';
import { Text } from './Text';

// A row of small bars plus "Step 2 of 7". Used by the form and the interview.
export function StepProgress({ current, total, label = 'Step' }: { current: number; total: number; label?: string }) {
  return (
    <View style={{ gap: space.sm }} accessibilityLabel={`${label} ${current} of ${total}`}>
      <Text variant="tiny">
        {label.toUpperCase()} {current} OF {total}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.xs }}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < current ? colors.brand : colors.border }}
          />
        ))}
      </View>
    </View>
  );
}
