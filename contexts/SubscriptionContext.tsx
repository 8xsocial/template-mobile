import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import Purchases from 'react-native-purchases'
import {
  isRCPremium,
  fetchOfferings,
  fetchCustomerInfo,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  purchasePackage,
  restorePurchases,
} from '@/lib/purchases'

type SubscriptionContextType = {
  /** True when the user has an active premium entitlement. */
  isPremium: boolean
  isLoading: boolean
  offerings: PurchasesOfferings | null
  customerInfo: CustomerInfo | null
  /** Trigger an in-app purchase for the given RevenueCat package. */
  purchase: (pkg: PurchasesPackage) => Promise<{ success: boolean; cancelled?: boolean; error?: string }>
  /** Restore previous purchases (required by App Store guidelines). */
  restore: () => Promise<{ success: boolean; error?: string }>
  /** Re-fetch subscription status (call after any external subscription change). */
  refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium:    false,
  isLoading:    true,
  offerings:    null,
  customerInfo: null,
  purchase:     async () => ({ success: false }),
  restore:      async () => ({ success: false }),
  refresh:      async () => {},
})

export function useSubscription() {
  return useContext(SubscriptionContext)
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium]     = useState(false)
  const [isLoading, setIsLoading]     = useState(true)
  const [offerings, setOfferings]     = useState<PurchasesOfferings | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)

  // Keep a ref so the RC listener callback always has the latest isPremium value.
  const isPremiumRef = useRef(false)
  isPremiumRef.current = isPremium

  async function loadStatus() {
    const ci = await fetchCustomerInfo()
    setCustomerInfo(ci)
    const premium = isRCPremium(ci)
    setIsPremium(premium)
    setIsLoading(false)
  }

  useEffect(() => {
    loadStatus()
    fetchOfferings().then(setOfferings)

    // Real-time listener: RevenueCat calls this whenever entitlement state changes
    // (e.g. after purchase, cancellation, or subscription expiry).
    function onCustomerInfoUpdated(info: CustomerInfo) {
      setCustomerInfo(info)
      setIsPremium(isRCPremium(info))
    }
    Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdated)

    return () => {
      Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdated)
    }
  }, [])

  async function purchase(pkg: PurchasesPackage): Promise<{ success: boolean; cancelled?: boolean; error?: string }> {
    try {
      const ci = await purchasePackage(pkg)
      if (ci) {
        setCustomerInfo(ci)
        setIsPremium(isRCPremium(ci))
      }
      return { success: true }
    } catch (e: any) {
      if (e?.userCancelled) return { success: false, cancelled: true }
      return { success: false, error: e?.message ?? 'Purchase failed' }
    }
  }

  async function restore(): Promise<{ success: boolean; error?: string }> {
    try {
      const ci = await restorePurchases()
      setCustomerInfo(ci)
      setIsPremium(isRCPremium(ci))
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'Restore failed' }
    }
  }

  async function refresh() {
    setIsLoading(true)
    await loadStatus()
  }

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, isLoading, offerings, customerInfo, purchase, restore, refresh }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}
