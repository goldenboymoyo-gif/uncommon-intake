import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, fonts, layout, radius, space } from '../theme';
import { Text } from './Text';

export type TabItem = { name: string; label: string; icon: keyof typeof Feather.glyphMap };

// Floating frosted glass pill. Ink icons; the active tab is a brand circle with a label beside it.
// It is fixed; only the screen content scrolls.
export function PillTabBar({ state, navigation, items }: BottomTabBarProps & { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) + space.xs }]}>
      <View style={styles.shadow}>
        <BlurView
          intensity={60}
          tint="light"
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={styles.pill}
          accessibilityRole="tablist"
        >
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
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (focused || event.defaultPrevented) return;
                  Haptics.selectionAsync();
                  navigation.navigate(route.name);
                }}
                style={styles.hit}
              >
                <Animated.View layout={LinearTransition.duration(180)} style={[styles.item, focused && styles.itemActive]}>
                  <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
                    <Feather name={item.icon} size={20} color={focused ? colors.white : colors.ink} />
                  </View>
                  {focused ? <Text style={styles.label}>{item.label}</Text> : null}
                </Animated.View>
              </Pressable>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shadow: {
    borderRadius: radius.pill,
    shadowColor: colors.brand,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: layout.tabBarHeight,
    padding: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  hit: { minHeight: layout.tapTarget, minWidth: layout.tapTarget + 8, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill },
  itemActive: { backgroundColor: 'rgba(7,71,161,0.10)', paddingRight: space.lg },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  iconCircleActive: { backgroundColor: colors.brand },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.brand, marginLeft: space.sm },
});
