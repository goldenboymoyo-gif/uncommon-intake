import { View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme';

// Strong colours for the white icon. The light theme accents become their deeper version here.
const deeper: Record<string, string> = {
  [colors.accentOrange]: '#EE8A1F',
  [colors.accentBlue]: '#1F7CE0',
  [colors.accentMint]: '#12A386',
  [colors.accentRose]: '#E5566B',
};

/** Colours to pick from when a list of tiles needs one each. */
export const tileColors = ['#2FA84F', '#7C5CE0', '#1F7CE0', '#E0A21F', '#12A386', '#EE7A2F', '#0747A1', '#E5566B'];

// A rounded, colourful square with a white icon and a soft shine on top.
export function IconTile({ icon, color, size = 44 }: { icon: keyof typeof Feather.glyphMap; color: string; size?: number }) {
  const bg = deeper[color] ?? color;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: bg,
        shadowOpacity: 0.35,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: size / 2, backgroundColor: 'rgba(255,255,255,0.18)' }} />
      <Feather name={icon} size={size * 0.5} color={colors.white} />
    </View>
  );
}
