import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { Screen } from '../../../components/Screen';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Text } from '../../../components/Text';
import { GraduateStories, HowItWorks, IntakeCard } from '../../../components/HomeSections';
import { isLearner, useAuth } from '../../../lib/auth';
import { fetchCurrentIntake, useMyApplication, useQuery, useUnreadCount } from '../../../lib/data';
import { nextStep, TOTAL_STEPS } from '../../../lib/progress';
import { colors, layout, radius, space } from '../../../theme';

export default function Home() {
  const { profile } = useAuth();
  const { data: app, loading, reload } = useMyApplication();
  const { data: intake } = useQuery(fetchCurrentIntake);
  const unread = useUnreadCount();
  const student = isLearner(profile);
  const step = nextStep(app ?? null);
  const progress = app?.submitted_at ? 1 : app ? (app.current_step - 1) / TOTAL_STEPS : 0;

  return (
    <Screen withTabBar refreshing={loading} onRefresh={reload}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text variant="small">Welcome back</Text>
          <Text variant="h1">{profile?.first_names?.split(' ')[0] || 'Hello'}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unread ? `Notifications, ${unread} new` : 'Notifications'}
          onPress={() => router.push('/notifications')}
          style={{ width: layout.tapTarget, height: layout.tapTarget, borderRadius: radius.pill, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}
        >
          <Feather name="bell" size={20} color={colors.ink} />
          {unread ? <View style={{ position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accentRose }} /> : null}
        </Pressable>
      </View>

      {student ? (
        <>
          <Card large>
            <Text variant="h2">{profile?.role === 'graduate' ? 'Welcome back, graduate' : 'You are part of the bootcamp'}</Text>
            <Text variant="small">Chat with your coach about your CV, cover letters, interviews and English. See new job openings.</Text>
          </Card>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <QuickCard icon="compass" accent={colors.accentBlue} title="Career coach" onPress={() => router.navigate('/coach')} />
            <QuickCard icon="briefcase" accent={colors.accentMint} title="Jobs" onPress={() => router.navigate('/jobs')} />
          </View>
        </>
      ) : (
        <Card large>
          <Text variant="tiny">YOUR NEXT STEP</Text>
          <Text variant="h2">{step.title}</Text>
          <Text variant="small">{step.body}</Text>
          {app && !app.submitted_at ? (
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.soft, overflow: 'hidden', marginVertical: space.xs }}>
              <View style={{ width: `${Math.max(progress * 100, 4)}%`, height: '100%', backgroundColor: colors.brand }} />
            </View>
          ) : null}
          <View style={{ marginTop: space.sm }}>
            <Button title={step.action} onPress={() => router.push(step.href)} />
          </View>
        </Card>
      )}

      {!app && !student ? <IntakeCard intake={intake ?? null} /> : null}
      {!app && !student ? <HowItWorks /> : null}
      <GraduateStories />
    </Screen>
  );
}

function QuickCard({ icon, accent, title, onPress }: { icon: keyof typeof Feather.glyphMap; accent: string; title: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ flex: 1, gap: space.md }}>
      <Feather name={icon} size={22} color={accent} />
      <Text variant="bodySemi">{title}</Text>
    </Card>
  );
}
