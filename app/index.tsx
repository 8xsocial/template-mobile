/**
 * Public landing screen (shown to unauthenticated users).
 * Replace this with your app's actual landing / onboarding intro.
 */
import { useEffect } from 'react'
import { View, Pressable, StyleSheet, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/Text'
import { ACCENT, ACCENT_DIM, BG } from '@/lib/theme'
import { LinearGradient } from 'expo-linear-gradient'

const { width: SW, height: SH } = Dimensions.get('window')

export default function LandingScreen() {
  const insets = useSafeAreaInsets()

  // Entrance animations
  const logoScale    = useSharedValue(0.7)
  const logoOpacity  = useSharedValue(0)
  const titleY       = useSharedValue(24)
  const titleOpacity = useSharedValue(0)
  const taglineOpacity = useSharedValue(0)
  const btnOpacity   = useSharedValue(0)

  // Ambient orb float
  const orb1Y = useSharedValue(0)
  const orb2Y = useSharedValue(0)

  useEffect(() => {
    logoScale.value    = withSpring(1, { damping: 14, stiffness: 120 })
    logoOpacity.value  = withTiming(1, { duration: 500 })

    titleY.value       = withDelay(250, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }))
    titleOpacity.value = withDelay(250, withTiming(1, { duration: 600 }))

    taglineOpacity.value = withDelay(450, withTiming(1, { duration: 600 }))
    btnOpacity.value     = withDelay(750, withTiming(1, { duration: 500 }))

    // Gentle floating orbs
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,   { duration: 3200, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    )
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(16, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,  { duration: 2800, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    )
  }, [])

  const logoStyle    = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }], opacity: logoOpacity.value }))
  const titleStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: titleY.value }], opacity: titleOpacity.value }))
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }))
  const btnStyle     = useAnimatedStyle(() => ({ opacity: btnOpacity.value }))
  const orb1Style    = useAnimatedStyle(() => ({ transform: [{ translateY: orb1Y.value }] }))
  const orb2Style    = useAnimatedStyle(() => ({ transform: [{ translateY: orb2Y.value }] }))

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Ambient orbs */}
      <Animated.View style={[s.orb1, orb1Style]} />
      <Animated.View style={[s.orb2, orb2Style]} />

      {/* Main content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        {/* App icon / logo */}
        <Animated.View style={[logoStyle, { marginBottom: 40 }]}>
          <View style={[s.iconContainer, { backgroundColor: ACCENT_DIM, borderColor: `${ACCENT}44` }]}>
            {/* TODO: Replace with your app icon <Image source={require('../assets/icon.png')} ... /> */}
            <Text style={{ fontSize: 40 }}>✦</Text>
          </View>
        </Animated.View>

        {/* App name */}
        <Animated.View style={[titleStyle, { alignItems: 'center' }]}>
          <Text style={s.appName}>
            {/* 🎨 BRAND: Change "MyApp" to your app name */}
            MyApp
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[taglineStyle, { alignItems: 'center', marginTop: 12 }]}>
          <Text style={s.tagline}>
            {/* 🎨 BRAND: Change this to your tagline */}
            Your app tagline here.{'\n'}Make it compelling.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View style={[btnStyle, { paddingHorizontal: 24, paddingBottom: insets.bottom + 32, gap: 12 }]}>
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, borderRadius: 16, overflow: 'hidden' })}
        >
          <LinearGradient
            colors={[ACCENT, adjustBrightness(ACCENT, -25)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.primaryBtn}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 }}>
              Get Started  →
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={s.legal}>
          By continuing you agree to our{' '}
          <Text onPress={() => router.push('/terms')}   style={s.legalLink}>Terms</Text>
          {' '}and{' '}
          <Text onPress={() => router.push('/privacy')} style={s.legalLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  )
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r   = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g   = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount))
  const b   = Math.max(0, Math.min(255, (num & 0xff) + amount))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

const s = StyleSheet.create({
  orb1: {
    position: 'absolute', top: SH * 0.1, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: `${ACCENT}12`,
  },
  orb2: {
    position: 'absolute', bottom: SH * 0.2, left: -100,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: `${ACCENT}08`,
  },
  iconContainer: {
    width: 100, height: 100, borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  appName: {
    fontSize: 52, fontWeight: '900', color: '#ffffff',
    letterSpacing: -2, lineHeight: 56, textAlign: 'center',
  },
  tagline: {
    fontSize: 17, fontWeight: '400', color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', lineHeight: 26, maxWidth: 280,
  },
  primaryBtn: {
    height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  legal: { fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 17 },
  legalLink: { color: 'rgba(255,255,255,0.4)', textDecorationLine: 'underline' },
})
