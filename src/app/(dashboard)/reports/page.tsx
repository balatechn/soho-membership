"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BarChart3, Download, Calendar, PieChart, TrendingUp, Users, FileText, Clock } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { QuarterlyChart } from "@/components/charts"
import toast from "react-hot-toast"

const reportTypes = [
  { id: "summary", name: "Monthly Revenue Summary", icon: TrendingUp },
  { id: "product", name: "Product-Wise Revenue", icon: PieChart },
  { id: "membership-type", name: "Membership Type Revenue", icon: BarChart3 },
  { id: "renewals-vs-new", name: "Renewals vs New Intake", icon: Users },
  { id: "state-tax", name: "State-Wise Tax Report", icon: FileText },
  { id: "member-status", name: "Member Status Report", icon: Users },
  { id: "upcoming-renewals", name: "Upcoming Renewals", icon: Clock },
  { id: "quarterly", name: "Quarterly Comparison", icon: Calendar },
]

export default function ReportsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeReport, setActiveReport] = useState(searchParams.get("type") || "summary")
  const [reportData, setReportData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    fetchReport()
  }, [activeReport, month, year])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("type", activeReport)
      if (activeReport === "quarterly") {
        params.set("year", year.toString())
      } else if (!["member-status", "upcoming-renewals"].includes(activeReport)) {
        params.set("month", month)
      }

      const response = await fetch(`/api/reports?${params}`)
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      toast.error("Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (reportType: string) => {
    try {
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: reportType === "summary" ? "revenue-summary" : 
                      reportType === "state-tax" ? "tax-report" :
                      reportType === "upcoming-renewals" ? "renewals" : "invoices",
          month,
        }),
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}_${month}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Report exported")
    } catch (error) {
      toast.error("Export failed")
    }
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  })

  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Generate and analyze revenue reports</p>
        </div>
        <button
          onClick={() => exportReport(activeReport)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Type Selector */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Report Types</h2>
            <div className="space-y-2">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveReport(type.id)
                    router.push(`/reports?type=${type.id}`)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeReport === type.id
                      ? "bg-amber-100 text-amber-900"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <div className="flex items-center gap-4">
              {activeReport === "quarterly" ? (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Financial Year:</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>FY {y}-{(y + 1).toString().slice(-2)}</option>
                    ))}
                  </select>
                </div>
              ) : !["member-status", "upcoming-renewals"].includes(activeReport) && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Month:</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {monthOptions.map((m) => (
                      <option key={m} value={m}>
                        {new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Report Data */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            </div>
          ) : reportData ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{reportData.report}</h2>
              
              {/* Revenue Summary */}
              {activeReport === "summary" && reportData.data && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(reportData.data.totalRevenue)}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Total Tax</p>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(reportData.data.totalTax)}</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-sm text-amber-600">Net Revenue</p>
                      <p className="text-2xl font-bold text-amber-900">{formatCurrency(reportData.data.netRevenue)}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Invoice Count</p>
                      <p className="text-2xl font-bold text-purple-900">{reportData.data.invoiceCount}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">CGST (9%)</p>
                      <p className="text-xl font-semibold">{formatCurrency(reportData.data.cgst)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">SGST (9%)</p>
                      <p className="text-xl font-semibold">{formatCurrency(reportData.data.sgst)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-500">IGST (18%)</p>
                      <p className="text-xl font-semibold">{formatCurrency(reportData.data.igst)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product-wise, Membership Type, State Tax - Table Format */}
              {["product", "membership-type", "state-tax"].includes(activeReport) && Array.isArray(reportData.data) && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {activeReport === "product" ? "Product" : activeReport === "membership-type" ? "Type" : "State"}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.data.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {row.product || row.membershipType || row.state || "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">{formatCurrency(row.totalRevenue || row.totalAmount || 0)}</td>
                          <td className="px-6 py-4 text-sm text-right">{formatCurrency(row.totalTax || 0)}</td>
                          <td className="px-6 py-4 text-sm text-right">{formatCurrency(row.netRevenue || 0)}</td>
                          <td className="px-6 py-4 text-sm text-right">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Renewals vs New */}
              {activeReport === "renewals-vs-new" && reportData.data && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-green-50 p-6 rounded-lg">
                      <p className="text-sm text-green-600 mb-1">Renewals</p>
                      <p className="text-3xl font-bold text-green-900">{reportData.data.renewals?.count || 0}</p>
                      <p className="text-lg font-semibold text-green-700">{formatCurrency(reportData.data.renewals?.revenue || 0)}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <p className="text-sm text-blue-600 mb-1">New Intake</p>
                      <p className="text-3xl font-bold text-blue-900">{reportData.data.newIntake?.count || 0}</p>
                      <p className="text-lg font-semibold text-blue-700">{formatCurrency(reportData.data.newIntake?.revenue || 0)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Member Status */}
              {activeReport === "member-status" && reportData.data && (
                <div className="space-y-6">
                  <div className="grid grid-cols-5 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-900">{reportData.data.totals.active}</p>
                      <p className="text-sm text-green-600">Active</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-900">{reportData.data.totals.expired}</p>
                      <p className="text-sm text-red-600">Expired</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-900">{reportData.data.totals.renewed}</p>
                      <p className="text-sm text-blue-600">Renewed</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-900">{reportData.data.totals.quarterly}</p>
                      <p className="text-sm text-amber-600">Quarterly</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{reportData.data.totals.frozen}</p>
                      <p className="text-sm text-gray-600">Frozen</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Renewals */}
              {activeReport === "upcoming-renewals" && reportData.data && (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-red-900">{reportData.data.next30Days.count}</p>
                      <p className="text-sm text-red-600">Next 30 Days</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-amber-900">{reportData.data.next60Days.count}</p>
                      <p className="text-sm text-amber-600">30-60 Days</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-yellow-900">{reportData.data.next90Days.count}</p>
                      <p className="text-sm text-yellow-600">60-90 Days</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-blue-900">{reportData.data.total}</p>
                      <p className="text-sm text-blue-600">Total</p>
                    </div>
                  </div>

                  {reportData.data.next30Days.members.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Members Expiring in Next 30 Days</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-gray-500">Global ID</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                              <th className="px-4 py-3 text-left font-medium text-gray-500">Expires</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {reportData.data.next30Days.members.slice(0, 10).map((member: any) => (
                              <tr key={member.id}>
                                <td className="px-4 py-3">{member.globalId}</td>
                                <td className="px-4 py-3">{member.name}</td>
                                <td className="px-4 py-3">{member.email || "-"}</td>
                                <td className="px-4 py-3">{member.product || "-"}</td>
                                <td className="px-4 py-3">{formatDate(member.membershipEndDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quarterly Comparison */}
              {activeReport === "quarterly" && Array.isArray(reportData.data) && (
                <div className="space-y-6">
                  <p className="text-gray-600">{reportData.financialYear}</p>
                  <QuarterlyChart data={reportData.data} />
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quarter</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Revenue</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoices</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reportData.data.map((q: any) => (
                          <tr key={q.quarter} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{q.quarter}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{q.period}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(q.revenue)}</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(q.tax)}</td>
                            <td className="px-6 py-4 text-right font-semibold">{formatCurrency(q.netRevenue)}</td>
                            <td className="px-6 py-4 text-right">{q.invoiceCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-gray-500 text-center">No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
