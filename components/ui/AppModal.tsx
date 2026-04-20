import {
  Modal, View, Pressable, StyleSheet,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from './Text'
import { SURFACE, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, ERROR } from '@/lib/theme'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertButton = {
  text:    string
  onPress?: () => void
  style?:  'default' | 'cancel' | 'destructive'
}

export type SheetOption = {
  text:    string
  onPress?: () => void
  style?:  'default' | 'destructive'
}

type AlertModalProps = {
  visible:   boolean
  title:     string
  message?:  string
  buttons?:  AlertButton[]
  onDismiss?: () => void
}

type SheetModalProps = {
  visible:   boolean
  title?:    string
  options:   SheetOption[]
  onDismiss: () => void
}

// ─── Alert Modal (slides from bottom) ─────────────────────────────────────────

export function AlertModal({
  visible, title, message, buttons = [{ text: 'OK' }], onDismiss,
}: AlertModalProps) {
  const insets = useSafeAreaInsets()
  const translateY      = useSharedValue(500)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1,   { duration: 200 })
      translateY.value      = withSpring(0,   { damping: 22, stiffness: 260, overshootClamping: true })
    } else {
      backdropOpacity.value = withTiming(0,   { duration: 180 })
      translateY.value      = withTiming(500, { duration: 220 })
    }
  }, [visible])

  const sheetStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const bkDropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }))

  function handleButton(btn: AlertButton) {
    onDismiss?.()
    btn.onPress?.()
  }

  const cancelBtn     = buttons.find(b => b.style === 'cancel')
  const actionButtons = buttons.filter(b => b.style !== 'cancel')

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={s.container}>
        <Animated.View style={[s.backdrop, bkDropStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <Animated.View style={[s.sheet, sheetStyle, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.handle} />

          <View style={s.content}>
            <Text style={s.title}>{title}</Text>
            {!!message && <Text style={s.message}>{message}</Text>}
          </View>

          <View style={s.buttonGroup}>
            {actionButtons.map((btn, i) => (
              <Pressable
                key={i}
                onPress={() => handleButton(btn)}
                style={({ pressed }) => [
                  s.btn,
                  btn.style === 'destructive' && s.btnDestructive,
                  pressed && s.btnPressed,
                ]}
              >
                <Text style={[
                  s.btnText,
                  btn.style === 'destructive' && s.btnTextDestructive,
                ]}>
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>

          {cancelBtn && (
            <Pressable
              onPress={() => handleButton(cancelBtn)}
              style={({ pressed }) => [s.cancelBtn, pressed && s.btnPressed]}
            >
              <Text style={s.cancelText}>{cancelBtn.text}</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── Action Sheet (slides from bottom, option list) ───────────────────────────

export function ActionSheet({ visible, title, options, onDismiss }: SheetModalProps) {
  const insets          = useSafeAreaInsets()
  const translateY      = useSharedValue(300)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1,   { duration: 200 })
      translateY.value      = withSpring(0,   { damping: 20, stiffness: 220 })
    } else {
      backdropOpacity.value = withTiming(0,   { duration: 180 })
      translateY.value      = withTiming(300, { duration: 200 })
    }
  }, [visible])

  const sheetStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const bkDropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }))

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={s.container}>
        <Animated.View style={[s.backdrop, bkDropStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <Animated.View style={[s.sheet, sheetStyle, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.handle} />
          {!!title && <Text style={s.sheetTitle}>{title}</Text>}
          <View style={s.sheetOptions}>
            {options.map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => { onDismiss(); opt.onPress?.() }}
                style={({ pressed }) => [
                  s.sheetOption,
                  i < options.length - 1 && s.sheetOptionBorder,
                  pressed && s.btnPressed,
                ]}
              >
                <Text style={[
                  s.sheetOptionText,
                  opt.style === 'destructive' && s.btnTextDestructive,
                ]}>
                  {opt.text}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [s.cancelBtn, pressed && s.btnPressed]}
          >
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 4,
  },
  content: {
    paddingHorizontal: 4,
    paddingVertical: 10,
    gap: 6,
  },
  title:   { color: TEXT_PRIMARY,   fontSize: 18, fontWeight: '700', textAlign: 'center' },
  message: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 21,    textAlign: 'center' },

  buttonGroup: { gap: 8 },
  btn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: BORDER,
  },
  btnDestructive: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: 'rgba(248,113,113,0.22)',
  },
  btnPressed:           { opacity: 0.6 },
  btnText:              { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '600' },
  btnTextDestructive:   { color: ERROR },

  cancelBtn: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cancelText: { color: TEXT_SECONDARY, fontSize: 16, fontWeight: '600' },

  // ActionSheet-specific
  sheetTitle: {
    color: TEXT_SECONDARY, fontSize: 12, fontWeight: '500', textAlign: 'center',
    paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  sheetOptions: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  sheetOption:       { paddingVertical: 16, paddingHorizontal: 18, alignItems: 'center' },
  sheetOptionBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  sheetOptionText:   { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '500' },
})
