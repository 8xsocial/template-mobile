import React, { createContext, useContext, useRef, useState, useCallback } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { SURFACE2, SUCCESS, ERROR, ACCENT, BORDER, TAB_HEIGHT } from '@/lib/theme'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: number
    message: string
    type: ToastType
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
    return useContext(ToastContext)
}

let _nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++_nextId
        setToasts((prev) => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3200)
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastList toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
        </ToastContext.Provider>
    )
}

function toastColor(type: ToastType) {
    switch (type) {
        case 'success': return SUCCESS
        case 'error':   return ERROR
        default:        return ACCENT
    }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(16)).current

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start()

        const t = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 10, duration: 180, useNativeDriver: true }),
            ]).start(onDismiss)
        }, 2800)

        return () => clearTimeout(t)
    }, [])

    const color = toastColor(toast.type)

    return (
        <Animated.View style={[s.toast, { opacity, transform: [{ translateY }] }]}>
            <View style={[s.dot, { backgroundColor: color }]} />
            <Text style={s.message} numberOfLines={2}>{toast.message}</Text>
        </Animated.View>
    )
}

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
    const insets = useSafeAreaInsets()

    if (toasts.length === 0) return null

    return (
        <View
            style={[s.container, { bottom: TAB_HEIGHT + insets.bottom + 12 }]}
            pointerEvents="none"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
            ))}
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        gap: 8,
        zIndex: 999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: SURFACE2,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flexShrink: 0,
    },
    message: {
        flex: 1,
        fontSize: 13.5,
        color: '#fff',
        fontWeight: '500',
        lineHeight: 19,
    },
})
