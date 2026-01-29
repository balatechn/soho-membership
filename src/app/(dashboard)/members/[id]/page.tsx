"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, User, Mail, MapPin, Calendar, CreditCard, FileText } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

interface Invoice {
  id: string
  invoiceNo: string
  invoiceDate: string
  totalAmount: number
  totalTax: number
  product: string | null
  billingCycle: string | null
}

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
  paymentStartDate: string | null
  paymentEndDate: string | null
  registration: string | null
  location: string
  invoices: Invoice[]
}

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMember()
  }, [params.id])

  const fetchMember = async () => {
    try {
      const response = await fetch(`/api/members/${params.id}`)
      if (!response.ok) throw new Error("Member not found")
      const data = await response.json()
      setMember(data)
    } catch (error) {
      toast.error("Failed to load member")
      router.push("/members")
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (!member) {
    return null
  }

  const totalRevenue = member.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
          <p className="text-gray-500">Global ID: {member.globalId}</p>
        </div>
        <span className={`ml-auto px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(member.status)}`}>
          {member.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{member.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{member.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">
                    {member.state || "Unknown"} {member.pinCode && `- ${member.pinCode}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium text-gray-900">{member.product || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Membership Dates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Membership Type</p>
                <p className="font-medium text-gray-900">{member.membershipType || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration</p>
                <p className="font-medium text-gray-900">{member.registration || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Membership Start</p>
                <p className="font-medium text-gray-900">{formatDate(member.membershipStartDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Membership End</p>
                <p className="font-medium text-gray-900">{formatDate(member.membershipEndDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Start</p>
                <p className="font-medium text-gray-900">{formatDate(member.paymentStartDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment End</p>
                <p className="font-medium text-gray-900">{formatDate(member.paymentEndDate)}</p>
              </div>
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h2>
            {member.invoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No invoices found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {member.invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.invoiceNo}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(invoice.invoiceDate)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{invoice.product || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{formatCurrency(invoice.totalTax)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(invoice.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-3 text-sm font-medium text-gray-900">Total</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(totalRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Invoices</span>
                <span className="font-semibold text-gray-900">{member.invoices.length}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-semibold text-green-600">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">House Location</span>
                <span className="font-semibold text-gray-900">{member.location}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Member Since</span>
                <span className="font-semibold text-gray-900">{formatDate(member.membershipStartDate)}</span>
              </div>
            </div>
          </div>

          {/* Days Until Expiry */}
          {member.membershipEndDate && member.status !== "EXPIRED" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <p className="text-sm text-amber-700">Membership expires in</p>
              <p className="text-3xl font-bold text-amber-900 mt-1">
                {Math.max(0, Math.ceil((new Date(member.membershipEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
              </p>
              <p className="text-sm text-amber-600 mt-2">
                {formatDate(member.membershipEndDate)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
