import { Screen } from '../../../components/Screen';
import { ProfileView } from '../../../components/ProfileView';
import { Text } from '../../../components/Text';
import { isLearner, useAuth } from '../../../lib/auth';

export default function Profile() {
  const { profile } = useAuth();
  const student = isLearner(profile);
  return (
    <Screen withTabBar>
      <Text variant="h1">Profile</Text>
      <ProfileView
        links={[
          { icon: 'bell', label: 'Notifications', href: '/notifications' },
          ...(student ? [] : [{ icon: 'activity' as const, label: 'Application status', href: '/status' as const }]),
          { icon: 'shield', label: 'Terms and privacy', href: '/privacy' },
        ]}
      />
    </Screen>
  );
}
