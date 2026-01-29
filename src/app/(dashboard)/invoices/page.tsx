"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FileText, Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface Invoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  name: string
  state: string | null
  product: string | null
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  totalAmount: number
  uploadMonth: string
  member: {
    globalId: string
    status: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function InvoicesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [uploadMonth, setUploadMonth] = useState(searchParams.get("uploadMonth") || "")

  useEffect(() => {
    fetchInvoices()
  }, [searchParams])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", searchParams.get("page") || "1")
      if (search) params.set("search", search)
      if (uploadMonth) params.set("uploadMonth", uploadMonth)

      const response = await fetch(`/api/invoices?${params}`)
      const data = await response.json()
      setInvoices(data.invoices)
      setPagination(data.pagination)
    } catch (error) {
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set("page", "1")
    if (search) params.set("search", search)
    if (uploadMonth) params.set("uploadMonth", uploadMonth)
    router.push(`/invoices?${params}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`/invoices?${params}`)
  }

  const exportInvoices = async () => {
    try {
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "invoices",
          filters: { uploadMonth }
        }),
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoices_${uploadMonth || "all"}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Export downloaded")
    } catch (error) {
      toast.error("Export failed")
    }
  }

  // Generate month options for last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">View and manage invoice records</p>
        </div>
        <button
          onClick={exportInvoices}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by invoice no, name, or Global ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={uploadMonth}
            onChange={(e) => setUploadMonth(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">All Months</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Global ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a href={`/members?search=${invoice.member.globalId}`} className="text-amber-600 hover:underline">
                        {invoice.member.globalId}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.state || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(invoice.cgst)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(invoice.sgst)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {formatCurrency(invoice.igst)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invoices
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
