import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { Hub } from '../lib/types';
import { colors, layout, radius, space } from '../theme';
import { Chip } from './Chip';
import { Text } from './Text';

// Hubs grouped by city. Hubs that are "coming soon" are shown but cannot be picked.
export function HubPicker({ hubs, value, onChange }: { hubs: Hub[]; value: string | null; onChange: (id: string) => void }) {
  const cities = [...new Set(hubs.map((h) => h.city ?? 'Other'))];
  return (
    <View style={{ gap: space.lg }}>
      {cities.map((city) => (
        <View key={city} style={{ gap: space.sm }}>
          <Text variant="tiny">{city.toUpperCase()}</Text>
          {hubs
            .filter((h) => (h.city ?? 'Other') === city)
            .map((h) => {
              const on = value === h.id;
              const open = h.status === 'open';
              return (
                <Pressable
                  key={h.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, disabled: !open }}
                  accessibilityLabel={`${h.name}${h.area ? `, ${h.area}` : ''}${open ? '' : ', coming soon'}`}
                  disabled={!open}
                  onPress={() => onChange(h.id)}
                  style={({ pressed }) => ({
                    minHeight: layout.tapTarget + 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm,
                    borderRadius: radius.sm,
                    borderWidth: on ? 2 : 1,
                    borderColor: on ? colors.brand : colors.border,
                    backgroundColor: pressed ? colors.soft : colors.white,
                    opacity: open ? 1 : 0.55,
                  })}
                >
                  <Feather name="map-pin" size={18} color={on ? colors.brand : colors.accentBlue} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySemi">{h.name}</Text>
                    {h.area ? <Text variant="small">{h.area}</Text> : null}
                  </View>
                  {open ? (on ? <Feather name="check-circle" size={22} color={colors.brand} /> : null) : <Chip label="Coming soon" />}
                </Pressable>
              );
            })}
        </View>
      ))}
    </View>
  );
}
