/**
 * Onboarding screen — runs once after first login.
 *
 * This template has a single onboarding step: collect the user's display name.
 * The step is optional (users can skip).
 *
 * To add more onboarding steps:
 *   1. Create app/(onboarding)/step2.tsx, step3.tsx, etc.
 *   2. Update this file to navigate to the next step instead of completing onboarding.
 *   3. Complete onboarding only in the last step.
 */
import { useState } from 'react'
import {
  View, Pressable, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import { ACCENT, ACCENT_DIM, ACCENT_BORDER, BG, SURFACE, BORDER } from '@/lib/theme'
import { LinearGradient } from 'expo-linear-gradient'

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()

  const [displayName, setDisplayName] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  track('onboarding_started')

  async function complete(name?: string) {
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        full_name: name?.trim() || undefined,
      },
    })

    if (err) {
      setLoading(false)
      setError('Could not save. Please try again.')
      return
    }

    // Also upsert the profiles table
    if (name?.trim()) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .upsert({ id: user.id, display_name: name.trim() })
      }
    }

    track('onboarding_completed', { skipped: !name?.trim() })
    setLoading(false)
    // _layout.tsx auth guard detects onboarding_completed = true and routes to (tabs)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.content}>
          {/* Header */}
          <View style={s.header}>
            <View style={[s.iconBadge, { backgroundColor: ACCENT_DIM, borderColor: ACCENT_BORDER }]}>
              <Text style={{ fontSize: 28 }}>👋</Text>
            </View>
            <Text style={s.title}>What should we call you?</Text>
            <Text style={s.subtitle}>
              This is optional — you can always change it later in your profile.
            </Text>
          </View>

          {/* Name input */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>YOUR NAME</Text>
            <TextInput
              value={displayName}
              onChangeText={(v) => { setDisplayName(v); setError(null) }}
              placeholder="Enter your name"
              placeholderTextColor="rgba(255,255,255,0.18)"
              style={s.input}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => complete(displayName)}
              autoFocus
            />
          </View>

          {error ? (
            <Animated.View entering={FadeIn.duration(180)} style={s.errorBox}>
              <Text style={{ color: '#f87171', fontSize: 13 }}>{error}</Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Bottom buttons */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={s.buttons}>
          <Pressable
            onPress={() => complete(displayName)}
            disabled={loading}
            style={({ pressed }) => ({
              opacity: loading ? 0.5 : pressed ? 0.85 : 1,
              borderRadius: 16, overflow: 'hidden',
            })}
          >
            <LinearGradient
              colors={[ACCENT, adjustBrightness(ACCENT, -25)]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.primaryBtn}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>
                    {displayName.trim() ? 'Continue  →' : 'Get Started  →'}
                  </Text>
              }
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => complete()} disabled={loading} style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Skip for now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, gap: 24, justifyContent: 'center' },
  header: { gap: 12, alignItems: 'center', paddingBottom: 8 },
  iconBadge: {
    width: 80, height: 80, borderRadius: 24,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.38)', textAlign: 'center', lineHeight: 21, maxWidth: 280 },

  fieldGroup: { gap: 8 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' },
  input: {
    height: 52, backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: BORDER, borderRadius: 14,
    paddingHorizontal: 18, color: '#fff', fontSize: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  buttons:    { gap: 12 },
  primaryBtn: { height: 56, alignItems: 'center', justifyContent: 'center' },
})
