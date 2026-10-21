import { ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fetchHubs, formatDate, intakeState, useQuery } from '../lib/data';
import type { Intake } from '../lib/types';
import { colors, layout, radius, space } from '../theme';
import { Card } from './Card';
import { Text } from './Text';

const DAY = 24 * 60 * 60 * 1000;
const daysUntil = (iso: string) => Math.max(0, Math.ceil((new Date(`${iso}T23:59:59+02:00`).getTime() - Date.now()) / DAY));

/** Days left to apply, or days until applications open. Counted from the real intake dates. */
export function IntakeCountdown({ intake }: { intake: Intake | null }) {
  const state = intakeState(intake);
  const target = state === 'not_yet' ? intake?.opens_at : state === 'open' ? intake?.closes_at : null;
  if (!target) return null;
  const days = daysUntil(target);
  return (
    <Card large style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
      <View style={{ width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="h1" style={{ color: colors.brand }}>{days}</Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodySemi">{state === 'open' ? `${days === 1 ? 'Day' : 'Days'} left to apply` : `${days === 1 ? 'Day' : 'Days'} until applications open`}</Text>
        <Text variant="small">{state === 'open' ? `Applications close on ${formatDate(target)}.` : `Applications open on ${formatDate(target)}.`}</Text>
      </View>
    </Card>
  );
}

/** The real Uncommon Innovation Hubs from the database, grouped by city. */
export function HubsStrip() {
  const { data: hubs } = useQuery(fetchHubs);
  if (!hubs?.length) return null;
  const cities = [...new Set(hubs.map((h) => h.city ?? 'Other'))];
  const open = hubs.filter((h) => h.status === 'open').length;
  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="h2">Our Innovation Hubs</Text>
        <Text variant="small">{open} hubs open in {cities.length} cities. Pick the one closest to you when you apply.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -layout.sidePadding }} contentContainerStyle={{ gap: space.md, paddingHorizontal: layout.sidePadding }}>
        {cities.map((city) => {
          const inCity = hubs.filter((h) => (h.city ?? 'Other') === city);
          return (
            <Card key={city} style={{ width: 220, gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Feather name="map-pin" size={16} color={colors.accentOrange} />
                <Text variant="bodySemi">{city}</Text>
              </View>
              {inCity.map((h) => (
                <Text key={h.id} variant="small" numberOfLines={1}>
                  {h.area ?? h.name}{h.status === 'coming_soon' ? ' (coming soon)' : ''}
                </Text>
              ))}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const tips: { icon: keyof typeof Feather.glyphMap; title: string; body: string }[] = [
  { icon: 'clock', title: 'Take your time', body: 'There is no timer on text answers. Save and come back when you are ready.' },
  { icon: 'mic', title: 'Find a quiet spot', body: 'For voice or video, a quiet room helps us hear you clearly.' },
  { icon: 'smile', title: 'Be yourself', body: 'There are no trick questions. Tell us what you did and what you learned.' },
];

/** Plain advice for the interview. No made up facts or numbers. */
export function InterviewTips() {
  return (
    <View style={{ gap: space.md }}>
      <Text variant="h2">Interview tips</Text>
      {tips.map((t) => (
        <View key={t.title} style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name={t.icon} size={18} color={colors.accentBlue} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodySemi">{t.title}</Text>
            <Text variant="small">{t.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
