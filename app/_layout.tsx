import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Stack, useNavigationContainerRef } from 'expo-router'
import * as Sentry from '@sentry/react-native'

const routingInstrumentation = Sentry.reactNavigationIntegration()

Sentry.init({
  dsn:         process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  environment: __DEV__ ? 'development' : 'production',
  enabled:     !__DEV__ && !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  integrations:[routingInstrumentation],
  tracesSampleRate: 0,
})

import { GestureHandlerRootView }   from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { SafeAreaProvider }         from 'react-native-safe-area-context'
import { StatusBar }                from 'expo-status-bar'
import { ThemeProvider, DarkTheme } from '@react-navigation/native'
import { PostHogProvider }          from 'posthog-react-native'
import { I18nextProvider }          from 'react-i18next'

import { supabase }                                            from '@/lib/supabase'
import { posthog, identify, resetIdentity }                    from '@/lib/analytics'
import { configureRevenueCat, loginRevenueCat, logoutRevenueCat } from '@/lib/purchases'
import { SubscriptionProvider }                                from '@/contexts/SubscriptionContext'
import i18n, { initI18n }                                      from '@/lib/i18n'
import OfflineBanner                                           from '@/components/OfflineBanner'
import OfflineOverlay                                          from '@/components/OfflineOverlay'
import { BG }                                                  from '@/lib/theme'

// ─── Error boundary ───────────────────────────────────────────────────────────
// React requires a class component to catch render errors — hooks cannot do this.

function ErrorFallback() {
  return (
    <View style={eb.container}>
      <Text style={eb.title}>Something went wrong</Text>
      <Text style={eb.subtitle}>Please close and reopen the app.</Text>
    </View>
  )
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info)
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
  }

  render() {
    if (this.state.hasError) return <ErrorFallback />
    return this.props.children
  }
}

const eb = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  title:    { color: '#fff',                    fontSize: 18, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.4)',   fontSize: 14, textAlign: 'center', lineHeight: 22 },
})

// ─── Theme ────────────────────────────────────────────────────────────────────

const customDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: BG },
}

// ─── Root layout ──────────────────────────────────────────────────────────────

function RootLayout() {
  const navigationRef = useNavigationContainerRef()

  // null = still checking; true/false = auth state known
  const [isAuthed,           setIsAuthed]           = useState<boolean | null>(null)
  // null = loading; false = not completed; true = completed
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [i18nReady,          setI18nReady]           = useState(false)

  useEffect(() => {
    initI18n().then(() => setI18nReady(true))
  }, [])

  useEffect(() => {
    if (navigationRef.current) {
      routingInstrumentation.registerNavigationContainer(navigationRef)
    }
  }, [navigationRef])

  useEffect(() => {
    // Configure RevenueCat once at startup, before any user is known
    configureRevenueCat()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthed(!!session)
      if (session?.user) {
        setOnboardingCompleted(session.user.user_metadata?.onboarding_completed === true)
        loginRevenueCat(session.user.id)
        identify(session.user.id, { email: session.user.email })
      } else {
        setOnboardingCompleted(null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthed(true)
        setOnboardingCompleted(session.user.user_metadata?.onboarding_completed === true)
        loginRevenueCat(session.user.id)
        identify(session.user.id, { email: session.user.email })
      }
      if (event === 'SIGNED_OUT') {
        setIsAuthed(false)
        setOnboardingCompleted(null)
        logoutRevenueCat()
        resetIdentity()
      }
      if (event === 'USER_UPDATED' && session?.user) {
        setOnboardingCompleted(session.user.user_metadata?.onboarding_completed === true)
      }
      // TOKEN_REFRESHED fires when refreshSession() is called
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setOnboardingCompleted(session.user.user_metadata?.onboarding_completed === true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show blank dark screen while session + i18n checks complete.
  // This prevents a flash of wrong content on launch.
  if (isAuthed === null || !i18nReady || (isAuthed === true && onboardingCompleted === null)) {
    return <View style={{ flex: 1, backgroundColor: BG }} />
  }

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <PostHogProvider client={posthog}>
          <SubscriptionProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={{ flex: 1, backgroundColor: BG }}>
                <BottomSheetModalProvider>
                  <StatusBar
                    style="light"
                    translucent={Platform.OS === 'android'}
                    backgroundColor={Platform.OS === 'android' ? BG : undefined}
                  />
                  <ThemeProvider value={customDarkTheme}>
                    <View style={{ flex: 1, backgroundColor: BG }}>
                      <Stack ref={navigationRef} screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: BG } }}>

                        {/* ── Unauthenticated screens ──────────────────────────────────
                        Accessible only when signed out. When isAuthed flips to true,
                        Stack.Protected removes these and Expo Router auto-redirects to
                        the first accessible authenticated screen. */}
                        <Stack.Protected guard={!isAuthed}>
                          <Stack.Screen name="index" />
                          <Stack.Screen name="(auth)" />
                        </Stack.Protected>

                        {/* ── Onboarding screens ───────────────────────────────────────
                        Shown when signed in but onboarding not yet completed. */}
                        <Stack.Protected guard={!!isAuthed && onboardingCompleted === false}>
                          <Stack.Screen name="(onboarding)" />
                        </Stack.Protected>

                        {/* ── Authenticated screens ────────────────────────────────────
                        Accessible only when signed in + onboarding done. */}
                        <Stack.Protected guard={!!isAuthed && onboardingCompleted === true}>
                          <Stack.Screen name="(tabs)" />
                          {/* TODO: Add more authenticated screens here */}
                        </Stack.Protected>

                        {/* ── Always-public screens — declared LAST so they don't become
                        the default redirect target when a protected group flips. ── */}
                        <Stack.Screen name="upgrade" />
                        <Stack.Screen name="privacy" />
                        <Stack.Screen name="terms" />
                      </Stack>
                      <OfflineBanner />
                      <OfflineOverlay />
                    </View>
                  </ThemeProvider>
                </BottomSheetModalProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </SubscriptionProvider>
        </PostHogProvider>
      </I18nextProvider>
    </ErrorBoundary>
  )
}

export default Sentry.wrap(RootLayout)
