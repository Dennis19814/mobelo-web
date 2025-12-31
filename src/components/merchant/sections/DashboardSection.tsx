'use client'

import AnalyticsDashboard from '@/components/merchant/AnalyticsDashboard'
import { useMerchantAuth } from '@/hooks'

interface App {
  id: number
  app_name: string
  app_idea: string
  status: string
}

interface DashboardSectionProps {
  app: App
  onSectionChange?: (section: string) => void
  apiKey?: string
  appSecretKey?: string
}

export default function DashboardSection({ app, onSectionChange, apiKey, appSecretKey }: DashboardSectionProps) {
  const { isReady } = useMerchantAuth(apiKey, appSecretKey)
  const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false

  if (!isReady && !hasStaffToken) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Preparing dashboard...</p>
        </div>
      </div>
    )
  }

  return <AnalyticsDashboard />
}
