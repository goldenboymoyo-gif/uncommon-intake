import { Children, ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { layout, space } from '../theme';

// One column on phones, two on tablets.
export function Grid({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const columns = width >= layout.tabletBreakpoint ? 2 : 1;
  if (columns === 1) return <View style={{ gap: space.md }}>{children}</View>;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
      {Children.toArray(children).map((child, i) => (
        <View key={i} style={{ width: `${(100 - 3) / 2}%` }}>
          {child}
        </View>
      ))}
    </View>
  );
}
