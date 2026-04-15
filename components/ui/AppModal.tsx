import {
  Modal, View, Pressable, StyleSheet,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated'
import { useEffect } from 'react'
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

// ─── Alert Modal (centered card) ──────────────────────────────────────────────

export function AlertModal({
  visible, title, message, buttons = [{ text: 'OK' }], onDismiss,
}: AlertModalProps) {
  const scale   = useSharedValue(0.92)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1,   { duration: 180 })
      scale.value   = withSpring(1,   { damping: 18, stiffness: 250 })
    } else {
      opacity.value = withTiming(0,   { duration: 140 })
      scale.value   = withTiming(0.92, { duration: 140 })
    }
  }, [visible])

  const cardStyle     = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }))
  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  function handleButton(btn: AlertButton) {
    onDismiss?.()
    btn.onPress?.()
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={s.alertBackdropWrap}>
        <Animated.View style={[s.backdrop, backdropStyle]} />
        <Pressable style={s.alertBackdropTouch} onPress={onDismiss} />
        <Animated.View style={[s.alertCard, cardStyle]}>
          <Text style={s.alertTitle}>{title}</Text>
          {!!message && <Text style={s.alertMessage}>{message}</Text>}
          <View style={[s.alertButtons, buttons.length === 1 && s.alertButtonsSingle]}>
            {buttons.map((btn, i) => (
              <Pressable
                key={i}
                onPress={() => handleButton(btn)}
                style={({ pressed }) => [
                  s.alertBtn,
                  buttons.length === 1 && s.alertBtnFull,
                  btn.style === 'cancel'      && s.alertBtnCancel,
                  btn.style === 'destructive' && s.alertBtnDestructive,
                  pressed && s.alertBtnPressed,
                ]}
              >
                <Text style={[
                  s.alertBtnText,
                  btn.style === 'cancel'      && s.alertBtnTextCancel,
                  btn.style === 'destructive' && s.alertBtnTextDestructive,
                ]}>
                  {btn.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

// ─── Action Sheet (slides from bottom) ────────────────────────────────────────

export function ActionSheet({ visible, title, options, onDismiss }: SheetModalProps) {
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

  const sheetStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const bkDropStyle  = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }))

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={s.sheetContainer}>
        <Animated.View style={[s.backdrop, bkDropStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <Animated.View style={[s.sheetPanel, sheetStyle]}>
          {!!title && <Text style={s.sheetTitle}>{title}</Text>}
          <View style={s.sheetOptions}>
            {options.map((opt, i) => (
              <Pressable
                key={i}
                onPress={() => { onDismiss(); opt.onPress?.() }}
                style={({ pressed }) => [
                  s.sheetOption,
                  i < options.length - 1 && s.sheetOptionBorder,
                  pressed && s.sheetOptionPressed,
                ]}
              >
                <Text style={[
                  s.sheetOptionText,
                  opt.style === 'destructive' && s.sheetOptionDestructive,
                ]}>
                  {opt.text}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [s.sheetCancel, pressed && s.sheetOptionPressed]}
          >
            <Text style={s.sheetCancelText}>Cancel</Text>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  alertBackdropWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  alertBackdropTouch: { ...StyleSheet.absoluteFillObject },
  alertCard: {
    width: '100%', backgroundColor: SURFACE, borderRadius: 20,
    padding: 24, gap: 8, borderWidth: 1, borderColor: BORDER,
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 16,
  },
  alertTitle:   { color: TEXT_PRIMARY,   fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 2 },
  alertMessage: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 20,    textAlign: 'center', marginBottom: 4 },
  alertButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  alertButtonsSingle: { flexDirection: 'column' },
  alertBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: BORDER,
  },
  alertBtnFull:        { flex: undefined, width: '100%' },
  alertBtnCancel:      { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.07)' },
  alertBtnDestructive: { backgroundColor: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.2)' },
  alertBtnPressed:     { opacity: 0.65 },
  alertBtnText:        { color: TEXT_PRIMARY,   fontSize: 15, fontWeight: '600' },
  alertBtnTextCancel:      { color: TEXT_SECONDARY },
  alertBtnTextDestructive: { color: ERROR },

  sheetContainer: { flex: 1, justifyContent: 'flex-end' },
  sheetPanel: {
    backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32,
    borderTopWidth: 1, borderColor: BORDER, gap: 8,
  },
  sheetTitle: {
    color: TEXT_SECONDARY, fontSize: 12, fontWeight: '500', textAlign: 'center',
    paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  sheetOptions: {
    backgroundColor: '#242424', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
  },
  sheetOption: { paddingVertical: 16, paddingHorizontal: 18, alignItems: 'center' },
  sheetOptionBorder:     { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  sheetOptionPressed:    { opacity: 0.6 },
  sheetOptionText:       { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '500' },
  sheetOptionDestructive:{ color: ERROR },
  sheetCancel: {
    backgroundColor: '#242424', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: BORDER,
  },
  sheetCancelText: { color: TEXT_SECONDARY, fontSize: 16, fontWeight: '600' },
})
