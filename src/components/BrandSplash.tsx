import { Image, Platform, StyleSheet } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { colors } from '../theme';

// Shown while the app starts. It must look exactly like the first splash, so people only ever see one:
// on phones the native splash (same image, same size), on the website the one in public/index.html.
export function BrandSplash() {
  return (
    <Animated.View exiting={FadeOut.duration(300)} style={[StyleSheet.absoluteFill, styles.wrap]} accessibilityLabel="Loading">
      {Platform.OS === 'web' ? (
        <Image source={{ uri: '/splash-text.png' }} style={{ width: 200, height: 47 }} />
      ) : (
        <Image source={require('../../assets/splash-logo.png')} style={{ width: 240, height: 240 }} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
