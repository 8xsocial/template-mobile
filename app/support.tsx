import { useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Linking } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
    BG,
    BORDER,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
    ACCENT,
} from '@/lib/theme'
import { supportFaq } from '@/lib/mockData'
import { APP_SUPPORT_EMAIL, APP_DOCS_URL } from '@/lib/constants'

export default function SupportScreen() {
    const insets = useSafeAreaInsets()
    const [openId, setOpenId] = useState<string | null>(supportFaq[0]?.id ?? null)

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
                </Pressable>
                <Text style={s.headerTitle}>Support</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 28 }]}
                showsVerticalScrollIndicator={false}
            >
                <Card style={s.heroCard}>
                    <Text style={s.heroTitle}>Need help with setup?</Text>
                    <Text style={s.heroSub}>
                        This template includes dummy flows by default. Use these support blocks as placeholders for your real team channels.
                    </Text>

                    <View style={s.contactRow}>
                        <Pressable onPress={() => Linking.openURL(`mailto:${APP_SUPPORT_EMAIL}`)} style={s.contactBtn}>
                            <Ionicons name="mail-outline" size={15} color={ACCENT} />
                            <Text style={s.contactText}>{APP_SUPPORT_EMAIL}</Text>
                        </Pressable>
                        <Pressable onPress={() => Linking.openURL(APP_DOCS_URL)} style={s.contactBtn}>
                            <Ionicons name="book-outline" size={15} color={ACCENT} />
                            <Text style={s.contactText}>Documentation</Text>
                        </Pressable>
                    </View>
                </Card>

                <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
                <Card compact style={s.faqCard}>
                    {supportFaq.map((item, index) => {
                        const open = openId === item.id
                        return (
                            <Pressable
                                key={item.id}
                                onPress={() => setOpenId(open ? null : item.id)}
                                style={[s.faqRow, index < supportFaq.length - 1 && s.faqDivider]}
                            >
                                <View style={s.faqTop}>
                                    <Text style={s.faqQuestion}>{item.question}</Text>
                                    <Ionicons
                                        name={open ? 'chevron-up' : 'chevron-down'}
                                        size={16}
                                        color={TEXT_TERTIARY}
                                    />
                                </View>
                                {open && <Text style={s.faqAnswer}>{item.answer}</Text>}
                            </Pressable>
                        )
                    })}
                </Card>
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
    headerTitle: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700' },
    body: { padding: 20, gap: 12 },
    heroCard: { gap: 7 },
    heroTitle: { fontSize: 17, fontWeight: '800', color: TEXT_PRIMARY },
    heroSub: { fontSize: 13, lineHeight: 19, color: TEXT_SECONDARY },
    contactRow: { marginTop: 6, gap: 8 },
    contactBtn: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingHorizontal: 11,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.04)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: { fontSize: 12.5, color: TEXT_PRIMARY },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    faqCard: { padding: 0, overflow: 'hidden' },
    faqRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
    faqDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: BORDER,
    },
    faqTop: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    faqQuestion: { flex: 1, color: TEXT_PRIMARY, fontSize: 14, fontWeight: '600' },
    faqAnswer: { color: TEXT_SECONDARY, fontSize: 12.5, lineHeight: 18, paddingRight: 16 },
})
