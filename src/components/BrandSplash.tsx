import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';
import { Logo } from './Logo';

// Shown while the app starts, matching the native splash: white wordmark on the brand blue.
export function BrandSplash() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.6, { duration: 900 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View exiting={FadeOut.duration(300)} style={[StyleSheet.absoluteFill, styles.wrap]} accessibilityLabel="Loading">
      <Animated.View style={style}>
        <Logo height={22} color={colors.white} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
