import { useFeatureFlag as usePostHogFlag } from 'posthog-react-native'
import { isPostHogEnabled } from '@/lib/analytics'

/**
 * Returns true/false for a PostHog feature flag.
 * Always returns the defaultValue when PostHog is not configured.
 *
 * Usage:
 *   const showNewFlow = useFeatureFlag('new-onboarding-flow')
 *
 * Create flags in PostHog → Feature Flags.
 */
export function useFeatureFlag(flag: string, defaultValue = false): boolean {
    const value = usePostHogFlag(flag)
    if (!isPostHogEnabled) return defaultValue
    return value === true || value === 'true'
}
