import { useEffect, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { useNetworkStatus } from '@/lib/useNetworkStatus'
import { SUCCESS } from '@/lib/theme'

const BANNER_HEIGHT = 52

/**
 * Slides down from the top of the screen when the device goes offline
 * mid-session, then slides back up when connectivity is restored.
 *
 * This only handles mid-session disconnects. OfflineOverlay handles the
 * case where the app launches without connectivity.
 */
export default function OfflineBanner() {
  const insets   = useSafeAreaInsets()
  const isOnline = useNetworkStatus()

  const wasOffline        = useRef(false)
  const showingBackOnline = useRef(false)

  const translateY       = useSharedValue(-(BANNER_HEIGHT + insets.top + 8))
  const backOnlineOpacity = useSharedValue(0)
  const iconPulse        = useSharedValue(1)

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current        = true
      showingBackOnline.current = false
      // Pulse icon while offline
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1,   { duration: 900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
      // Slide banner in
      translateY.value      = withTiming(0,  { duration: 380, easing: Easing.out(Easing.cubic) })
      backOnlineOpacity.value = 0
    } else if (wasOffline.current) {
      // Just came back online — show success state for 2s then hide
      showingBackOnline.current = true
      iconPulse.value       = withTiming(1, { duration: 200 })
      backOnlineOpacity.value = withTiming(1, { duration: 200 })
      const timer = setTimeout(() => {
        translateY.value = withTiming(
          -(BANNER_HEIGHT + insets.top + 8),
          { duration: 380, easing: Easing.in(Easing.cubic) }
        )
        backOnlineOpacity.value = withTiming(0, { duration: 200 })
        wasOffline.current = false
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  const bannerStyle      = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const iconStyle        = useAnimatedStyle(() => ({ opacity: iconPulse.value }))
  const offlineRowStyle  = useAnimatedStyle(() => ({ opacity: 1 - backOnlineOpacity.value }))
  const backOnlineStyle  = useAnimatedStyle(() => ({
    opacity:         backOnlineOpacity.value,
    position:        'absolute',
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
  }))

  const totalHeight = BANNER_HEIGHT + insets.top

  return (
    <Animated.View style={[s.banner, { height: totalHeight, paddingTop: insets.top }, bannerStyle]}>
      <View style={s.content}>
        {/* Offline state */}
        <Animated.View style={[s.row, offlineRowStyle]}>
          <Animated.View style={iconStyle}>
            <Ionicons name="wifi-outline" size={16} color="rgba(255,255,255,0.55)" />
          </Animated.View>
          <View style={s.textWrap}>
            <Text style={s.title}>No internet connection</Text>
            <Text style={s.sub}>Check your connection and try again.</Text>
          </View>
        </Animated.View>

        {/* Back online state */}
        <Animated.View style={backOnlineStyle}>
          <Ionicons name="checkmark-circle" size={16} color={SUCCESS} />
          <Text style={[s.title, { color: SUCCESS }]}>You're back online</Text>
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: 'rgba(14,14,14,0.97)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    zIndex: 9999,
    justifyContent: 'flex-end',
    paddingBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 8,
    elevation: 12,
  },
  content: {
    height: BANNER_HEIGHT, paddingHorizontal: 20, justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textWrap: { flex: 1, gap: 1 },
  title: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  sub:   { color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 15 },
})
