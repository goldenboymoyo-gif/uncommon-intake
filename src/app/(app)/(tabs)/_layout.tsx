import { View } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { Header } from '../../../components/Header';
import { PillTabBar, TabItem } from '../../../components/PillTabBar';
import { isLearner, useAuth } from '../../../lib/auth';

const beforeAcceptance: TabItem[] = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'application', label: 'Application', icon: 'file-text' },
  { name: 'coach', label: 'Coach', icon: 'compass' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

const graduateTabs: TabItem[] = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'coach', label: 'Coach', icon: 'compass' },
  { name: 'jobs', label: 'Jobs', icon: 'briefcase' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

const afterAcceptance: TabItem[] = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'coach', label: 'Coach', icon: 'compass' },
  { name: 'jobs', label: 'Jobs', icon: 'briefcase' },
  { name: 'surveys', label: 'Surveys', icon: 'clipboard' },
  { name: 'profile', label: 'Profile', icon: 'user' },
];

export const unstable_settings = { initialRouteName: 'home' };

export default function AppTabs() {
  const { profile } = useAuth();
  const items = profile?.role === 'student' ? afterAcceptance : isLearner(profile) ? graduateTabs : beforeAcceptance;

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <PillTabBar {...props} items={items} />}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="application" />
        <Tabs.Screen name="coach" />
        <Tabs.Screen name="jobs" />
        <Tabs.Screen name="surveys" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}
