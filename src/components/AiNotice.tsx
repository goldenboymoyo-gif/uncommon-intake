import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, space } from '../theme';
import { peopleDecide } from '../content';
import { Card } from './Card';
import { Text } from './Text';

const points: { icon: keyof typeof Feather.glyphMap; text: string }[] = [
  { icon: 'file-text', text: 'AI reads your CV and writes 5 interview questions about your own skills and experience.' },
  { icon: 'type', text: 'If you answer by voice or video, AI turns your words into text.' },
  { icon: 'align-left', text: 'AI writes a short summary of each answer to help our team read faster. Staff always see your full answer too.' },
  { icon: 'eye-off', text: 'AI does not score your CV, look at your face, judge your voice or tone, or guess your feelings.' },
  { icon: 'users', text: 'AI never decides who gets a place. Our team reads every application and decides.' },
];

export function AiNotice() {
  return (
    <Card large tone="soft" style={{ gap: space.md }}>
      <Text variant="h3">What happens with your CV and answers</Text>
      {points.map((p) => (
        <View key={p.text} style={{ flexDirection: 'row', gap: space.md }}>
          <Feather name={p.icon} size={18} color={colors.accentBlue} style={{ marginTop: 3 }} />
          <Text variant="small" style={{ flex: 1, color: colors.ink }}>{p.text}</Text>
        </View>
      ))}
      <Text variant="smallSemi" style={{ color: colors.brand }}>{peopleDecide}</Text>
    </Card>
  );
}
