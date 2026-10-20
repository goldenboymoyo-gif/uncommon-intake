import { View } from 'react-native';
import type { Suggestions } from '../lib/types';
import { colors, space } from '../theme';
import { AiLabel } from './AiLabel';
import { Card } from './Card';
import { Text } from './Text';

export function FeedbackCard({ feedback, note }: { feedback: Suggestions; note?: string }) {
  return (
    <Card tone="soft" large style={{ gap: space.md }}>
      <AiLabel note="feedback only" />
      {note ? <Text variant="small">{note}</Text> : null}
      {feedback.strengths.length ? (
        <View style={{ gap: space.xs }}>
          <Text variant="bodySemi">What works well</Text>
          {feedback.strengths.map((s, i) => (
            <Text key={i} variant="small" style={{ color: colors.ink }}>• {s}</Text>
          ))}
        </View>
      ) : null}
      {feedback.suggestions.length ? (
        <View style={{ gap: space.xs }}>
          <Text variant="bodySemi">Things to work on</Text>
          {feedback.suggestions.map((s, i) => (
            <Text key={i} variant="small" style={{ color: colors.ink }}>
              • <Text variant="smallSemi">{s.area}:</Text> {s.suggestion}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
