import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { Text } from './Text';

export function EmptyState({
  icon = 'inbox',
  title,
  body,
  accent = colors.accentBlue,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  body?: string;
  accent?: string;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        gap: space.sm,
        paddingVertical: space.xl,
        paddingHorizontal: space.lg,
        backgroundColor: colors.soft,
        borderRadius: radius.lg,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.white,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={20} color={accent} />
      </View>
      <Text variant="bodySemi" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text variant="small" style={{ textAlign: 'center' }}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}
