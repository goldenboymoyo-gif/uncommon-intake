import { Pressable, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, layout, radius, space } from '../theme';
import { Text } from './Text';

type Props = {
  options: string[];
  value: string | string[] | null | undefined;
  multiple?: boolean;
  onChange: (value: string | string[]) => void;
};

export function ChoiceList({ options, value, multiple, onChange }: Props) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <View style={{ gap: space.sm }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: on }}
            onPress={() => {
              if (!multiple) return onChange(opt);
              onChange(on ? selected.filter((s) => s !== opt) : [...selected, opt]);
            }}
            style={({ pressed }) => ({
              minHeight: layout.tapTarget + 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              paddingHorizontal: space.md,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: on ? colors.brand : colors.border,
              backgroundColor: on ? '#F3F6FC' : pressed ? colors.soft : colors.white,
            })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: multiple ? 4 : 11,
                borderWidth: 1.5,
                borderColor: on ? colors.brand : colors.muted,
                backgroundColor: on ? colors.brand : colors.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {on ? <Feather name="check" size={14} color={colors.white} /> : null}
            </View>
            <Text style={{ flex: 1 }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
