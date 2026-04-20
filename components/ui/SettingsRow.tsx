import { Pressable, StyleSheet, ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

interface SettingsRowProps {
    icon: string
    label: string
    onPress: () => void
    last?: boolean
    style?: ViewStyle
}

export default function SettingsRow({ icon, label, onPress, last, style }: SettingsRowProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [s.row, !last && s.divider, pressed && { opacity: 0.65 }, style]}
        >
            <Ionicons name={icon as any} size={18} color={TEXT_SECONDARY} />
            <Text style={s.label}>{label}</Text>
            <Ionicons name="chevron-forward" size={15} color={TEXT_TERTIARY} />
        </Pressable>
    )
}

const s = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
    },
    divider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: BORDER,
    },
    label: {
        flex: 1,
        fontSize: 14.5,
        color: TEXT_PRIMARY,
    },
})
