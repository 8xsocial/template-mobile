/**
 * Privacy Policy screen.
 * TODO: Replace the placeholder text with your actual privacy policy,
 * or swap to a WebView pointing at your hosted policy URL:
 *
 *   import { WebView } from 'react-native-webview'
 *   <WebView source={{ uri: 'https://yourapp.com/privacy' }} />
 */
import { ScrollView, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { BG, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Text style={s.title}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.section}>Last updated: {new Date().toLocaleDateString()}</Text>
        <Text style={s.paragraph}>
          {/* TODO: Replace with your actual privacy policy */}
          This is a placeholder privacy policy. Replace this text with your actual
          privacy policy before publishing your app to the App Store or Google Play.
          {'\n\n'}
          Your privacy policy should explain what data you collect, how you use it,
          and how users can request deletion.
        </Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title:     { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '600' },
  body:      { padding: 24, gap: 16 },
  section:   { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  paragraph: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 22 },
})
