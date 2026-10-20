import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, space } from '../theme';
import { Text } from './Text';

// Every piece of AI text in the app sits under this label.
export function AiLabel({ note }: { note?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <Feather name="cpu" size={14} color={colors.accentBlue} />
      <Text variant="tiny">AI generated{note ? ` · ${note}` : ''}</Text>
    </View>
  );
}
