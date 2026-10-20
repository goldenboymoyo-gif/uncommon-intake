import { Screen } from '../../../components/Screen';
import { ProfileView } from '../../../components/ProfileView';
import { Text } from '../../../components/Text';

export default function StaffAccount() {
  return (
    <Screen withTabBar>
      <Text variant="h1">Profile</Text>
      <ProfileView links={[{ icon: 'shield', label: 'Terms and privacy', href: '/staff-privacy' }]} />
    </Screen>
  );
}
