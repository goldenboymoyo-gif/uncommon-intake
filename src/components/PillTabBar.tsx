import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, fonts, layout, radius, space } from '../theme';
import { Text } from './Text';

export type TabItem = { name: string; label: string; icon: keyof typeof Feather.glyphMap };

// Floating frosted glass bar. Every tab shows an icon with its name underneath;
// the active tab is brand blue with a soft highlight. Only the screen content scrolls.
export function PillTabBar({ state, navigation, items }: BottomTabBarProps & { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) }]}>
      <View style={styles.shadow}>
        <BlurView
          intensity={70}
          tint="light"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={styles.bar}
          accessibilityRole="tablist"
        >
          {items.map((item) => {
            const route = state.routes.find((r) => r.name === item.name);
            if (!route) return null;
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
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <Feather name={item.icon} size={21} color={tint} />
                </View>
                <Text style={[styles.label, { color: tint, fontFamily: focused ? fonts.bodyBold : fonts.bodySemi }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: layout.sidePadding, right: layout.sidePadding },
  shadow: {
    borderRadius: radius.lg + 8,
    shadowColor: colors.brand,
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bar: {
    flexDirection: 'row',
    height: layout.tabBarHeight + 6,
    paddingHorizontal: space.xs,
    borderRadius: radius.lg + 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: layout.tapTarget },
  iconWrap: { width: 48, height: 30, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: 'rgba(7,71,161,0.12)' },
  label: { fontSize: 11, lineHeight: 14 },
});
