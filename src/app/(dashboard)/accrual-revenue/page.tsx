'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, Target, Users, Download, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface AccrualData {
  month: string
  totalAccrual: number
  quarterlyTenure: { oneYear: number; fiveYear: number }
  intakeTenure: { oneYear: number; fiveYear: number }
  renewalTenure: { oneYear: number; fiveYear: number }
}

interface DashboardStats {
  totalYTD: number
  currentMonth: number
  currentMonthGrowth: number
  yearlyTarget: number
  membersWithAccruals: number
  monthlyData: AccrualData[]
  chartData: { month: string; amount: number }[]
}

export default function AccrualRevenuePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'YTD' | 'Monthly' | 'Quarterly'>('Monthly')
  const [filterMonth, setFilterMonth] = useState('All')
  const [filterTenure, setFilterTenure] = useState('All')

  useEffect(() => {
    fetchAccrualData()
  }, [year])

  async function fetchAccrualData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/reports/accrual?year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch accrual data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const exportToCSV = () => {
    if (!stats) return
    
    const headers = ['Month', 'Total Accrual', 'Quarterly 1-Year', 'Quarterly 5-Year', 'Intake 1-Year', 'Intake 5-Year', 'Renewal 1-Year', 'Renewal 5-Year']
    const rows = stats.monthlyData.map(row => [
      row.month,
      row.totalAccrual,
      row.quarterlyTenure.oneYear,
      row.quarterlyTenure.fiveYear,
      row.intakeTenure.oneYear,
      row.intakeTenure.fiveYear,
      row.renewalTenure.oneYear,
      row.renewalTenure.fiveYear,
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `accrual-revenue-${year}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const maxChartValue = stats ? Math.max(...stats.chartData.map(d => d.amount)) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-amber-600">Dashboard</Link>
            <span>/</span>
            <span className="text-amber-600">Accrual Revenue</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Accrual Revenue Dashboard</h1>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Total Accrual Revenue YTD</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalYTD || 0)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Current Month Accrual</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.currentMonth || 0)}</p>
            {stats?.currentMonthGrowth !== undefined && (
              <span className={`text-sm font-medium ${stats.currentMonthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.currentMonthGrowth >= 0 ? '▲' : '▼'} {Math.abs(stats.currentMonthGrowth)}%
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Yearly Target Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.yearlyTarget || 10000000)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats ? Math.round((stats.totalYTD / (stats.yearlyTarget || 10000000)) * 100) : 0}% Achieved
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Members with Accruals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.membersWithAccruals?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Accrual Revenue Trend</h2>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['YTD', 'Monthly', 'Quarterly'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              {[2026, 2025, 2024].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-64 flex items-end gap-2">
          {stats?.chartData.map((data, index) => {
            const height = maxChartValue > 0 ? (data.amount / maxChartValue) * 100 : 0
            const isHighest = data.amount === maxChartValue && data.amount > 0
            return (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex justify-center">
                  {isHighest && (
                    <span className="absolute -top-6 text-xs font-medium text-gray-700">
                      {formatCurrency(data.amount)}
                    </span>
                  )}
                  <div
                    className={`w-8 md:w-12 rounded-t-md transition-all ${
                      isHighest ? 'bg-amber-500' : 'bg-amber-300'
                    }`}
                    style={{ height: `${Math.max(height, 2)}%`, minHeight: '4px' }}
                  />
                </div>
                <span className="text-xs text-gray-500">{data.month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Accrual Revenue by Month</h2>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Month:</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              <option value="All">All</option>
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Tenure:</label>
            <select
              value={filterTenure}
              onChange={(e) => setFilterTenure(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              <option value="All">All</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500" rowSpan={2}>Months</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500" rowSpan={2}>Total Accrual Revenue</th>
                <th className="text-center py-2 px-4 text-sm font-medium text-amber-700 bg-amber-50" colSpan={2}>Quarterly Tenure</th>
                <th className="text-center py-2 px-4 text-sm font-medium text-blue-700 bg-blue-50" colSpan={2}>Intake Tenure</th>
                <th className="text-center py-2 px-4 text-sm font-medium text-green-700 bg-green-50" colSpan={2}>Renewal Tenure</th>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="text-right py-2 px-2 text-xs font-medium text-amber-600 bg-amber-50">1-Year</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-amber-600 bg-amber-50">5-Year</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-blue-600 bg-blue-50">1-Year</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-blue-600 bg-blue-50">5-Year</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-green-600 bg-green-50">1-Year</th>
                <th className="text-right py-2 px-2 text-xs font-medium text-green-600 bg-green-50">5-Year</th>
              </tr>
            </thead>
            <tbody>
              {stats?.monthlyData
                .filter(row => filterMonth === 'All' || row.month === filterMonth)
                .map((row, index) => (
                <tr key={row.month} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.month}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 font-medium">{formatCurrency(row.totalAccrual)}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600">{formatCurrency(row.quarterlyTenure.oneYear)}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600">{formatCurrency(row.quarterlyTenure.fiveYear)}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600">{formatCurrency(row.intakeTenure.oneYear)}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600">{formatCurrency(row.intakeTenure.fiveYear)}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600">{formatCurrency(row.renewalTenure.oneYear)}</td>
                  <td className="py-3 px-2 text-sm text-right text-gray-600">{formatCurrency(row.renewalTenure.fiveYear)}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-amber-50 font-bold">
                <td className="py-3 px-4 text-sm text-amber-800">TOTAL</td>
                <td className="py-3 px-4 text-sm text-right text-amber-800">
                  {formatCurrency(stats?.monthlyData.reduce((sum, r) => sum + r.totalAccrual, 0) || 0)}
                </td>
                <td className="py-3 px-2 text-sm text-right text-amber-700">
                  {formatCurrency(stats?.monthlyData.reduce((sum, r) => sum + r.quarterlyTenure.oneYear, 0) || 0)}
                </td>
                <td className="py-3 px-2 text-sm text-right text-amber-700">
                  {formatCurrency(stats?.monthlyData.reduce((sum, r) => sum + r.quarterlyTenure.fiveYear, 0) || 0)}
                </td>
                <td className="py-3 px-2 text-sm text-right text-amber-700">
                  {formatCurrency(stats?.monthlyData.reduce((sum, r) => sum + r.intakeTenure.oneYear, 0) || 0)}
                </td>
                <td className="py-3 px-2 text-sm text-right text-amber-700">
                  {formatCurrency(stats?.monthlyData.reduce((sum, r) => sum + r.intakeTenure.fiveYear, 0) || 0)}
                </td>
                <td className="py-3 px-2 text-sm text-right text-amber-700">
                  {formatCurrency(stats?.monthlyData.reduce((sum, r) => sum + r.renewalTenure.oneYear, 0) || 0)}
                </td>
                <td className="py-3 px-2 text-sm text-right text-amber-700">
                  {formatCurrency(stats?.monthlyData.reduce((sum, r) => sum + r.renewalTenure.fiveYear, 0) || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
