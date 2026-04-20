import PostHog from 'posthog-react-native'

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? ''
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

/** True when a valid PostHog key is configured. */
export const isPostHogEnabled = !!POSTHOG_KEY

// Only create the client when a key is present.
// Passing an empty string to PostHog() can trigger network errors or console warnings.
export const posthog: PostHog | null = isPostHogEnabled
  ? new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      persistence: 'memory',
      fetchRetryCount: 0, // don't retry on network failure — avoids noisy offline errors
    })
  : null

type TrackProperties = Parameters<PostHog['capture']>[1]
type IdentifyProperties = Parameters<PostHog['identify']>[1]

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
  // Navigation
  | 'screen_viewed'
  // Profile
  | 'profile_viewed'
  | 'profile_updated'
// TODO: add your app-specific events here

/** Track an event. No-ops silently when PostHog is unconfigured. */
export function track(event: EventName, properties?: TrackProperties) {
  if (!posthog) return
  try {
    posthog.capture(event, properties)
  } catch {
    // intentionally silent
  }
}

/** Identify the user in PostHog (call after login). */
export function identify(userId: string, properties?: IdentifyProperties) {
  if (!posthog) return
  try {
    posthog.identify(userId, properties)
  } catch {
    // intentionally silent
  }
}

/** Reset the PostHog identity (call after logout). */
export function resetIdentity() {
  if (!posthog) return
  try {
    posthog.reset()
  } catch {
    // intentionally silent
  }
}
