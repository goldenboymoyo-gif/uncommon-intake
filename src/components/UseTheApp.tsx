import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { colors, layout, space } from '../theme';
import { Button } from './Button';
import { Logo } from './Logo';
import { Text } from './Text';

// The website is for staff. Applicants and students use the phone app, which has the interview tools.
export function UseTheApp() {
  const { signOut } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: layout.sidePadding }}>
      <View style={{ width: '100%', maxWidth: 420, gap: space.lg }}>
        <Logo height={18} />
        <Feather name="smartphone" size={32} color={colors.accentBlue} />
        <Text variant="h2">Please use the Uncommon Intake app</Text>
        <Text>
          The website is for Uncommon staff. To apply, record your interview and follow your application, use the
          Uncommon Intake app on your phone.
        </Text>
        <Button title="Sign out" variant="outline" onPress={signOut} />
      </View>
    </View>
  );
}
