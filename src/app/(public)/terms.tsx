import { View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { PrivacyNotice } from '../../components/PrivacyNotice';

export default function Terms() {
  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen>
        <Text variant="h1">Terms and privacy</Text>
        <PrivacyNotice />
      </Screen>
    </View>
  );
}
