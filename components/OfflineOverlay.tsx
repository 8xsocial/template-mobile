import { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
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
import { ACCENT, BG } from '@/lib/theme'
import NetInfo from '@react-native-community/netinfo'

/**
 * Full-screen overlay shown when the app launches without connectivity.
 * Once the user has been online at least once this session, the overlay
 * never re-shows — OfflineBanner handles mid-session drops.
 */
export default function OfflineOverlay() {
  const insets   = useSafeAreaInsets()
  const isOnline = useNetworkStatus()

  const hasEverBeenOnline = useRef(false)
  const [visible,  setVisible]  = useState(false)
  const [checking, setChecking] = useState(false)

  const overlayOpacity = useSharedValue(0)
  const iconPulse      = useSharedValue(0.35)
  const iconScale      = useSharedValue(1)

  useEffect(() => {
    if (isOnline) {
      hasEverBeenOnline.current = true
      if (visible) {
        overlayOpacity.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
        setTimeout(() => setVisible(false), 380)
      }
    } else if (!hasEverBeenOnline.current) {
      setVisible(true)
      overlayOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) })
      iconPulse.value = withRepeat(
        withSequence(
          withTiming(1,    { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 1100, easing: Easing.inOut(Easing.ease) })
        ),
        -1, false
      )
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
          withTiming(1,    { duration: 1100, easing: Easing.inOut(Easing.ease) })
        ),
        -1, false
      )
    }
  }, [isOnline])

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }))
  const iconStyle    = useAnimatedStyle(() => ({
    opacity:   iconPulse.value,
    transform: [{ scale: iconScale.value }],
  }))

  const handleRetry = async () => {
    setChecking(true)
    const state = await NetInfo.fetch()
    setChecking(false)
    if (state.isConnected) {
      hasEverBeenOnline.current = true
      overlayOpacity.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) })
      setTimeout(() => setVisible(false), 380)
    }
  }

  if (!visible) return null

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, s.overlay, overlayStyle]}>
      <View style={[s.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0 }}>
          <View style={s.iconWrap}>
            <View style={s.iconRing} />
            <Animated.View style={iconStyle}>
              <Ionicons name="wifi-outline" size={48} color="rgba(255,255,255,0.18)" />
              <View style={s.iconSlash} />
            </Animated.View>
          </View>

          <Text style={s.headline}>No internet connection</Text>
          <Text style={s.sub}>Check your Wi-Fi or mobile data and try again.</Text>

          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [s.retryBtn, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}
            disabled={checking}
          >
            {checking
              ? <ActivityIndicator size="small" color={BG} />
              : <Text style={s.retryText}>Try again</Text>
            }
          </Pressable>
        </View>
      </View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(10,10,10,0.98)', zIndex: 10000 },
  content: { flex: 1, paddingHorizontal: 32 },
  iconWrap: {
    width: 96, height: 96,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28, position: 'relative',
  },
  iconRing: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  iconSlash: {
    position: 'absolute', top: '50%', left: '10%', width: '80%', height: 2,
    backgroundColor: 'rgba(255,80,80,0.55)',
    transform: [{ rotate: '-35deg' }, { translateY: -1 }],
    borderRadius: 1,
  },
  headline: {
    fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.88)',
    letterSpacing: -0.4, textAlign: 'center', marginBottom: 8,
  },
  sub: {
    fontSize: 14, color: 'rgba(255,255,255,0.38)', textAlign: 'center',
    lineHeight: 20, marginBottom: 36,
  },
  retryBtn: {
    height: 46, paddingHorizontal: 40, borderRadius: 23,
    backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center', minWidth: 140,
  },
  retryText: { fontSize: 15, fontWeight: '700', color: BG, letterSpacing: 0.1 },
})
