import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, fonts, layout, radius, space } from '../theme';
import { Text } from './Text';

export type TabItem = { name: string; label: string; icon: keyof typeof Feather.glyphMap };

// Floating dark pill. White icons, the active tab is a white circle with a brand icon
// and a small label beside it. It is fixed; only the screen content scrolls.
export function PillTabBar({ state, navigateToTab, items }: BottomTabBarProps & { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) + space.xs }]}>
      <View style={styles.pill} accessibilityRole="tablist">
        {items.map((item) => {
          const route = state.routes.find((r) => r.name === item.name);
          if (!route) return null;
          const focused = item.name === activeName;
          return (
            <Pressable
              key={item.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={item.label}
              onPress={() => {
                if (focused) return;
                Haptics.selectionAsync();
                navigateToTab(route.key);
              }}
              style={styles.hit}
            >
              <Animated.View layout={LinearTransition.duration(180)} style={[styles.item, focused && styles.itemActive]}>
                <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                  <Feather name={item.icon} size={20} color={focused ? colors.brand : colors.white} />
                </View>
                {focused ? <Text style={styles.label}>{item.label}</Text> : null}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    padding: 6,
    height: layout.tabBarHeight,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  hit: { minHeight: layout.tapTarget, minWidth: layout.tapTarget + 8, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill },
  itemActive: { backgroundColor: colors.white, paddingRight: space.lg },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  iconCircleActive: { backgroundColor: colors.white },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.brand, marginLeft: -space.xs },
});
