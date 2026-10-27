import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, fonts, layout, radius, space } from '../theme';
import { Text } from './Text';

export type TabItem = { name: string; label: string; icon: keyof typeof Feather.glyphMap };

const BAR_HEIGHT = 66;
const PAD = 6;
const SPRING = { damping: 20, stiffness: 220, mass: 0.6 };

// Floating bar: every tab shows an icon with its name; a soft brand highlight slides to the active tab.
// Frosted glass on iPhone; a solid white bar on Android, where blur can look rough. Only content scrolls.
export function PillTabBar({ state, navigation, items }: BottomTabBarProps & { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const visible = items.filter((i) => state.routes.some((r) => r.name === i.name));
  const activeName = state.routes[state.index]?.name;
  const activeIndex = Math.max(0, visible.findIndex((i) => i.name === activeName));
  const slot = width > 0 ? (width - PAD * 2) / visible.length : 0;

  const x = useSharedValue(0);
  useEffect(() => {
    x.value = slot ? withSpring(activeIndex * slot, SPRING) : 0;
  }, [activeIndex, slot]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const content = (
    <>
      {slot ? <Animated.View pointerEvents="none" style={[styles.indicator, { width: slot }, indicator]} /> : null}
      {visible.map((item) => {
        const route = state.routes.find((r) => r.name === item.name)!;
        const focused = item.name === activeName;
        const tint = focused ? colors.brand : colors.muted;
        return (
          <Pressable
            key={item.name}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (focused || event.defaultPrevented) return;
              Haptics.selectionAsync();
              navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <Feather name={item.icon} size={21} color={tint} />
            <Text style={[styles.label, { color: tint, fontFamily: focused ? fonts.bodyBold : fonts.bodySemi }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) }]}>
      <View style={styles.shadow} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint="light" style={[styles.bar, styles.glass]} accessibilityRole="tablist">
            {content}
          </BlurView>
        ) : (
          <View style={[styles.bar, styles.solid]} accessibilityRole="tablist">
            {content}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: layout.sidePadding, right: layout.sidePadding },
  shadow: {
    borderRadius: radius.lg + 8,
    backgroundColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  bar: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    padding: PAD,
    borderRadius: radius.lg + 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  glass: { backgroundColor: 'rgba(255,255,255,0.72)' },
  solid: { backgroundColor: colors.white },
  indicator: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    bottom: PAD,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(7,71,161,0.09)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: layout.tapTarget },
  label: { fontSize: 11, lineHeight: 14 },
});
