import { View, TextInput, TextInputProps, StyleSheet } from 'react-native'
import { Text } from '@/components/ui/Text'
import { BORDER, ERROR, TEXT_PRIMARY, TEXT_TERTIARY } from '@/lib/theme'
import { Fonts } from '@/lib/typography'

interface TextInputFieldProps extends TextInputProps {
    label?: string
    error?: string
}

export default function TextInputField({ label, error, style, ...props }: TextInputFieldProps) {
    return (
        <View style={s.wrapper}>
            {label ? <Text style={s.label}>{label}</Text> : null}
            <TextInput
                style={[s.input, error ? s.inputError : null, style]}
                placeholderTextColor="rgba(255,255,255,0.22)"
                {...props}
            />
            {error ? <Text style={s.error}>{error}</Text> : null}
        </View>
    )
}

const s = StyleSheet.create({
    wrapper: { gap: 6 },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.7,
        textTransform: 'uppercase',
        color: TEXT_TERTIARY,
    },
    input: {
        height: 46,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        paddingHorizontal: 14,
        color: TEXT_PRIMARY,
        fontSize: 14.5,
        fontFamily: Fonts.regular,
    },
    inputError: {
        borderColor: `${ERROR}66`,
    },
    error: {
        fontSize: 12,
        color: ERROR,
        marginTop: -2,
    },
})
