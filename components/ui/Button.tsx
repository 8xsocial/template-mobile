import { Pressable, StyleSheet, ActivityIndicator, type PressableProps, type ViewStyle } from 'react-native'
import { Text } from './Text'
import { ACCENT, ACCENT_DIM, ACCENT_BORDER, BG, SURFACE, BORDER, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'
import { LinearGradient } from 'expo-linear-gradient'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label:    string
  variant?: ButtonVariant
  size?:    ButtonSize
  loading?: boolean
  style?:   ViewStyle
  fullWidth?: boolean
}

const SIZE_STYLES: Record<ButtonSize, { height: number; borderRadius: number; paddingHorizontal: number; fontSize: number }> = {
  sm:  { height: 36, borderRadius: 10, paddingHorizontal: 16, fontSize: 13 },
  md:  { height: 48, borderRadius: 13, paddingHorizontal: 20, fontSize: 15 },
  lg:  { height: 56, borderRadius: 16, paddingHorizontal: 24, fontSize: 16 },
}

export function Button({
  label,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  style,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const sz      = SIZE_STYLES[size]
  const isDisabled = disabled || loading

  const containerStyle: ViewStyle = {
    height:          sz.height,
    borderRadius:    sz.borderRadius,
    paddingHorizontal: sz.paddingHorizontal,
    alignItems:      'center',
    justifyContent:  'center',
    alignSelf:       fullWidth ? 'stretch' : 'flex-start',
    opacity:         isDisabled ? 0.4 : 1,
    overflow:        'hidden',
    ...(variant === 'secondary' && {
      backgroundColor: ACCENT_DIM,
      borderWidth: 1,
      borderColor: ACCENT_BORDER,
    }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: BORDER,
    }),
    ...(variant === 'ghost' && {
      backgroundColor: 'transparent',
    }),
    ...(variant === 'destructive' && {
      backgroundColor: 'rgba(248,113,113,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(248,113,113,0.2)',
    }),
  }

  const textColor =
    variant === 'primary'     ? BG :
    variant === 'secondary'   ? ACCENT :
    variant === 'outline'     ? TEXT_PRIMARY :
    variant === 'ghost'       ? TEXT_SECONDARY :
    variant === 'destructive' ? '#f87171' :
    TEXT_PRIMARY

  return (
    <Pressable
      style={({ pressed }) => [
        containerStyle,
        pressed && !isDisabled && { opacity: 0.82 },
        style,
      ]}
      disabled={isDisabled}
      {...rest}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={[ACCENT, adjustBrightness(ACCENT, -20)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? BG : ACCENT}
        />
      ) : (
        <Text style={{ color: textColor, fontSize: sz.fontSize, fontWeight: '700' }}>
          {label}
        </Text>
      )}
    </Pressable>
  )
}

/** Darken a hex color by a given amount (0–255). Very simple utility. */
function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r   = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g   = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount))
  const b   = Math.max(0, Math.min(255, (num & 0xff) + amount))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}
