import { useEffect, useState } from 'react'
import {
  View, ScrollView, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { AlertModal } from '@/components/ui/AppModal'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import { logoutRevenueCat } from '@/lib/purchases'
import { ACCENT, ACCENT_DIM, ACCENT_BORDER, BG, SURFACE, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { getInitials } from '@/lib/utils'

type Profile = {
  displayName: string
  email: string
  createdAt: string
  avatarUrl: string | null
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { isPremium, customerInfo } = useSubscription()

  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [signOutModal, setSignOutModal] = useState(false)

  useEffect(() => {
    track('profile_viewed')
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setProfile({
        displayName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User',
        email:       user.email ?? '',
        createdAt:   user.created_at,
        avatarUrl:   user.user_metadata?.avatar_url ?? null,
      })
    }
    setLoading(false)
  }

  async function handleSignOut() {
    track('logout')
    await logoutRevenueCat()
    await supabase.auth.signOut()
    // _layout.tsx auth guard routes to landing automatically
  }

  const initials  = profile ? getInitials(profile.displayName) : '?'
  const expiryMs  = customerInfo?.entitlements.active['premium']?.expirationDate
  const expiryDate = expiryMs
    ? new Date(expiryMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const willRenew = customerInfo?.entitlements.active['premium']?.willRenew ?? false

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Avatar + name ────────────────────────────────────────────────── */}
      {loading ? (
        <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
      ) : (
        <View style={s.profileHeader}>
          <View style={s.avatarWrap}>
            <LinearGradient
              colors={[`${ACCENT}88`, `${ACCENT}22`]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={s.avatarInitials}>{initials}</Text>
            {isPremium && (
              <View style={[s.premiumBadge, { backgroundColor: ACCENT }]}>
                <Ionicons name="sparkles" size={9} color="#fff" />
              </View>
            )}
          </View>
          <Text style={s.displayName}>{profile?.displayName}</Text>
          <Text style={s.email}>{profile?.email}</Text>
        </View>
      )}

      {/* ── Subscription status ──────────────────────────────────────────── */}
      {isPremium ? (
        <Card style={[s.proCard, { borderColor: ACCENT_BORDER }]}>
          <LinearGradient
            colors={[`${ACCENT}14`, 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.proRow}>
            <View style={[s.proBadge, { backgroundColor: ACCENT }]}>
              <Ionicons name="sparkles" size={12} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.proTitle, { color: ACCENT }]}>Pro Active</Text>
              {expiryDate && (
                <Text style={s.proSub}>
                  {willRenew ? `Renews ${expiryDate}` : `Expires ${expiryDate}`}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => router.push('/upgrade')}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: ACCENT_BORDER }}
            >
              <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>Manage</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <Pressable onPress={() => router.push('/upgrade')} style={s.upgradeBtn}>
          <LinearGradient
            colors={[ACCENT, adjustBrightness(ACCENT, -25)]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Ionicons name="sparkles" size={16} color="#fff" />
          <View>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
              {/* 🎨 BRAND: Customize this CTA text */}
              Upgrade to Pro
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              Unlock all features
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" style={{ marginLeft: 'auto' }} />
        </Pressable>
      )}

      {/* ── Settings section ─────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>Settings</Text>
      <Card compact style={s.settingsCard}>
        {/* TODO: Add app-specific settings here */}

        <SettingsRow
          icon="notifications-outline"
          label="Notifications"
          onPress={() => { /* TODO: Notifications settings */ }}
        />
        <SettingsRow
          icon="language-outline"
          label="Language"
          onPress={() => { /* TODO: Language picker */ }}
          last
        />
      </Card>

      {/* ── Support section ──────────────────────────────────────────────── */}
      <Text style={s.sectionTitle}>Support</Text>
      <Card compact style={s.settingsCard}>
        <SettingsRow
          icon="document-text-outline"
          label="Privacy Policy"
          onPress={() => router.push('/privacy')}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Terms of Service"
          onPress={() => router.push('/terms')}
          last
        />
      </Card>

      {/* ── Account actions ──────────────────────────────────────────────── */}
      <Pressable
        onPress={() => setSignOutModal(true)}
        style={({ pressed }) => [s.signOutBtn, pressed && { opacity: 0.7 }]}
      >
        <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.45)" />
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: '500' }}>Sign out</Text>
      </Pressable>

      {/* Sign out confirmation */}
      <AlertModal
        visible={signOutModal}
        title="Sign out"
        message="You'll be signed out of your account."
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setSignOutModal(false) },
          { text: 'Sign out', style: 'destructive', onPress: handleSignOut },
        ]}
        onDismiss={() => setSignOutModal(false)}
      />
    </ScrollView>
  )
}

function SettingsRow({ icon, label, value, onPress, last }: {
  icon:    string
  label:   string
  value?:  string
  onPress: () => void
  last?:   boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.settingsRow, !last && s.settingsRowBorder, pressed && { opacity: 0.65 }]}
    >
      <Ionicons name={icon as any} size={18} color={TEXT_SECONDARY} />
      <Text style={s.settingsLabel}>{label}</Text>
      {value && <Text style={s.settingsValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={15} color={TEXT_TERTIARY} style={{ marginLeft: 'auto' }} />
    </Pressable>
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
  container: { paddingHorizontal: 20, gap: 14 },

  profileHeader: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#fff', zIndex: 1 },
  premiumBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: BG,
  },
  displayName: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.3 },
  email:       { fontSize: 14, color: TEXT_SECONDARY },

  proCard: {
    overflow: 'hidden', borderWidth: 1.5, padding: 14,
  },
  proRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proBadge: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  proTitle: { fontSize: 15, fontWeight: '700' },
  proSub:   { fontSize: 12, color: TEXT_SECONDARY, marginTop: 1 },

  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 64, paddingHorizontal: 18, borderRadius: 16,
    overflow: 'hidden', position: 'relative',
  },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: TEXT_TERTIARY,
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4, marginBottom: -4,
  },
  settingsCard: { padding: 0, overflow: 'hidden' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  settingsLabel: { fontSize: 15, color: TEXT_PRIMARY, flex: 1 },
  settingsValue: { fontSize: 14, color: TEXT_SECONDARY },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14,
  },
})
