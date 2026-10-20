import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, space } from '../theme';
import { bootcamp, howItWorks, storiesEmpty } from '../content';
import { fetchGraduateStories, formatDate, useQuery } from '../lib/data';
import type { Intake } from '../lib/types';
import { Card } from './Card';
import { Chip } from './Chip';
import { EmptyState } from './EmptyState';
import { Text } from './Text';

const accents = [colors.accentOrange, colors.accentBlue, colors.accentMint];

export function IntakeCard({ intake }: { intake: Intake | null }) {
  const year = intake?.year ?? 2027;
  return (
    <Card large style={{ backgroundColor: colors.brand, borderColor: colors.brand, gap: space.md }}>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        {intake?.is_open ? <Chip label="Applications open" tone="success" /> : null}
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
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={step.icon} size={20} color={accents[i]} />
          </View>
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
  const { data: stories, loading } = useQuery(fetchGraduateStories);
  return (
    <View style={{ gap: space.md }}>
      <Text variant="h2">Our 2026 graduates</Text>
      {!loading && (!stories || stories.length === 0) ? (
        <EmptyState icon="award" accent={colors.accentOrange} title={storiesEmpty} />
      ) : (
        stories?.map((s) => (
          <Card key={s.id} large>
            <Text variant="h3">{s.name}</Text>
            <Text variant="smallSemi" style={{ color: colors.brand }}>
              {s.role} at {s.employer}
            </Text>
            <Text>{s.story}</Text>
          </Card>
        ))
      )}
    </View>
  );
}
