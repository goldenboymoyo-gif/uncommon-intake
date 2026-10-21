// All design tokens live here. Screens and components import from this file only.

export const colors = {
  brand: '#0747A1',
  brandDark: '#05357A',
  ink: '#020817',
  muted: '#64748B',
  soft: '#F1F5F9',
  border: '#E2E8F0',
  white: '#FFFFFF',
  success: '#1D7C50',
  successBg: '#EBFAF3',
  warning: '#BA7008',
  warningBg: '#FEF5E1',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  // Icon accents only. Never use for text or buttons.
  accentOrange: '#FFB050',
  accentBlue: '#0090FF',
  accentMint: '#50E0C0',
  accentRose: '#FF8080',
} as const;

// Heading font falls back to Outfit until Chillax font files are added to assets/fonts.
export const fonts = {
  heading: 'Outfit_600SemiBold',
  headingBold: 'Outfit_700Bold',
  body: 'NunitoSans_400Regular',
  bodySemi: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
} as const;

export const type = {
  h1: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34, color: colors.ink },
  h2: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.ink },
  h3: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.ink },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
  smallSemi: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.ink },
  tiny: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, color: colors.muted },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, lg: 16, pill: 999 } as const;

export const layout = {
  sidePadding: 20,
  tapTarget: 44,
  buttonHeight: 48,
  inputHeight: 48,
  tabBarHeight: 64,
  // Space the scroll content leaves at the bottom so the floating tab bar never covers it.
  tabBarClearance: 104,
  tabletBreakpoint: 768,
} as const;

export const theme = { colors, fonts, type, space, radius, layout };
export default theme;
