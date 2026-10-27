import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchGraduateStories, useQuery } from '../lib/data';
import { colors, space } from '../theme';
import { EmptyState } from './EmptyState';
import { GraduatePhoto } from './GraduateCard';
import { Header } from './Header';
import { Screen } from './Screen';
import { Text } from './Text';

// A graduate's full profile and story. Used by both the public and the signed in routes.
export function GraduateProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: stories, loading } = useQuery(fetchGraduateStories, [], 'graduate-stories');
  const story = stories?.find((s) => s.id === id);

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen>
        {story ? (
          <>
            <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.lg }}>
              <GraduatePhoto story={story} size={112} />
              <Text variant="h1" style={{ textAlign: 'center' }}>{story.name}</Text>
              <Text variant="bodySemi" style={{ color: colors.brand, textAlign: 'center' }}>
                {story.role} at {story.employer}
              </Text>
              <Text variant="small">2026 graduate</Text>
            </View>
            <Text style={{ color: colors.ink }}>{story.story}</Text>
          </>
        ) : !loading ? (
          <EmptyState icon="user" title="This story is no longer available" />
        ) : null}
      </Screen>
    </View>
  );
}
