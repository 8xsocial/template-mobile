import { ScrollView, StyleSheet, View, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { BG, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

export default function TermsScreen() {
    const insets = useSafeAreaInsets()

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
                </Pressable>
                <Text style={s.title}>Terms of Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={s.updated}>Last updated: {new Date().toLocaleDateString()}</Text>

                <Text style={s.heading}>Use of the Template</Text>
                <Text style={s.paragraph}>
                    This project is distributed as starter software. You are responsible for customizing business logic,
                    legal content, and service configurations before publishing to production environments.
                </Text>

                <Text style={s.heading}>Accounts and Access</Text>
                <Text style={s.paragraph}>
                    If authentication is enabled, users are responsible for maintaining the security of their login methods
                    and for activity performed under their account.
                </Text>

                <Text style={s.heading}>Subscriptions</Text>
                <Text style={s.paragraph}>
                    Any billing and entitlement behavior depends on your configured payment provider. Ensure your pricing,
                    cancellation terms, and renewal terms are clearly disclosed in your final app copy.
                </Text>

                <Text style={s.heading}>Service Availability</Text>
                <Text style={s.paragraph}>
                    Template components are provided without uptime guarantees. Integrations may be unavailable due to
                    network conditions, external providers, or platform maintenance windows.
                </Text>

                <Text style={s.heading}>Liability and Compliance</Text>
                <Text style={s.paragraph}>
                    Replace this document with jurisdiction-appropriate legal terms reviewed by qualified counsel.
                    This sample text is informational and not legal advice.
                </Text>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    title: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700' },
    body: { padding: 24, gap: 10 },
    updated: { color: TEXT_TERTIARY, fontSize: 12, marginBottom: 4 },
    heading: { color: TEXT_PRIMARY, fontSize: 14.5, fontWeight: '700', marginTop: 5 },
    paragraph: { color: TEXT_SECONDARY, fontSize: 13.5, lineHeight: 21 },
})
