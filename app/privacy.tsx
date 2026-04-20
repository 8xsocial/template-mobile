import { ScrollView, StyleSheet, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { BG, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

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
                <Text style={s.updated}>Last updated: {new Date().toLocaleDateString()}</Text>

                <Text style={s.heading}>Overview</Text>
                <Text style={s.paragraph}>
                    This template application is provided for demonstration purposes. Data shown across the app can be mock data,
                    sample analytics, or developer-provided environment values.
                </Text>

                <Text style={s.heading}>Data We May Process</Text>
                <Text style={s.paragraph}>
                    Depending on how you configure this template, your production app may process account identifiers,
                    product usage events, subscription status, and support inquiries.
                </Text>

                <Text style={s.heading}>How Data Is Used</Text>
                <Text style={s.paragraph}>
                    Typical use cases include account authentication, feature personalization, billing state checks,
                    and improving product quality through aggregate analytics.
                </Text>

                <Text style={s.heading}>Third-Party Services</Text>
                <Text style={s.paragraph}>
                    This starter may integrate with providers like authentication backends, subscription platforms,
                    and analytics services. Review each provider's privacy policy before publishing.
                </Text>

                <Text style={s.heading}>Your Responsibility Before Launch</Text>
                <Text style={s.paragraph}>
                    Replace this document with your legal policy, verify regional compliance requirements,
                    and keep your final policy URL available inside app settings.
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
