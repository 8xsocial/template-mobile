/**
 * Typography system.
 *
 * These names must match the font keys loaded in app/_layout.tsx.
 */
export const Fonts = {
  regular: 'Inter_400Regular',   // 400
  medium: 'Inter_500Medium',     // 500
  semibold: 'Inter_600SemiBold', // 600
  bold: 'Inter_700Bold',         // 700
  black: 'Inter_800ExtraBold',   // 800–900
}

/**
 * Map a fontWeight value to the matching font family name.
 */
export function weightToFamily(weight?: string | number | null): string | undefined {
  switch (String(weight ?? '400')) {
    case '500': return Fonts.medium
    case '600': return Fonts.semibold
    case '700':
    case 'bold': return Fonts.bold
    case '800':
    case '900': return Fonts.black
    default: return Fonts.regular
  }
}

/**
 * Type scale — consistent size/lineHeight pairs.
 * Use these instead of hardcoding px values.
 */
export const TypeScale = {
  xs: { fontSize: 11, lineHeight: 16 },  // tiny label / badge
  sm: { fontSize: 13, lineHeight: 18 },  // caption / hint
  base: { fontSize: 15, lineHeight: 22 },  // body text
  lg: { fontSize: 17, lineHeight: 24 },  // section title / button
  xl: { fontSize: 20, lineHeight: 28 },  // card heading
  '2xl': { fontSize: 24, lineHeight: 32 },  // page heading
  '3xl': { fontSize: 30, lineHeight: 38 },  // hero heading
  '4xl': { fontSize: 36, lineHeight: 44 },  // display
} as const
