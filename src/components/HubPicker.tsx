import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Hub } from '../lib/types';
import { colors, layout, radius, space } from '../theme';
import { Chip } from './Chip';
import { Text } from './Text';

// A dropdown field. Tapping it opens a sheet with the hubs grouped by city.
// Hubs marked "coming soon" are shown but cannot be picked.
export function HubPicker({ hubs, value, onChange }: { hubs: Hub[]; value: string | null; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = hubs.find((h) => h.id === value);
  const cities = [...new Set(hubs.map((h) => h.city ?? 'Other'))];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected ? `Hub: ${selected.name}. Tap to change` : 'Choose a hub'}
        onPress={() => setOpen(true)}
        style={{
          minHeight: layout.inputHeight,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          paddingHorizontal: space.md,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.soft,
        }}
      >
        <Feather name="map-pin" size={18} color={colors.accentBlue} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: selected ? colors.ink : colors.muted }}>{selected ? selected.name : 'Choose a hub'}</Text>
          {selected?.area ? <Text variant="small">{selected.area}, {selected.city}</Text> : null}
        </View>
        <Feather name="chevron-down" size={20} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable accessibilityLabel="Close" onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(2,8,23,0.4)' }} />
        <View style={{ maxHeight: '75%', backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, paddingBottom: insets.bottom + space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: layout.sidePadding, paddingBottom: space.sm }}>
            <Text variant="h3">Choose a hub</Text>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} hitSlop={10} style={{ minHeight: layout.tapTarget, justifyContent: 'center' }}>
              <Text variant="bodySemi" style={{ color: colors.brand }}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: layout.sidePadding, gap: space.lg, paddingBottom: space.lg }}>
            {cities.map((city) => (
              <View key={city} style={{ gap: space.xs }}>
                <Text variant="tiny">{city.toUpperCase()}</Text>
                {hubs
                  .filter((h) => (h.city ?? 'Other') === city)
                  .map((h) => {
                    const on = value === h.id;
                    const isOpen = h.status === 'open';
                    return (
                      <Pressable
                        key={h.id}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on, disabled: !isOpen }}
                        disabled={!isOpen}
                        onPress={() => {
                          onChange(h.id);
                          setOpen(false);
                        }}
                        style={({ pressed }) => ({
                          minHeight: layout.tapTarget + 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: space.md,
                          paddingHorizontal: space.md,
                          borderRadius: radius.sm,
                          backgroundColor: on ? colors.soft : pressed ? colors.soft : colors.white,
                          opacity: isOpen ? 1 : 0.55,
                        })}
                      >
                        <View style={{ flex: 1 }}>
                          <Text variant="bodySemi">{h.name}</Text>
                          {h.area ? <Text variant="small">{h.area}</Text> : null}
                        </View>
                        {isOpen ? (on ? <Feather name="check" size={20} color={colors.brand} /> : null) : <Chip label="Coming soon" />}
                      </Pressable>
                    );
                  })}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
