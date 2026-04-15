import { Stack } from 'expo-router'
import { BG } from '@/lib/theme'

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: BG } }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
