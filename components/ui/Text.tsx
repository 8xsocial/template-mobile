import { Text as RNText, StyleSheet, type TextProps } from 'react-native'
import { weightToFamily } from '@/lib/typography'

/**
 * Drop-in replacement for React Native's <Text>.
 *
 * Automatically maps the `fontWeight` style prop to the matching custom
 * fontFamily name so you don't have to set fontFamily manually everywhere.
 *
 * On Android, having both a custom fontFamily AND a fontWeight in the same
 * style causes it to look for a system variant of that font — which doesn't
 * exist for separately-loaded .ttf files — and silently falls back to the
 * system font. This component strips fontWeight and applies the equivalent
 * fontFamily instead, which fixes the issue.
 *
 * Usage: import { Text } from '@/components/ui/Text' — then use exactly like
 * React Native's built-in Text. All fontWeight values work as expected.
 */
export function Text({ style, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style) ?? {}
  const { fontWeight, fontFamily: explicitFamily, ...restFlat } = flat
  const fontFamily = explicitFamily ?? weightToFamily(fontWeight)

  return (
    <RNText
      style={[restFlat, { fontFamily, includeFontPadding: false }]}
      {...props}
    />
  )
}
