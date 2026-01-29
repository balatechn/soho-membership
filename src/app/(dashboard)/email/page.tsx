"use client"

import { useState } from "react"
import { Mail, Send, Loader2, Plus, X, Calendar, FileText, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

const reportOptions = [
  { id: "revenue-summary", name: "Revenue Summary" },
  { id: "member-status", name: "Member Status" },
  { id: "tax-report", name: "Tax Report" },
]

export default function EmailPage() {
  const [loading, setLoading] = useState(false)
  const [recipients, setRecipients] = useState<string[]>([])
  const [newRecipient, setNewRecipient] = useState("")
  const [selectedReports, setSelectedReports] = useState<string[]>(["revenue-summary"])
  const [customMessage, setCustomMessage] = useState("")
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [sent, setSent] = useState(false)

  const addRecipient = () => {
    if (newRecipient && newRecipient.includes("@")) {
      setRecipients([...recipients, newRecipient])
      setNewRecipient("")
    } else {
      toast.error("Please enter a valid email address")
    }
  }

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email))
  }

  const toggleReport = (reportId: string) => {
    if (selectedReports.includes(reportId)) {
      setSelectedReports(selectedReports.filter((r) => r !== reportId))
    } else {
      setSelectedReports([...selectedReports, reportId])
    }
  }

  const sendEmail = async () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient")
      return
    }

    if (selectedReports.length === 0) {
      toast.error("Please select at least one report")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          reportTypes: selectedReports,
          month,
          customMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email")
      }

      setSent(true)
      toast.success(data.message)
    } catch (error: any) {
      toast.error(error.message || "Failed to send email")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSent(false)
    setRecipients([])
    setSelectedReports(["revenue-summary"])
    setCustomMessage("")
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  })

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Sent Successfully!</h2>
          <p className="text-gray-500 mb-6">
            The report has been sent to {recipients.length} recipient{recipients.length > 1 ? "s" : ""}.
          </p>
          <button
            onClick={resetForm}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
          >
            Send Another Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Reports</h1>
        <p className="text-gray-500">Send automated reports to management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recipients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipients</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRecipient()}
                placeholder="Enter email address"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                onClick={addRecipient}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipients.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    <span>{email}</span>
                    <button
                      onClick={() => removeRecipient(email)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {recipients.length === 0 && (
              <p className="text-gray-400 text-sm">No recipients added yet</p>
            )}
          </div>

          {/* Report Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Reports</h2>
            
            <div className="space-y-3">
              {reportOptions.map((report) => (
                <label
                  key={report.id}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedReports.includes(report.id)
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() => toggleReport(report.id)}
                    className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">{report.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Message (Optional)</h2>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              placeholder="Add any additional notes or comments..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">To:</p>
                <p className="font-medium text-gray-900">
                  {recipients.length > 0 ? recipients.join(", ") : "No recipients"}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Subject:</p>
                <p className="font-medium text-gray-900">
                  Soho House Mumbai - Monthly Revenue Report ({new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })})
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Attachments:</p>
                <div className="space-y-2">
                  {selectedReports.map((report) => (
                    <div key={report} className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>{reportOptions.find((r) => r.id === report)?.name}.xlsx</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={sendEmail}
            disabled={loading || recipients.length === 0 || selectedReports.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
