import PostHog from 'posthog-react-native'

const POSTHOG_KEY  = process.env.EXPO_PUBLIC_POSTHOG_KEY  ?? ''
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

export const posthog = new PostHog(POSTHOG_KEY, {
  host:             POSTHOG_HOST,
  persistence:      'memory',
  fetchRetryCount:  0, // don't retry on network failure — avoids noisy offline errors
  disabled:         !POSTHOG_KEY,
})

type TrackProperties = Parameters<(typeof posthog)['capture']>[1]

// 🔑 Add your app-specific event names here for type safety.
// All event names in one place makes it easy to audit what you're tracking.
type EventName =
  // Auth
  | 'login_started'
  | 'otp_sent'
  | 'login_success'
  | 'logout'
  // Onboarding
  | 'onboarding_started'
  | 'onboarding_completed'
  // Subscription
  | 'upgrade_page_viewed'
  | 'upgrade_cta_tapped'
  | 'purchase_success'
  | 'restore_purchases_tapped'
  | 'redeem_code_tapped'
  // Profile
  | 'profile_viewed'
  | 'profile_updated'
  // TODO: add your app-specific events here

/** Track an event. Failures are silently swallowed — analytics must never crash the app. */
export function track(event: EventName, properties?: TrackProperties) {
  try {
    posthog.capture(event, properties)
  } catch {
    // intentionally silent
  }
}

/** Identify the user in PostHog (call after login). */
export function identify(userId: string, properties?: Record<string, unknown>) {
  try {
    posthog.identify(userId, properties)
  } catch {
    // intentionally silent
  }
}

/** Reset the PostHog identity (call after logout). */
export function resetIdentity() {
  try {
    posthog.reset()
  } catch {
    // intentionally silent
  }
}
