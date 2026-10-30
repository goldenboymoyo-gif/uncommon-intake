import { useState } from 'react';
import { Platform, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useAuth } from '../lib/auth';
import { enableWebPush, isAndroid, isInstalled, isIphone, pushPermission, pushSupported } from '../lib/webPush';
import { colors, space } from '../theme';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

const IPHONE_STEPS = ['Open this page in Safari.', 'Tap the Share button at the bottom of the screen.', 'Tap "Add to Home Screen", then tap Add.', 'Open Uncommon Intake from your home screen.'];

/** Website only: how to get Uncommon Intake on a phone. */
export function GetTheApp() {
  if (Platform.OS !== 'web' || isInstalled()) return null;
  const iphone = isIphone();
  const android = isAndroid();
  return (
    <Card tone="soft" large style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Feather name="smartphone" size={20} color={colors.accentBlue} />
        <Text variant="h3">Get it on your phone</Text>
      </View>
      {!iphone ? (
        <View style={{ gap: space.sm }}>
          <Text variant="small">{android ? 'Download the app for your Android phone. Your phone may ask you to allow the install.' : 'Android phones: download the app.'}</Text>
          <Button title="Download for Android" icon="download" onPress={() => { window.location.href = '/uncommon-intake.apk'; }} />
        </View>
      ) : null}
      {!android ? (
        <View style={{ gap: space.xs }}>
          <Text variant="smallSemi">{iphone ? 'Add it to your iPhone' : 'iPhones: add it to the home screen'}</Text>
          {IPHONE_STEPS.map((s, i) => (
            <Text key={s} variant="small">{i + 1}. {s}</Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

/** Website only: turns on notifications. iPhones allow this only from the home screen. */
export function WebNotifications() {
  const { profile } = useAuth();
  const [state, setState] = useState(() => (Platform.OS === 'web' ? pushPermission() : 'granted'));
  const [busy, setBusy] = useState(false);
  if (Platform.OS !== 'web' || state === 'granted' || !profile) return null;

  if (isIphone() && !isInstalled()) {
    return (
      <Card tone="soft" style={{ gap: space.xs }}>
        <Text variant="bodySemi">Want notifications on your iPhone?</Text>
        <Text variant="small">First add this page to your home screen: tap Share, then "Add to Home Screen". Open it from there and come back here. You need iOS 16.4 or newer.</Text>
      </Card>
    );
  }
  if (!pushSupported()) return null;
  if (state === 'denied') {
    return (
      <Card tone="soft">
        <Text variant="small">Notifications are blocked. To turn them on, allow notifications for this site in your browser settings.</Text>
      </Card>
    );
  }
  return (
    <Card tone="soft" style={{ gap: space.sm }}>
      <Text variant="bodySemi">Turn on notifications</Text>
      <Text variant="small">Get told when there is a decision, a survey, a new job or a reminder.</Text>
      <Button
        title="Turn on notifications"
        icon="bell"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          await enableWebPush(profile.id).catch(() => false);
          setState(pushPermission());
          setBusy(false);
        }}
      />
    </Card>
  );
}
