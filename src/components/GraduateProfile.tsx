import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { fetchGraduateStories, useQuery } from '../lib/data';
import { colors, space } from '../theme';
import { Button } from './Button';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { GraduatePhoto } from './GraduateCard';
import { Header } from './Header';
import { Screen } from './Screen';
import { Text } from './Text';

// A graduate's full profile and story. Used by both the public and the signed in routes.
export function GraduateProfile({ locked = false }: { locked?: boolean }) {
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
            {locked ? (
              <Card tone="soft" large style={{ gap: space.md }}>
                <Text variant="bodySemi">Read {story.name.split(' ')[0]}'s full story</Text>
                <Text variant="small">Create a free account to read the full stories of our 2026 graduates.</Text>
                <Button title="Create account" onPress={() => router.push('/sign-up')} />
                <Button title="I already have an account" variant="outline" onPress={() => router.push('/sign-in')} />
              </Card>
            ) : (
              <Text style={{ color: colors.ink }}>{story.story}</Text>
            )}
          </>
        ) : !loading ? (
          <EmptyState icon="user" title="This story is no longer available" />
        ) : null}
      </Screen>
    </View>
  );
}
