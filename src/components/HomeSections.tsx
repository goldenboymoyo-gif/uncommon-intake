import { Image, Linking, ScrollView, View } from 'react-native';
import { Href, router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { colors, layout, radius, space } from '../theme';
import { useAuth } from '../lib/auth';
import { GraduateCard } from './GraduateCard';
import { bootcamp, howItWorks, storiesEmpty } from '../content';
import { fetchGraduateStories, formatDate, intakeState, useQuery } from '../lib/data';
import type { Intake } from '../lib/types';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { EmptyState } from './EmptyState';
import { Text } from './Text';
import { IconTile, tileColors } from './IconTile';

const accents = [colors.accentOrange, colors.accentBlue, colors.accentMint];

// Public profiles on the Uncommon Talent Marketplace. The photos stay on that site.
const marketplaceGraduates = [
  {
    name: 'Bright Moyo',
    role: 'Full-Stack Developer',
    photo: 'https://talent-profiles.nyc3.cdn.digitaloceanspaces.com/migrated/kg296rzefkcdjdwa6cjwynp0ps8dq45w.jpeg',
    url: 'https://talent.uncommon.org/talents/bright-moyo-mtlagf5j',
  },
  {
    name: 'Stacy Chelsea Chengetai Mutamba',
    role: 'Software Engineer',
    photo: 'https://talent-profiles.nyc3.cdn.digitaloceanspaces.com/migrated/kg2f537tz1q8eezva9gakhntw18ejbzz.jpeg',
    url: 'https://talent.uncommon.org/talents/stacy-mutamba-mu5b78n5',
  },
  {
    name: 'Solomon Thokozani Nyathi',
    role: 'Product Designer',
    photo: 'https://talent-profiles.nyc3.cdn.digitaloceanspaces.com/migrated/kg2dthav7tqrex7pk56rhbzgq58dqv2a.jpeg',
    url: 'https://talent.uncommon.org/talents/solomon-nyathi-msx6pjhf',
  },
];

export function IntakeCard({ intake }: { intake: Intake | null }) {
  const year = intake?.year ?? 2027;
  return (
    <Card large style={{ backgroundColor: colors.brand, borderColor: colors.brand, gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {intakeState(intake) === 'open' ? <Chip label="Applications open" tone="success" /> : null}
        {intakeState(intake) === 'not_yet' && intake?.opens_at ? <Chip label={`Opens ${formatDate(intake.opens_at)}`} tone="warning" /> : null}
        {bootcamp.facts.map((f) => (
          <View key={f} style={{ backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.pill, paddingHorizontal: space.sm + 2, paddingVertical: 3 }}>
            <Text variant="tiny" style={{ color: colors.white }}>{f}</Text>
          </View>
        ))}
      </View>
      <Text variant="h1" style={{ color: colors.white }}>
        {year} {bootcamp.title} intake
      </Text>
      <Text style={{ color: '#DCE5F7' }}>{bootcamp.intro}</Text>
      {intake?.closes_at ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Feather name="calendar" size={16} color={colors.accentOrange} />
          <Text variant="smallSemi" style={{ color: colors.white }}>Apply by {formatDate(intake.closes_at)}</Text>
        </View>
      ) : null}
    </Card>
  );
}

export function HowItWorks() {
  return (
    <View style={{ gap: space.md }}>
      <Text variant="h2">How it works</Text>
      {howItWorks.map((step, i) => (
        <View key={step.title} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
          <IconTile icon={step.icon} color={accents[i] ?? tileColors[i % tileColors.length]} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodySemi">{i + 1}. {step.title}</Text>
            <Text variant="small">{step.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function GraduateStories() {
  const { session } = useAuth();
  const { data: stories, loading } = useQuery(fetchGraduateStories, [], 'graduate-stories');
  return (
    <View style={{ gap: space.md }}>
      <Text variant="h2">Our graduates</Text>
      {!loading && (!stories || stories.length === 0) ? (
        <EmptyState icon="award" accent={colors.accentOrange} title={storiesEmpty} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -layout.sidePadding, flexGrow: 0 }}
          contentContainerStyle={{ gap: space.md, paddingHorizontal: layout.sidePadding, alignItems: 'flex-start' }}
        >
          {stories?.map((s) => (
            <GraduateCard key={s.id} story={s} onPress={() => router.push((session ? `/graduate/${s.id}` : `/story/${s.id}`) as Href)} />
          ))}
        </ScrollView>
      )}
      {marketplaceGraduates.map((g) => (
        <Card key={g.url} onPress={() => Linking.openURL(g.url)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Image source={{ uri: g.photo }} accessibilityLabel={g.name} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.soft }} />
          <View style={{ flex: 1 }}>
            <Text variant="bodySemi">{g.name}</Text>
            <Text variant="small">{g.role}</Text>
          </View>
        </Card>
      ))}
      <Button title="Meet all Uncommon graduates" variant="ghost" onPress={() => Linking.openURL('https://talent.uncommon.org/')} />
    </View>
  );
}
