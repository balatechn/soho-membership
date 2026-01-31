"use client"

import { useEffect, useState } from "react"
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Calendar,
  Download,
  Mail,
  ChevronRight
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import toast from "react-hot-toast"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

interface ForecastSummary {
  totalExpectedRevenue: number
  totalBeforeTax: number
  totalRenewalsDue: number
  atRiskCount: number
  forecastPeriod: number
}

interface MonthlyForecast {
  month: string
  monthLabel: string
  renewalCount: number
  expectedRevenue: number
  beforeTax: number
  members: MemberForecast[]
}

interface MemberForecast {
  id: string
  globalId: string
  name: string
  email: string | null
  product: string | null
  membershipEndDate: string
  expectedAmount: number
  beforeTax: number
  tax: number
  billingCycle: string | null
}

interface ProductBreakdown {
  product: string
  count: number
  revenue: number
  beforeTax: number
}

interface ForecastData {
  summary: ForecastSummary
  monthlyForecast: MonthlyForecast[]
  productBreakdown: ProductBreakdown[]
  atRiskMembers: MemberForecast[]
  filters: {
    locations: string[]
    products: string[]
  }
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"]

export default function ForecastPage() {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [forecastMonths, setForecastMonths] = useState(3)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)

  useEffect(() => {
    fetchForecast()
  }, [forecastMonths, selectedProduct, selectedLocation])

  const fetchForecast = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("months", forecastMonths.toString())
      if (selectedProduct) params.set("product", selectedProduct)
      if (selectedLocation) params.set("location", selectedLocation)

      const response = await fetch(`/api/forecast?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      toast.error("Failed to load forecast data")
    } finally {
      setLoading(false)
    }
  }

  const exportForecast = async () => {
    try {
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "forecast",
          filters: { months: forecastMonths, product: selectedProduct, location: selectedLocation }
        }),
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `forecast_${forecastMonths}months.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Export downloaded")
    } catch (error) {
      toast.error("Export failed")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load forecast data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forecast Revenue</h1>
          <p className="text-gray-500">Project future revenue based on membership renewals</p>
        </div>
        <button
          onClick={exportForecast}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Period</label>
            <div className="flex gap-2">
              {[3, 6, 12, 60].map((months) => (
                <button
                  key={months}
                  onClick={() => setForecastMonths(months)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    forecastMonths === months
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {months} {months === 60 ? "Months (5Y)" : "Months"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Products</option>
              {data.filters.products.map((product) => (
                <option key={product} value={product || ""}>
                  {product}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {data.filters.locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expected Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(data.summary.totalExpectedRevenue)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Before Tax: {formatCurrency(data.summary.totalBeforeTax)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Renewals Due</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.summary.totalRenewalsDue}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Next {forecastMonths} months
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">At Risk</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {data.summary.atRiskCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Expiring in 30 days
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Per Member</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatCurrency(
                  data.summary.totalRenewalsDue > 0
                    ? data.summary.totalExpectedRevenue / data.summary.totalRenewalsDue
                    : 0
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Expected renewal value
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Forecast Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Forecast</h2>
          {data.monthlyForecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthlyForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis 
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="beforeTax" name="Before Tax" fill="#94a3b8" stackId="a" />
                <Bar dataKey="expectedRevenue" name="After Tax" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No forecast data available
            </div>
          )}
        </div>

        {/* Product Breakdown Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">By Product Type</h2>
          {data.productBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.productBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="revenue"
                  nameKey="product"
                  label={({ product, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.productBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No product data available
            </div>
          )}
        </div>
      </div>

      {/* At Risk Members Alert */}
      {data.atRiskMembers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h2 className="text-lg font-semibold text-red-900">Members At Risk</h2>
                <p className="text-sm text-red-700">{data.atRiskMembers.length} members expiring within 30 days</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              <Mail className="w-4 h-4" />
              Send Reminders
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Global ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-red-700 uppercase">Expiry Date</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-red-700 uppercase">Expected Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {data.atRiskMembers.slice(0, 5).map((member) => (
                  <tr key={member.id} className="hover:bg-red-100">
                    <td className="px-4 py-2 text-sm text-red-900">
                      <a href={`/members/${member.id}`} className="text-amber-600 hover:underline">
                        {member.globalId}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-sm text-red-900">{member.name}</td>
                    <td className="px-4 py-2 text-sm text-red-700">{member.product || "-"}</td>
                    <td className="px-4 py-2 text-sm text-red-700">{formatDate(member.membershipEndDate)}</td>
                    <td className="px-4 py-2 text-sm font-medium text-red-900 text-right">
                      {formatCurrency(member.expectedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Renewals by Month</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Members Due</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Before Tax</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expected Revenue</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.monthlyForecast.map((month) => (
                <>
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.monthLabel}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {month.renewalCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(month.beforeTax)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                      {formatCurrency(month.expectedRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {month.renewalCount > 0 && (
                        <button
                          onClick={() => setExpandedMonth(expandedMonth === month.month ? null : month.month)}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <ChevronRight 
                            className={`w-5 h-5 transition-transform ${
                              expandedMonth === month.month ? "rotate-90" : ""
                            }`} 
                          />
                        </button>
                      )}
                    </td>
                  </tr>
                  {/* Expanded Member List */}
                  {expandedMonth === month.month && month.members.length > 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Global ID</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Before Tax</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Expected</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {month.members.map((member) => (
                                <tr key={member.id} className="hover:bg-white">
                                  <td className="px-4 py-2 text-sm">
                                    <a href={`/members/${member.id}`} className="text-amber-600 hover:underline">
                                      {member.globalId}
                                    </a>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">{member.name}</td>
                                  <td className="px-4 py-2 text-sm text-gray-500">{member.product || "-"}</td>
                                  <td className="px-4 py-2 text-sm text-gray-500">{formatDate(member.membershipEndDate)}</td>
                                  <td className="px-4 py-2 text-sm text-gray-500 text-right">{formatCurrency(member.beforeTax)}</td>
                                  <td className="px-4 py-2 text-sm text-gray-500 text-right">{formatCurrency(member.tax)}</td>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                    {formatCurrency(member.expectedAmount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-center">
                  {data.summary.totalRenewalsDue}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-500 text-right">
                  {formatCurrency(data.summary.totalBeforeTax)}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">
                  {formatCurrency(data.summary.totalExpectedRevenue)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
