/**
 * Typography system.
 *
 * By default the app uses the system font family.
 * To add custom fonts:
 *   1. Add .ttf files to assets/fonts/
 *   2. Load them with useFonts() in app/_layout.tsx
 *   3. Set the font names in the Fonts object below
 *
 * Example with Inter:
 *   regular: 'Inter-Regular',
 *   medium:  'Inter-Medium',
 *   semibold: 'Inter-SemiBold',
 *   bold: 'Inter-Bold',
 *   black: 'Inter-Black',
 */
export const Fonts = {
  regular:  undefined as string | undefined,   // 400
  medium:   undefined as string | undefined,   // 500
  semibold: undefined as string | undefined,   // 600
  bold:     undefined as string | undefined,   // 700
  black:    undefined as string | undefined,   // 800–900
}

/**
 * Map a fontWeight value to the matching font family name.
 * Returns undefined (system font) until custom fonts are set above.
 */
export function weightToFamily(weight?: string | number | null): string | undefined {
  switch (String(weight ?? '400')) {
    case '500':         return Fonts.medium
    case '600':         return Fonts.semibold
    case '700':
    case 'bold':        return Fonts.bold
    case '800':
    case '900':         return Fonts.black
    default:            return Fonts.regular
  }
}

/**
 * Type scale — consistent size/lineHeight pairs.
 * Use these instead of hardcoding px values.
 */
export const TypeScale = {
  xs:    { fontSize: 11, lineHeight: 16 },  // tiny label / badge
  sm:    { fontSize: 13, lineHeight: 18 },  // caption / hint
  base:  { fontSize: 15, lineHeight: 22 },  // body text
  lg:    { fontSize: 17, lineHeight: 24 },  // section title / button
  xl:    { fontSize: 20, lineHeight: 28 },  // card heading
  '2xl': { fontSize: 24, lineHeight: 32 },  // page heading
  '3xl': { fontSize: 30, lineHeight: 38 },  // hero heading
  '4xl': { fontSize: 36, lineHeight: 44 },  // display
} as const
