import { View, StyleSheet, type ViewProps } from 'react-native'
import { SURFACE, BORDER } from '@/lib/theme'

interface CardProps extends ViewProps {
  /** Tighter padding */
  compact?: boolean
}

/**
 * Generic container card.
 * Use as a surface for list items, form sections, info panels, etc.
 */
export function Card({ compact, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        compact ? styles.compact : styles.normal,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor:  SURFACE,
    borderRadius:     16,
    borderWidth:      StyleSheet.hairlineWidth,
    borderColor:      BORDER,
    // Subtle elevation
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.25,
    shadowRadius:     6,
    elevation:        3,
  },
  normal:  { padding: 16 },
  compact: { padding: 10 },
})
