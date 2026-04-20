import { useMemo, useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
    ACCENT,
    BG,
    BORDER,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { useNotifications } from '@/hooks/useNotifications'
import type { NotificationItem } from '@/lib/mockData'

type TabType = 'all' | 'unread'

export default function ActivityScreen() {
    const insets = useSafeAreaInsets()
    const [activeTab, setActiveTab] = useState<TabType>('all')
    const { data: remoteItems = [] } = useNotifications()
    const [items, setItems] = useState<NotificationItem[]>(remoteItems)

    // Sync local state when remote data arrives
    useEffect(() => {
        if (remoteItems.length > 0) setItems(remoteItems)
    }, [remoteItems])

    const visibleItems = useMemo(() => {
        if (activeTab === 'all') return items
        return items.filter((item) => !item.read)
    }, [activeTab, items])

    const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items])

    const markAllRead = () => {
        setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    }

    const toggleRead = (id: string) => {
        setItems((prev) => prev.map((item) => item.id === id ? { ...item, read: !item.read } : item))
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={s.header}>
                <View>
                    <Text style={s.title}>Activity</Text>
                    <Text style={s.subtitle}>Product updates, team events, and billing alerts.</Text>
                </View>

                <Pressable onPress={markAllRead} style={({ pressed }) => [s.markAllBtn, pressed && { opacity: 0.75 }]}
                >
                    <Text style={s.markAllText}>Mark all read</Text>
                </Pressable>
            </View>

            <View style={s.segmentRow}>
                <Pressable
                    onPress={() => setActiveTab('all')}
                    style={[s.segmentItem, activeTab === 'all' && s.segmentItemActive]}
                >
                    <Text style={[s.segmentText, activeTab === 'all' && s.segmentTextActive]}>All ({items.length})</Text>
                </Pressable>
                <Pressable
                    onPress={() => setActiveTab('unread')}
                    style={[s.segmentItem, activeTab === 'unread' && s.segmentItemActive]}
                >
                    <Text style={[s.segmentText, activeTab === 'unread' && s.segmentTextActive]}>Unread ({unreadCount})</Text>
                </Pressable>
            </View>

            {visibleItems.length === 0 ? (
                <Card style={s.emptyCard}>
                    <Text style={s.emptyTitle}>You are all caught up</Text>
                    <Text style={s.emptySub}>New alerts and updates will appear here.</Text>
                </Card>
            ) : (
                <Card style={s.listCard}>
                    {visibleItems.map((item, index) => (
                        <Pressable
                            key={item.id}
                            onPress={() => toggleRead(item.id)}
                            style={[s.row, index < visibleItems.length - 1 && s.rowDivider]}
                        >
                            <View style={[s.iconWrap, item.read && s.iconWrapMuted]}>
                                <Ionicons name={categoryIcon(item.category)} size={14} color={item.read ? TEXT_SECONDARY : ACCENT} />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={[s.rowTitle, item.read && s.rowTitleMuted]}>{item.title}</Text>
                                <Text style={s.rowBody}>{item.body}</Text>
                                <Text style={s.rowTime}>{item.timeAgo}</Text>
                            </View>

                            {!item.read && <View style={s.unreadDot} />}
                        </Pressable>
                    ))}
                </Card>
            )}
        </ScrollView>
    )
}

function categoryIcon(category: 'billing' | 'system' | 'product' | 'team') {
    switch (category) {
        case 'billing':
            return 'wallet-outline'
        case 'system':
            return 'server-outline'
        case 'product':
            return 'sparkles-outline'
        case 'team':
            return 'people-outline'
        default:
            return 'ellipse-outline'
    }
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
    title: { fontSize: 24, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
    subtitle: { marginTop: 3, fontSize: 13, color: TEXT_SECONDARY },
    markAllBtn: {
        borderWidth: 1,
        borderColor: BORDER,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 9,
    },
    markAllText: { fontSize: 12, color: TEXT_PRIMARY, fontWeight: '600' },
    segmentRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 11,
        padding: 3,
    },
    segmentItem: {
        flex: 1,
        borderRadius: 8,
        alignItems: 'center',
        paddingVertical: 7,
    },
    segmentItemActive: {
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    segmentText: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '600' },
    segmentTextActive: { color: TEXT_PRIMARY },
    emptyCard: { alignItems: 'center', gap: 5, paddingVertical: 26 },
    emptyTitle: { fontSize: 15, color: TEXT_PRIMARY, fontWeight: '700' },
    emptySub: { fontSize: 13, color: TEXT_SECONDARY },
    listCard: { paddingVertical: 2, paddingHorizontal: 0 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 11 },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
    iconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    iconWrapMuted: { backgroundColor: 'rgba(255,255,255,0.05)' },
    rowTitle: { fontSize: 13.5, color: TEXT_PRIMARY, fontWeight: '700' },
    rowTitleMuted: { color: TEXT_SECONDARY },
    rowBody: { marginTop: 1, fontSize: 12.5, lineHeight: 18, color: TEXT_SECONDARY },
    rowTime: { marginTop: 5, fontSize: 11, color: TEXT_TERTIARY },
    unreadDot: {
        width: 7,
        height: 7,
        borderRadius: 999,
        marginTop: 6,
        backgroundColor: ACCENT,
    },
})
