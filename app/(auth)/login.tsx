/**
 * Login screen — OTP (passwordless email) authentication.
 *
 * Social login placeholders:
 *   Google and Apple buttons are included with placeholder handlers.
 *   To wire them up:
 *     1. Configure Google/Apple OAuth in your Supabase project → Auth → Providers
 *     2. Add a redirect URL (e.g. myapp://auth/callback)
 *     3. Install expo-web-browser and expo-auth-session
 *     4. Call supabase.auth.signInWithOAuth({ provider: 'google' }) in handleGoogleLogin
 *
 *   To remove a provider, simply delete the corresponding button.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  View, Pressable, StyleSheet, Dimensions,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  TextInput as RNTextInput, ScrollView, DeviceEventEmitter,
} from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Text } from '@/components/ui/Text'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import { ACCENT, ACCENT_DIM, ACCENT_BORDER, BG, SURFACE, BORDER, ERROR, ERROR_DIM, TEXT_SECONDARY } from '@/lib/theme'
import { APP_NAME, APP_SCHEME } from '@/lib/constants'
import { adjustBrightness } from '@/lib/utils'
import { Fonts } from '@/lib/typography'

// Required for OAuth session handling on Android
WebBrowser.maybeCompleteAuthSession()

// ─── Set to true during development to show a "Skip to Home" button ───────────
// Set to false before shipping to production.
const DEV_ALLOW_SKIP = __DEV__

// ─── Disposable email blocklist ───────────────────────────────────────────────
// Prevents throwaway emails from creating accounts.

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'trashmail.me', 'maildrop.cc',
  'mailnesia.com', 'discard.email', 'throwaway.email', 'getnada.com', 'fakeinbox.com',
  'getairmail.com', 'spam4.me', 'spamgourmet.com', 'dispostable.com', 'filzmail.com',
])

function normalizeEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase()
  const atIdx = trimmed.lastIndexOf('@')
  if (atIdx === -1) return trimmed
  const local = trimmed.slice(0, atIdx)
  const domain = trimmed.slice(atIdx + 1)
  const cleanLocal = local.split('+')[0]
  // Remove dots for Gmail addresses
  const gmailDomains = ['gmail.com', 'googlemail.com']
  const finalLocal = gmailDomains.includes(domain) ? cleanLocal.replace(/\./g, '') : cleanLocal
  return `${finalLocal}@${domain}`
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets()

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null)
  const [lockoutLeft, setLockoutLeft] = useState(0)

  const otpRefs = useRef<(RNTextInput | null)[]>([])
  const emailRef = useRef<RNTextInput>(null)

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Lockout countdown
  useEffect(() => {
    if (!lockoutEnd) return
    const tick = () => {
      const rem = Math.max(0, Math.ceil((lockoutEnd - Date.now()) / 1000))
      setLockoutLeft(rem)
      if (rem === 0) setLockoutEnd(null)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [lockoutEnd])

  const handleSendOtp = async () => {
    const normalized = normalizeEmail(email)
    if (!normalized || !normalized.includes('@') || !normalized.includes('.')) {
      setError('Enter a valid email address')
      return
    }
    const domain = normalized.split('@')[1]
    if (DISPOSABLE_DOMAINS.has(domain)) {
      setError('Temporary email addresses are not allowed.')
      return
    }
    setLoading(true); setError(null)
    track('login_started')
    const { error: err } = await supabase.auth.signInWithOtp({ email: normalized })
    setLoading(false)
    if (err) { setError(err.message); return }
    track('otp_sent')
    setStep('otp')
    setCooldown(60)
    setTimeout(() => otpRefs.current[0]?.focus(), 300)
  }

  const handleVerifyOtp = useCallback(async (code: string) => {
    if (code.length < 6) return
    if (lockoutEnd && Date.now() < lockoutEnd) {
      setError(`Too many attempts. Wait ${Math.ceil((lockoutEnd - Date.now()) / 60000)} minute(s).`)
      return
    }
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.verifyOtp({
      email: normalizeEmail(email),
      token: code,
      type: 'email',
    })
    setLoading(false)
    if (err) {
      const next = failedAttempts + 1
      setFailedAttempts(next)
      if (next >= 5) {
        setLockoutEnd(Date.now() + 15 * 60 * 1000)
        setError('Too many failed attempts. Please wait 15 minutes.')
      } else {
        setError(`Invalid code. ${5 - next} attempt${5 - next === 1 ? '' : 's'} left.`)
      }
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
      return
    }
    track('login_success')
    // _layout.tsx auth guard handles navigation automatically
  }, [email, lockoutEnd, failedAttempts])

  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    const code = next.join('')
    if (code.length === 6 && !next.includes('')) handleVerifyOtp(code)
  }

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp]
      next[index - 1] = ''
      setOtp(next)
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setLoading(true); setError(null)
    const { error: err } = await supabase.auth.signInWithOtp({ email: normalizeEmail(email) })
    setLoading(false)
    if (err) { setError(err.message); return }
    setCooldown(60)
    setOtp(['', '', '', '', '', ''])
    setTimeout(() => otpRefs.current[0]?.focus(), 50)
  }

  const goBack = () => {
    setStep('email'); setOtp(['', '', '', '', '', ''])
    setError(null); setFailedAttempts(0); setLockoutEnd(null)
    setTimeout(() => emailRef.current?.focus(), 150)
  }

  // ─── Dev skip — bypasses auth for testing UI flow ─────────────────────────────
  const handleDevSkip = () => {
    DeviceEventEmitter.emit('__dev_skip_auth__')
  }

  // ─── Social login handlers ───────────────────────────────────────────────────
  // Requires: Supabase → Auth → Providers → Google/Apple enabled
  // Requires: app.json scheme = 'myapp' (already set) so deep link works

  async function handleOAuthLogin(provider: 'google' | 'apple') {
    setLoading(true)
    setError(null)
    try {
      const redirectTo = `${APP_SCHEME}://auth/callback`
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      })
      if (err) throw err
      if (!data.url) throw new Error('No OAuth URL returned.')

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type === 'success') {
        const { error: sessionErr } = await supabase.auth.exchangeCodeForSession(result.url)
        if (sessionErr) throw sessionErr
        // _layout.tsx auth guard handles navigation automatically
      }
    } catch (e: any) {
      setError(e?.message ?? `${provider === 'google' ? 'Google' : 'Apple'} sign-in failed.`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => handleOAuthLogin('google')
  const handleAppleLogin  = () => handleOAuthLogin('apple')

  return (
    <View style={s.root}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={[s.backBtn, { top: insets.top + 14 }]} hitSlop={14}>
        <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
      </Pressable>

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[s.form, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.content}>
            {/* App badge */}
            <View style={s.appBadge}>
              <View style={s.appBadgeDot} />
              <Text style={s.appBadgeText}>{APP_NAME}</Text>
            </View>

            {/* Heading */}
            {step === 'email' ? (
              <View style={s.titleBlock}>
                <Text style={s.titleBold}>Welcome back</Text>
                <Text style={s.sub}>Enter your email — we'll send a one-time code.</Text>
              </View>
            ) : (
              <View style={s.titleBlock}>
                <Text style={s.titleBold}>Check your inbox</Text>
                <View style={s.emailPill}>
                  <Text style={s.emailPillText} numberOfLines={1}>
                    {normalizeEmail(email)}
                  </Text>
                </View>
                <Text style={s.sub}>Enter the 6-digit code we sent. Check spam if needed.</Text>
              </View>
            )}

            {/* ── Email step ── */}
            {step === 'email' && (
              <View style={s.stepWrap}>
                <View style={s.fieldGroup}>
                  <Text style={s.label}>EMAIL ADDRESS</Text>
                  <RNTextInput
                    ref={emailRef}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setError(null) }}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(255,255,255,0.18)"
                    style={[s.input, error ? s.inputErr : null]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSendOtp}
                    autoFocus
                  />
                </View>

                {error ? <ErrorBanner msg={error} /> : null}

                <Pressable
                  onPress={handleSendOtp}
                  disabled={loading || !email.trim()}
                  style={({ pressed }) => ({
                    opacity: (loading || !email.trim()) ? 0.4 : pressed ? 0.85 : 1,
                    borderRadius: 14, overflow: 'hidden',
                  })}
                >
                  <LinearGradient
                    colors={[ACCENT, adjustBrightness(ACCENT, -25)]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.btn}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.btnText}>Continue</Text>
                    }
                  </LinearGradient>
                </Pressable>

                {/* ─── Social logins ────────────────────── */}
                <View style={s.dividerRow}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>or continue with</Text>
                  <View style={s.dividerLine} />
                </View>

                <View style={s.socialRow}>
                  {/* Google */}
                  <Pressable
                    onPress={handleGoogleLogin}
                    style={({ pressed }) => [s.socialBtn, pressed && { opacity: 0.75 }]}
                  >
                    <View style={s.socialIcon}>
                      <Text style={{ fontSize: 15, fontWeight: '700' }}>G</Text>
                    </View>
                    <Text style={s.socialBtnText}>Google</Text>
                  </Pressable>

                  {/* Apple */}
                  <Pressable
                    onPress={handleAppleLogin}
                    style={({ pressed }) => [s.socialBtn, pressed && { opacity: 0.75 }]}
                  >
                    <Ionicons name="logo-apple" size={17} color="#fff" />
                    <Text style={s.socialBtnText}>Apple</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ── OTP step ── */}
            {step === 'otp' && (
              <View style={s.stepWrap}>
                <View style={s.otpRow}>
                  {otp.map((digit, i) => (
                    <RNTextInput
                      key={i}
                      ref={(r) => { otpRefs.current[i] = r }}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, i)}
                      onKeyPress={(e) => handleOtpKeyPress(e, i)}
                      style={[s.otpBox, digit ? [s.otpBoxOn, { borderColor: ACCENT, backgroundColor: ACCENT_DIM }] : null]}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      caretHidden
                      editable={!loading}
                    />
                  ))}
                </View>

                {error ? <ErrorBanner msg={error} /> : null}

                {lockoutEnd ? (
                  <Animated.View entering={FadeIn.duration(180)} style={s.lockoutBox}>
                    <Text style={s.lockoutText}>
                      Locked · {Math.floor(lockoutLeft / 60)}:{String(lockoutLeft % 60).padStart(2, '0')} remaining
                    </Text>
                  </Animated.View>
                ) : null}

                <Pressable
                  onPress={() => handleVerifyOtp(otp.join(''))}
                  disabled={loading || otp.includes('') || !!lockoutEnd}
                  style={({ pressed }) => ({
                    opacity: (loading || otp.includes('') || !!lockoutEnd) ? 0.4 : pressed ? 0.85 : 1,
                    borderRadius: 14, overflow: 'hidden',
                  })}
                >
                  <LinearGradient
                    colors={[ACCENT, adjustBrightness(ACCENT, -25)]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={s.btn}
                  >
                    {loading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={s.btnText}>Verify Code</Text>
                    }
                  </LinearGradient>
                </Pressable>

                <View style={s.otpMeta}>
                  <Pressable onPress={handleResend} disabled={cooldown > 0} hitSlop={10}>
                    <Text style={[s.resendText, cooldown > 0 && { color: 'rgba(255,255,255,0.22)' }]}>
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                    </Text>
                  </Pressable>
                  <Text style={{ color: 'rgba(255,255,255,0.2)' }}>·</Text>
                  <Pressable onPress={goBack} hitSlop={10}>
                    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Change email</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* ─── Dev skip button (only visible in __DEV__) ─────────────────── */}
            {DEV_ALLOW_SKIP && (
              <Pressable
                onPress={handleDevSkip}
                style={({ pressed }) => [s.devSkipBtn, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="play-skip-forward-outline" size={14} color={TEXT_SECONDARY} />
                <Text style={s.devSkipText}>Skip to Home (dev only)</Text>
              </Pressable>
            )}

            {/* Legal */}
            <View style={s.legalRow}>
              <Pressable onPress={() => router.push('/privacy')} hitSlop={8}>
                <Text style={s.legalLink}>Privacy Policy</Text>
              </Pressable>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>·</Text>
              <Pressable onPress={() => router.push('/terms')} hitSlop={8}>
                <Text style={s.legalLink}>Terms of Service</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <Animated.View entering={FadeIn.duration(180)} style={[s.errorBox, { backgroundColor: ERROR_DIM, borderColor: `${ERROR}33` }]}>
      <Text style={{ color: ERROR, fontSize: 12.5 }}>{msg}</Text>
    </Animated.View>
  )
}

const { width: SW } = Dimensions.get('window')

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  backBtn: { position: 'absolute', left: 16, zIndex: 20 },
  kav: { flex: 1 },
  form: { flexGrow: 1, paddingHorizontal: 24 },
  content: { flex: 1, gap: 0 },

  // App badge
  appBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 28,
  },
  appBadgeDot: {
    width: 6, height: 6, borderRadius: 999, backgroundColor: ACCENT,
  },
  appBadgeText: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.2,
  },

  // Title
  titleBlock: { gap: 10, marginBottom: 28 },
  titleBold: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.8, lineHeight: 36 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.40)', lineHeight: 20 },

  emailPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: ACCENT_DIM, borderColor: ACCENT_BORDER,
  },
  emailPillText: { fontSize: 13, fontWeight: '500', color: ACCENT },

  // Steps wrapper
  stepWrap: { gap: 16 },

  // Fields
  fieldGroup: { gap: 8 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' },
  input: {
    height: 52, backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: BORDER, borderRadius: 14,
    paddingHorizontal: 16, color: '#fff', fontSize: 16,
    fontFamily: Fonts.regular,
  },
  inputErr: { borderColor: `${ERROR}66` },

  // Buttons
  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Social buttons
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: BORDER },
  dividerText: { color: 'rgba(255,255,255,0.25)', fontSize: 12 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50, backgroundColor: SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
  },
  socialIcon: {
    width: 22, height: 22, borderRadius: 5, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  socialBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Error
  errorBox: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },

  // Lockout
  lockoutBox: {
    backgroundColor: 'rgba(251,191,36,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.2)',
    paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center',
  },
  lockoutText: { color: '#fbbf24', fontSize: 13, fontWeight: '600' },

  // OTP
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  otpBox: {
    flex: 1,
    height: 56, backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: BORDER, borderRadius: 12,
    color: '#fff', fontSize: 22, textAlign: 'center',
    textAlignVertical: 'center', paddingVertical: 0, paddingHorizontal: 0,
    includeFontPadding: false,
    fontFamily: Fonts.regular,
  },
  otpBoxOn: { color: ACCENT },
  otpMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  resendText: { color: ACCENT, fontSize: 13, fontWeight: '500' },

  // Dev skip
  devSkipBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    alignSelf: 'center',
    marginTop: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  devSkipText: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '500' },

  // Legal
  legalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 'auto', paddingTop: 24 },
  legalLink: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecorationLine: 'underline' },
})
