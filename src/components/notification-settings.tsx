"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, Check, X, Send, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import toast from "react-hot-toast"

interface NotificationConfig {
  id: string
  type: string
  emails: string
  enabled: boolean
  updatedAt: string
}

interface NotificationLog {
  id: string
  type: string
  recipients: string
  subject: string
  status: string
  error?: string
  sentAt: string
}

const NOTIFICATION_TYPES = {
  UPLOAD_SUCCESS: {
    label: "Upload Success",
    description: "Notify when invoice upload completes successfully",
    icon: CheckCircle,
    color: "text-green-600 bg-green-100"
  },
  UPLOAD_ERROR: {
    label: "Upload Errors",
    description: "Notify when invoice upload has errors",
    icon: AlertTriangle,
    color: "text-amber-600 bg-amber-100"
  },
  RENEWAL_REMINDER: {
    label: "Renewal Reminders",
    description: "Send monthly reminders for expiring memberships (1st & 15th)",
    icon: Clock,
    color: "text-blue-600 bg-blue-100"
  }
}

export default function NotificationSettings() {
  const [configs, setConfigs] = useState<NotificationConfig[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testEmail, setTestEmail] = useState("")
  const [sendingTest, setSendingTest] = useState(false)
  const [editingType, setEditingType] = useState<string | null>(null)
  const [editEmails, setEditEmails] = useState("")

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      const data = await response.json()
      setConfigs(data.configs || [])
      setLogs(data.logs || [])
    } catch (error) {
      console.error("Failed to fetch notification configs:", error)
      toast.error("Failed to load notification settings")
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (type: string, currentEnabled: boolean) => {
    setSaving(type)
    try {
      const config = configs.find(c => c.type === type)
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          emails: config?.emails || "",
          enabled: !currentEnabled
        })
      })

      if (!response.ok) throw new Error("Failed to update")
      
      await fetchConfigs()
      toast.success(`${NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES]?.label} notifications ${!currentEnabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error("Failed to toggle notification:", error)
      toast.error("Failed to update notification setting")
    } finally {
      setSaving(null)
    }
  }

  const handleSaveEmails = async (type: string) => {
    setSaving(type)
    try {
      const config = configs.find(c => c.type === type)
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          emails: editEmails,
          enabled: config?.enabled ?? true
        })
      })

      if (!response.ok) throw new Error("Failed to update")
      
      await fetchConfigs()
      setEditingType(null)
      toast.success("Email recipients updated")
    } catch (error) {
      console.error("Failed to save emails:", error)
      toast.error("Failed to update email recipients")
    } finally {
      setSaving(null)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address")
      return
    }

    setSendingTest(true)
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send test email")
      }
      
      toast.success("Test email sent successfully!")
      setTestEmail("")
    } catch (error) {
      console.error("Failed to send test email:", error)
      toast.error(error instanceof Error ? error.message : "Failed to send test email")
    } finally {
      setSendingTest(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
              <p className="text-sm text-gray-500">Configure automated email notifications</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {Object.entries(NOTIFICATION_TYPES).map(([type, info]) => {
            const config = configs.find(c => c.type === type)
            const Icon = info.icon
            const isEditing = editingType === type

            return (
              <div key={type} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${info.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{info.label}</h3>
                      <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                      
                      {/* Email Recipients */}
                      <div className="mt-3">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editEmails}
                              onChange={(e) => setEditEmails(e.target.value)}
                              placeholder="email1@example.com, email2@example.com"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => handleSaveEmails(type)}
                              disabled={saving === type}
                              className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingType(null)}
                              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {config?.emails ? (
                              <span className="text-sm text-gray-600">{config.emails}</span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">No recipients configured</span>
                            )}
                            <button
                              onClick={() => {
                                setEditingType(type)
                                setEditEmails(config?.emails || "")
                              }}
                              className="text-sm text-amber-600 hover:text-amber-700 ml-2"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(type, config?.enabled ?? false)}
                    disabled={saving === type}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                      config?.enabled ? 'bg-amber-600' : 'bg-gray-200'
                    } ${saving === type ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        config?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Test Email */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-medium text-gray-900 mb-4">Send Test Email</h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <button
            onClick={handleSendTest}
            disabled={sendingTest}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {sendingTest ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Test
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Note: Requires RESEND_API_KEY environment variable to be configured
        </p>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Recent Notifications</h3>
        </div>
        
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No notifications sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {log.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.subject}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.recipients}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        log.status === 'SENT' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(log.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
