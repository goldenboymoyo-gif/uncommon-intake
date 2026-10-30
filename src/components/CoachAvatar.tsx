import { Image } from 'react-native';
import type { CoachSubject } from '../lib/coach';
import { colors } from '../theme';

/** The coach's profile picture. */
export function CoachAvatar({ subject, size = 56 }: { subject: CoachSubject; size?: number }) {
  return (
    <Image
      source={subject.photo}
      accessibilityLabel={`Coach ${subject.coach}`}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.soft }}
    />
  );
}
