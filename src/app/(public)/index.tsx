import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { GraduateStories, HowItWorks, IntakeCard } from '../../components/HomeSections';
import { Text } from '../../components/Text';
import { GetTheApp } from '../../components/WebInstall';
import { bootcamp } from '../../content';
import { fetchCurrentIntake, useQuery } from '../../lib/data';
import { space } from '../../theme';

export default function Welcome() {
  const { data: intake, loading, reload } = useQuery(fetchCurrentIntake);

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Screen
        refreshing={loading}
        onRefresh={reload}
        footer={
          <>
            <Button title="Create account and apply" haptic onPress={() => router.push('/sign-up')} />
            <Button title="I already have an account" variant="outline" onPress={() => router.push('/sign-in')} />
          </>
        }
      >
        <IntakeCard intake={intake ?? null} />
        <View style={{ gap: space.sm }}>
          <Text>{bootcamp.fullTime}.</Text>
          <Text variant="small">{bootcamp.givingBack}</Text>
        </View>
        <GetTheApp />
        <HowItWorks />
        <GraduateStories />
      </Screen>
    </View>
  );
}
