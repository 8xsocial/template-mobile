import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
    BG,
    BORDER,
    SUCCESS,
    WARNING,
    ERROR,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
    ACCENT,
} from '@/lib/theme'
import StatusBadge from '@/components/ui/StatusBadge'
import { statusLabel, type ItemStatus, type TaskItem } from '@/lib/mockData'
import { useItem, useItemTasks } from '@/hooks/useItems'

export default function DetailScreen() {
    const insets = useSafeAreaInsets()
    const { id } = useLocalSearchParams<{ id: string }>()

    const { data: item, isLoading } = useItem(id)
    const { data: tasks = [] } = useItemTasks(id)

    if (isLoading) {
        return (
            <View style={[s.centered, { backgroundColor: BG }]}>
                <ActivityIndicator color={ACCENT} />
            </View>
        )
    }

    if (!item) {
        return (
            <View style={[s.centered, { backgroundColor: BG }]}>
                <Text style={s.notFoundTitle}>Item not found</Text>
                <Pressable onPress={() => router.back()} style={s.notFoundBtn}>
                    <Text style={s.notFoundBtnText}>Go back</Text>
                </Pressable>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
                </Pressable>
                <Text style={s.headerTitle} numberOfLines={1}>{item.name}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 28 }]}
                showsVerticalScrollIndicator={false}
            >
                <Card style={s.summaryCard}>
                    <View style={s.summaryTop}>
                        <StatusBadge status={item.status} label={statusLabel(item.status)} />
                        <Text style={s.updatedText}>Updated {item.updatedAt}</Text>
                    </View>

                    <Text style={s.summaryText}>{item.summary}</Text>

                    <View style={s.metricsRow}>
                        <MetricItem label="Completion" value={`${item.completion}%`} />
                        <MetricItem label="Health" value={`${item.health}`} />
                        <MetricItem label="Active users" value={`${item.activeUsers}`} />
                    </View>
                </Card>

                <Text style={s.sectionTitle}>Tasks</Text>
                <Card compact style={s.listCard}>
                    {tasks.map((task, index) => (
                        <View key={task.id} style={[s.taskRow, index < tasks.length - 1 && s.taskDivider]}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.taskTitle}>{task.title}</Text>
                                <Text style={s.taskSub}>{task.state} · Due {task.dueDate}</Text>
                            </View>
                            <View style={[s.priorityPill, priorityStyle(task)]}>
                                <Text style={s.priorityText}>{task.priority}</Text>
                            </View>
                        </View>
                    ))}
                </Card>
            </ScrollView>
        </View>
    )
}

function MetricItem({ label, value }: { label: string; value: string }) {
    return (
        <View style={s.metricItem}>
            <Text style={s.metricLabel}>{label}</Text>
            <Text style={s.metricValue}>{value}</Text>
        </View>
    )
}



function priorityStyle(task: TaskItem) {
    switch (task.priority) {
        case 'high':
            return {
                borderColor: `${ERROR}55`,
                backgroundColor: `${ERROR}18`,
            }
        case 'medium':
            return {
                borderColor: `${WARNING}55`,
                backgroundColor: `${WARNING}18`,
            }
        case 'low':
            return {
                borderColor: `${SUCCESS}55`,
                backgroundColor: `${SUCCESS}18`,
            }
        default:
            return {
                borderColor: BORDER,
                backgroundColor: 'rgba(255,255,255,0.05)',
            }
    }
}

const s = StyleSheet.create({
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    notFoundTitle: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700' },
    notFoundBtn: {
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    notFoundBtnText: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '600' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerTitle: { flex: 1, color: TEXT_PRIMARY, fontSize: 16.5, fontWeight: '700', textAlign: 'center' },
    body: { padding: 20, gap: 12 },
    summaryCard: { gap: 8 },
    summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    updatedText: { fontSize: 11, color: TEXT_TERTIARY },
    summaryText: { fontSize: 13, lineHeight: 19, color: TEXT_SECONDARY },
    metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
    metricItem: {
        minWidth: 120,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 9,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    metricLabel: { fontSize: 11, color: TEXT_TERTIARY },
    metricValue: { fontSize: 14, color: TEXT_PRIMARY, fontWeight: '700', marginTop: 2 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 3,
    },
    listCard: { padding: 0, overflow: 'hidden' },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 13,
        paddingVertical: 11,
    },
    taskDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: BORDER,
    },
    taskTitle: { fontSize: 13.5, color: TEXT_PRIMARY, fontWeight: '600' },
    taskSub: { marginTop: 2, fontSize: 12, color: TEXT_SECONDARY },
    priorityPill: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    priorityText: { fontSize: 11, color: TEXT_PRIMARY, fontWeight: '700', textTransform: 'capitalize' },
})
