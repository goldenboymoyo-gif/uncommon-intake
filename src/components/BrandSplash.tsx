import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, fonts, space } from '../theme';
import { Logo } from './Logo';
import { Text } from './Text';

// Shown while the app starts, matching the native splash: blue wordmark and INTAKE on white.
export function BrandSplash() {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(0.6, { duration: 900 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View exiting={FadeOut.duration(300)} style={[StyleSheet.absoluteFill, styles.wrap]} accessibilityLabel="Loading">
      <Animated.View style={[style, { alignItems: 'center', gap: space.lg }]}>
        <Logo height={22} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, letterSpacing: 6, color: colors.brand }}>INTAKE</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
