import { Image, View } from 'react-native';
import { supabase } from '../lib/supabase';
import type { GraduateStory } from '../lib/types';
import { colors, fonts, radius, space } from '../theme';
import { Card } from './Card';
import { Text } from './Text';

export const storyPhotoUrl = (path: string | null) =>
  path ? supabase.storage.from('story-photos').getPublicUrl(path).data.publicUrl : null;

/** Round photo, or initials when there is no photo. */
export function GraduatePhoto({ story, size }: { story: Pick<GraduateStory, 'name' | 'photo_path'>; size: number }) {
  const url = storyPhotoUrl(story.photo_path);
  const initials = story.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: size, height: size }} accessibilityIgnoresInvertColors />
      ) : (
        <Text style={{ fontFamily: fonts.bodyBold, color: colors.white, fontSize: size * 0.36 }}>{initials}</Text>
      )}
    </View>
  );
}

/** Compact card for the Home screen: photo, name and job. Tap to read the full story. */
export function GraduateCard({ story, onPress }: { story: GraduateStory; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ width: 168, alignItems: 'center', gap: space.sm, paddingVertical: space.lg, borderRadius: radius.lg }}>
      <GraduatePhoto story={story} size={64} />
      <Text variant="bodySemi" numberOfLines={1} style={{ textAlign: 'center' }}>{story.name}</Text>
      <Text variant="small" numberOfLines={2} style={{ textAlign: 'center' }}>
        {story.role} at {story.employer}
      </Text>
    </Card>
  );
}
