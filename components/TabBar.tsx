import React, { useEffect } from 'react'
import { View, Pressable, StyleSheet, Platform } from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import {
  TAB_ACTIVE,
  TAB_INACTIVE,
  TAB_HEIGHT,
  BG,
} from '@/lib/theme'
import { Text } from '@/components/ui/Text'

// ─── Tab icon definitions ─────────────────────────────────────────────────────
// Add new tabs here after creating the corresponding app/(tabs)/<name>.tsx file.

const ICON_SIZE = 26
const INDICATOR_W = 40
const EASE_OUT = Easing.out(Easing.cubic)
const EASE_IN = Easing.in(Easing.cubic)

export const TAB_BAR_HEIGHT = TAB_HEIGHT
export const TAB_BAR_CLEARANCE = TAB_HEIGHT + 4

// ─── Single tab item ──────────────────────────────────────────────────────────

function TabItem({
  label,
  isActive,
  onPress,
  icon,
}: {
  label: string
  isActive: boolean
  onPress: () => void
  icon?: React.ReactNode
}) {
  const indicatorW = useSharedValue(isActive ? INDICATOR_W : 0)
  const pressOpacity = useSharedValue(1)

  useEffect(() => {
    indicatorW.value = withTiming(isActive ? INDICATOR_W : 0, {
      duration: isActive ? 200 : 150,
      easing: isActive ? EASE_OUT : EASE_IN,
    })
  }, [isActive])

  const indicatorStyle = useAnimatedStyle(() => ({ width: indicatorW.value }))
  const pressStyle = useAnimatedStyle(() => ({ opacity: pressOpacity.value }))

  return (
    <Pressable
      style={s.tab}
      onPress={onPress}
      onPressIn={() => { pressOpacity.value = withTiming(0.45, { duration: 70 }) }}
      onPressOut={() => { pressOpacity.value = withTiming(1, { duration: 160, easing: EASE_OUT }) }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      {/* Active indicator line at top */}
      <Animated.View style={[s.indicator, indicatorStyle]} />

      <Animated.View style={[s.tabInner, pressStyle]}>
        {icon}
        <Text style={[s.label, isActive && s.labelActive]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

// ─── TabBar ───────────────────────────────────────────────────────────────────

export default function TabBar({ state, navigation, descriptors }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  function handlePress(name: string, key: string, i: number) {
    if (state.index === i) return
    const ev = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true })
    if (!ev.defaultPrevented) navigation.navigate(name as never)
  }

  const tabs = (
    <View style={s.bar}>
      {state.routes.map((route, i) => {
        const { options } = descriptors[route.key]
        const isActive = state.index === i
        const label = typeof options.tabBarLabel === 'string'
          ? options.tabBarLabel
          : (options.title ?? route.name)
        const icon = options.tabBarIcon?.({
          color: isActive ? TAB_ACTIVE : TAB_INACTIVE,
          size: ICON_SIZE,
          focused: isActive,
        })

        return (
          <TabItem
            key={route.key}
            label={label}
            isActive={isActive}
            icon={icon}
            onPress={() => handlePress(route.name, route.key, i)}
          />
        )
      })}
    </View>
  )

  if (Platform.OS === 'ios') {
    return (
      <View style={s.wrapper}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={s.overlay} />
        {tabs}
        {insets.bottom > 0 && (
          <View style={{ height: insets.bottom, backgroundColor: 'transparent' }} />
        )}
      </View>
    )
  }

  return (
    <View style={[s.wrapper, s.wrapperAndroid]}>
      {tabs}
      {insets.bottom > 0 && (
        <View style={{ height: insets.bottom, backgroundColor: BG }} />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  wrapperAndroid: { backgroundColor: BG },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `${BG}B8`, // BG at ~72% opacity
  },
  bar: {
    flexDirection: 'row', height: TAB_HEIGHT, alignItems: 'stretch',
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
  },
  indicator: {
    height: 3, borderRadius: 2,
    backgroundColor: TAB_ACTIVE,
    marginBottom: 6,
  },
  tabInner: {
    alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  label: {
    fontSize: 10.5, color: TAB_INACTIVE, textAlign: 'center', fontWeight: '500',
  },
  labelActive: {
    color: TAB_ACTIVE, fontWeight: '600',
  },
})
