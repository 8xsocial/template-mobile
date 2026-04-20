import { useMemo, useState } from 'react'
import {
    View,
    ScrollView,
    StyleSheet,
    Pressable,
    RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import TextInputField from '@/components/ui/TextInputField'
import {
    BG,
    BORDER,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import StatusBadge from '@/components/ui/StatusBadge'
import { statusLabel, type ItemStatus } from '@/lib/mockData'
import { useItems } from '@/hooks/useItems'

type FilterType = 'all' | ItemStatus

const FILTERS: Array<{ key: FilterType; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'archived', label: 'Archived' },
]

export default function ExploreScreen() {
    const insets = useSafeAreaInsets()
    const [refreshing, setRefreshing] = useState(false)
    const [query, setQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState<FilterType>('all')
    const queryClient = useQueryClient()

    const { data: allItems = [] } = useItems()

    const filtered = useMemo(() => {
        const byStatus = activeFilter === 'all'
            ? allItems
            : allItems.filter((item) => item.status === activeFilter)

        if (!query.trim()) return byStatus

        const q = query.trim().toLowerCase()
        return byStatus.filter((item) => {
            return (
                item.name.toLowerCase().includes(q)
                || item.owner.toLowerCase().includes(q)
                || item.summary.toLowerCase().includes(q)
            )
        })
    }, [activeFilter, query, allItems])

    const onRefresh = async () => {
        setRefreshing(true)
        await queryClient.invalidateQueries({ queryKey: ['items'] })
        setRefreshing(false)
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            showsVerticalScrollIndicator={false}
        >
            <View style={s.header}>
                <Text style={s.title}>Explore</Text>
                <Text style={s.subtitle}>Search and browse all items.</Text>
            </View>

            <TextInputField
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name, owner, or description"
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                {FILTERS.map((filter) => {
                    const active = filter.key === activeFilter
                    return (
                        <Pressable
                            key={filter.key}
                            onPress={() => setActiveFilter(filter.key)}
                            style={[s.filterChip, active && s.filterChipActive]}
                        >
                            <Text style={[s.filterText, active && s.filterTextActive]}>{filter.label}</Text>
                        </Pressable>
                    )
                })}
            </ScrollView>

            {filtered.length === 0 ? (
                <Card style={s.emptyCard}>
                    <Text style={s.emptyTitle}>No matches found</Text>
                    <Text style={s.emptySub}>Try another keyword or switch filters.</Text>
                </Card>
            ) : (
                filtered.map((item) => (
                    <Pressable
                        key={item.id}
                        onPress={() => router.push(`/detail/${item.id}`)}
                        style={({ pressed }) => [pressed && { opacity: 0.72 }]}
                    >
                        <Card style={s.itemCard}>
                            <View style={s.topRow}>
                                <Text style={s.itemName}>{item.name}</Text>
                                <StatusBadge status={item.status} label={statusLabel(item.status)} />
                            </View>

                            <Text style={s.ownerText}>Owner: {item.owner}</Text>
                            <Text style={s.summaryText}>{item.summary}</Text>

                            <View style={s.metaRow}>
                                <Text style={s.metaText}>Completion {item.completion}%</Text>
                                <Text style={s.metaText}>Health {item.health}</Text>
                                <Text style={s.metaText}>{item.activeUsers} active</Text>
                            </View>
                        </Card>
                    </Pressable>
                ))
            )}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 12 },
    header: { gap: 4, marginBottom: 2 },
    title: { fontSize: 24, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: TEXT_SECONDARY },
    filterRow: { gap: 8, paddingVertical: 4 },
    filterChip: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    filterChipActive: {
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderColor: 'rgba(255,255,255,0.25)',
    },
    filterText: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '600' },
    filterTextActive: { color: TEXT_PRIMARY },
    emptyCard: { alignItems: 'center', paddingVertical: 24, gap: 4, marginTop: 8 },
    emptyTitle: { fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
    emptySub: { fontSize: 13, color: TEXT_SECONDARY },
    itemCard: { gap: 6, paddingVertical: 13 },
    topRow: { flexDirection: 'row', gap: 8 },
    itemName: { flex: 1, fontSize: 15, fontWeight: '700', color: TEXT_PRIMARY },
    ownerText: { fontSize: 12, color: TEXT_TERTIARY },
    summaryText: { fontSize: 12.5, lineHeight: 18, color: TEXT_SECONDARY },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    metaText: { fontSize: 11, color: TEXT_TERTIARY },
})
