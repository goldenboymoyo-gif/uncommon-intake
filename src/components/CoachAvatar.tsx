import { View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { Career } from '../lib/coach';
import { colors, fonts, space } from '../theme';
import { Text } from './Text';

/** The coach's picture: their career icon in a coloured circle, with a small AI badge. */
export function CoachAvatar({ career, size = 56 }: { career: Career; size?: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: career.color, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name={career.icon} size={size * 0.42} color={colors.white} />
      </View>
      <View style={{ position: 'absolute', right: -2, bottom: -2, backgroundColor: colors.white, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 4 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink }}>AI</Text>
      </View>
    </View>
  );
}

/** Coach picture, name and what they help with. */
export function CoachIntro({ career, customCareer }: { career: Career; customCareer?: string }) {
  const field = career.id === 'other' ? customCareer?.trim() || 'the career you choose' : career.label.toLowerCase();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <CoachAvatar career={career} />
      <View style={{ flex: 1 }}>
        <Text variant="bodySemi">Coach {career.coach}</Text>
        <Text variant="small">AI coach for {field}</Text>
      </View>
    </View>
  );
}
