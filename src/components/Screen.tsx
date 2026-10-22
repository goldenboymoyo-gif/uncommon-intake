import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, space } from '../theme';

type Props = {
  children: ReactNode;
  /** True on tab screens, so content clears the floating tab bar. */
  withTabBar?: boolean;
  /** Fixed area under the scroll content, for the main action button. */
  footer?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  /** Centre short content (like sign in forms) in the space instead of leaving a gap at the bottom. */
  centered?: boolean;
};

// Only the content scrolls. Header, footer and tab bar stay fixed.
export function Screen({ children, withTabBar, footer, refreshing, onRefresh, contentStyle, centered }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = withTabBar ? layout.tabBarClearance + insets.bottom : footer ? space.lg : insets.bottom + space.xl;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          { flexGrow: 1, paddingHorizontal: layout.sidePadding, paddingTop: space.sm, paddingBottom: bottom, gap: space.lg },
          centered && { justifyContent: 'center' },
          contentStyle,
        ]}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.brand} /> : undefined
        }
      >
        {children}
      </ScrollView>
      {footer ? (
        <View
          style={{
            paddingHorizontal: layout.sidePadding,
            paddingTop: space.md,
            paddingBottom: insets.bottom + space.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.white,
            gap: space.sm,
          }}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
