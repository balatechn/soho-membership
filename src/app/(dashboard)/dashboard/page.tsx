"use client"

import { useEffect, useState, useCallback } from "react"
import { StatCard } from "@/components/stat-card"
import { RevenueChart, ProductChart, MemberStatusChart } from "@/components/charts"
import { DollarSign, Users, RefreshCw, FileText, AlertTriangle, TrendingUp } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface DashboardData {
  revenue: {
    currentMonth: number
    lastMonth: number
    change: number
    tax: number
    invoiceCount: number
  }
  members: {
    total: number
    active: number
    expired: number
    upcomingRenewals: number
  }
  productDistribution: Array<{ product: string; count: number }>
  monthlyTrend: Array<{ month: string; revenue: number }>
}

// Simple cache for dashboard data
let dashboardCache: { data: DashboardData | null; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_TTL = 60000 // 1 minute cache

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(dashboardCache.data)
  const [loading, setLoading] = useState(!dashboardCache.data)

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Use cache if available and not expired
    const now = Date.now()
    if (!forceRefresh && dashboardCache.data && (now - dashboardCache.timestamp) < CACHE_TTL) {
      setData(dashboardCache.data)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/reports?type=dashboard")
      const result = await response.json()
      dashboardCache = { data: result.data, timestamp: now }
      setData(result.data)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mt-3"></div>
            </div>
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-80">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-56 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-80">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-56 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome to Junobo Mumbai Membership Management</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Revenue"
          value={data.revenue.currentMonth}
          format="currency"
          change={data.revenue.change}
          changeLabel="vs last month"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Tax Collected"
          value={data.revenue.tax}
          format="currency"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Active Members"
          value={data.members.active}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Upcoming Renewals"
          value={data.members.upcomingRenewals}
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={data.monthlyTrend} />
        <ProductChart data={data.productDistribution} />
      </div>

      {/* Member Status & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MemberStatusChart 
            data={{
              active: data.members.active,
              expired: data.members.expired,
              renewed: 0,
              quarterly: 0,
              frozen: 0,
            }} 
          />
        </div>
        
        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Total Members</span>
              <span className="font-semibold text-gray-900">{data.members.total}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Invoices This Month</span>
              <span className="font-semibold text-gray-900">{data.revenue.invoiceCount}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Net Revenue</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(data.revenue.currentMonth - data.revenue.tax)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Expired Members</span>
              <span className="font-semibold text-red-600">{data.members.expired}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Renewals Alert */}
      {data.members.upcomingRenewals > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <h4 className="font-medium text-amber-900">Attention Required</h4>
              <p className="text-amber-700 text-sm">
                {data.members.upcomingRenewals} member{data.members.upcomingRenewals > 1 ? "s" : ""} have 
                memberships expiring in the next 30 days. Consider sending renewal reminders.
              </p>
            </div>
            <a
              href="/reports?type=upcoming-renewals"
              className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
            >
              View Renewals
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
