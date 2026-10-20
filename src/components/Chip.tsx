import { View } from 'react-native';
import { colors, radius, space } from '../theme';
import { Text } from './Text';
import type { ReviewStatus } from '../lib/types';

export type ChipTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

const tones: Record<ChipTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.soft, fg: colors.muted },
  brand: { bg: '#E8EEFA', fg: colors.brand },
  success: { bg: colors.successBg, fg: colors.success },
  warning: { bg: colors.warningBg, fg: colors.warning },
  danger: { bg: colors.dangerBg, fg: colors.danger },
};

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: ChipTone }) {
  const t = tones[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: t.bg,
        borderRadius: radius.pill,
        paddingHorizontal: space.sm + 2,
        paddingVertical: 3,
      }}
    >
      <Text variant="tiny" style={{ color: t.fg }}>
        {label}
      </Text>
    </View>
  );
}

export const reviewStatusChip: Record<ReviewStatus, { label: string; tone: ChipTone }> = {
  not_started: { label: 'Not started', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'warning' },
  all_answered: { label: 'All 5 answered', tone: 'brand' },
  ready_to_review: { label: 'Ready to review', tone: 'brand' },
  in_review: { label: 'In review', tone: 'warning' },
  needs_help: { label: 'Needs help', tone: 'danger' },
  accepted: { label: 'Accepted', tone: 'success' },
  waitlisted: { label: 'Waitlist', tone: 'warning' },
  not_accepted: { label: 'Not accepted', tone: 'neutral' },
};
