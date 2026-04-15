/**
 * Home tab — replace this placeholder with your app's main content.
 *
 * Common patterns to build here:
 *   - Feed / list of items from Supabase
 *   - Dashboard with stats
 *   - Search + filter interface
 *   - Map view
 *   - Camera / scanner
 *
 * Data fetching pattern (Supabase):
 *   const [items, setItems] = useState([])
 *   useEffect(() => {
 *     supabase.from('items').select('*').then(({ data }) => setItems(data ?? []))
 *   }, [])
 */
import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { supabase } from '@/lib/supabase'
import { ACCENT, BG, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()

  const [userName,    setUserName]    = useState('')
  const [isPremium,   setIsPremium]   = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there')
    }
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUser()
    // TODO: re-fetch your data here
    setRefreshing(false)
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting header */}
      <View style={s.header}>
        <Text style={s.greeting}>{greeting}{userName ? `, ${userName}` : ''}!</Text>
        <Text style={s.subGreeting}>
          {/* 🎨 BRAND: Change this subtitle */}
          Welcome to your app.
        </Text>
      </View>

      {/* ── Placeholder content ─────────────────────────────────────────────── */}
      {/* TODO: Replace the cards below with your actual app content */}

      <Text style={s.sectionTitle}>Quick Actions</Text>
      <View style={s.cardGrid}>
        <Card style={s.halfCard}>
          <Text style={{ fontSize: 28 }}>📊</Text>
          <Text style={s.cardTitle}>Analytics</Text>
          <Text style={s.cardSub}>View your stats</Text>
        </Card>
        <Card style={s.halfCard}>
          <Text style={{ fontSize: 28 }}>⚡</Text>
          <Text style={s.cardTitle}>Activity</Text>
          <Text style={s.cardSub}>Recent events</Text>
        </Card>
      </View>

      <Text style={s.sectionTitle}>Getting Started</Text>
      <Card>
        <Text style={s.cardTitle}>Build your first feature</Text>
        <Text style={[s.cardSub, { marginTop: 6, lineHeight: 20 }]}>
          This is the home tab. Add your app-specific content here.{'\n'}
          Pull to refresh, add lists, charts, or whatever your app needs.
        </Text>
      </Card>

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:   { paddingHorizontal: 20, gap: 16 },
  header:      { gap: 4, marginBottom: 8 },
  greeting:    { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  subGreeting: { fontSize: 14, color: TEXT_SECONDARY },
  sectionTitle:{ fontSize: 13, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.5, textTransform: 'uppercase' },
  cardGrid:    { flexDirection: 'row', gap: 12 },
  halfCard:    { flex: 1, gap: 6 },
  cardTitle:   { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 4 },
  cardSub:     { fontSize: 13, color: TEXT_SECONDARY },
})
