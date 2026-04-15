import NetInfo from '@react-native-community/netinfo'
import { useState, useEffect } from 'react'

/** Returns true when the device has an active network connection. */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Get the initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? true)
    })
    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true)
    })
    return unsubscribe
  }, [])

  return isOnline
}
