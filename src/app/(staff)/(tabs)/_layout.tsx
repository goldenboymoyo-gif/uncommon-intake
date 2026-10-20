import { View } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { Header } from '../../../components/Header';
import { PillTabBar, TabItem } from '../../../components/PillTabBar';

const items: TabItem[] = [
  { name: 'board', label: 'Review', icon: 'inbox' },
  { name: 'overview', label: 'Overview', icon: 'bar-chart-2' },
  { name: 'staff-surveys', label: 'Surveys', icon: 'clipboard' },
  { name: 'account', label: 'Profile', icon: 'user' },
];

export const unstable_settings = { initialRouteName: 'board' };

export default function StaffTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <PillTabBar {...props} items={items} />}>
        <Tabs.Screen name="board" />
        <Tabs.Screen name="overview" />
        <Tabs.Screen name="staff-surveys" />
        <Tabs.Screen name="account" />
      </Tabs>
    </View>
  );
}
