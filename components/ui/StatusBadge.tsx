import { View, StyleSheet } from 'react-native'
import { Text } from '@/components/ui/Text'
import { SUCCESS, WARNING, ERROR } from '@/lib/theme'
import type { ItemStatus } from '@/lib/mockData'

export function statusColor(status: ItemStatus): string {
    switch (status) {
        case 'active':   return SUCCESS
        case 'pending':  return WARNING
        case 'archived': return ERROR
        default:         return SUCCESS
    }
}

export default function StatusBadge({ status, label }: { status: ItemStatus; label: string }) {
    const color = statusColor(status)
    return (
        <View style={[s.pill, { backgroundColor: `${color}20`, borderColor: `${color}55` }]}>
            <Text style={[s.text, { color }]}>{label}</Text>
        </View>
    )
}

const s = StyleSheet.create({
    pill: {
        borderWidth: 1,
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    text: { fontSize: 11, fontWeight: '700' },
})
