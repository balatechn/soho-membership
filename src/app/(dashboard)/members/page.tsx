"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Users, Search, Filter, Download, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface Member {
  id: string
  globalId: string
  name: string
  email: string | null
  pinCode: string | null
  state: string | null
  status: string
  product: string | null
  membershipType: string | null
  membershipStartDate: string | null
  membershipEndDate: string | null
  _count: { invoices: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function MembersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [members, setMembers] = useState<Member[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "")
  const [product, setProduct] = useState(searchParams.get("product") || "")

  useEffect(() => {
    fetchMembers()
  }, [searchParams])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", searchParams.get("page") || "1")
      if (search) params.set("search", search)
      if (status) params.set("status", status)
      if (product) params.set("product", product)

      const response = await fetch(`/api/members?${params}`)
      const data = await response.json()
      setMembers(data.members)
      setPagination(data.pagination)
    } catch (error) {
      toast.error("Failed to load members")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set("page", "1")
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    if (product) params.set("product", product)
    router.push(`/members?${params}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`/members?${params}`)
  }

  const exportMembers = async () => {
    try {
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "members",
          filters: { status, product }
        }),
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `members_${new Date().toISOString().split("T")[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success("Export downloaded")
    } catch (error) {
      toast.error("Export failed")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "EXPIRED": return "bg-red-100 text-red-800"
      case "RENEWED": return "bg-blue-100 text-blue-800"
      case "QUARTERLY": return "bg-amber-100 text-amber-800"
      case "FROZEN": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500">Manage member master records</p>
        </div>
        <button
          onClick={exportMembers}
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
              placeholder="Search by name, email, or Global ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="RENEWED">Renewed</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="FROZEN">Frozen</option>
          </select>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">All Products</option>
            <option value="Regular">Regular</option>
            <option value="Local House">Local House</option>
            <option value="Every House">Every House</option>
            <option value="U27">U27</option>
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
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Global ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membership End</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoices</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.globalId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.product || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(member.membershipEndDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member._count.invoices}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`/members/${member.id}`}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
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
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} members
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
