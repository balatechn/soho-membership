"use client"

import { useSession } from "next-auth/react"
import { Settings, Users, History, Bell, Shield } from "lucide-react"
import { redirect } from "next/navigation"

export default function SettingsPage() {
  const { data: session } = useSession()

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage application settings and configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Manage user accounts, roles, and permissions.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Admin</p>
                <p className="text-sm text-gray-500">Full access to all features</p>
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Full Access</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Finance</p>
                <p className="text-sm text-gray-500">Upload invoices, view reports</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Write Access</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Management</p>
                <p className="text-sm text-gray-500">View dashboards and reports</p>
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Read Only</span>
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Configure SMTP settings for automated emails.
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">SMTP Host</p>
              <p className="font-medium text-gray-900">{process.env.SMTP_HOST || "smtp.gmail.com"}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">SMTP Port</p>
              <p className="font-medium text-gray-900">{process.env.SMTP_PORT || "587"}</p>
            </div>
            <p className="text-xs text-gray-400">
              Update SMTP settings in environment variables.
            </p>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <History className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Audit Logs</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Track all system activities and changes.
          </p>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• All invoice uploads are logged</p>
            <p>• Member updates are tracked</p>
            <p>• Report exports are recorded</p>
            <p>• Email sends are documented</p>
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Locations</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Future-ready for multiple Soho House locations.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-900">Mumbai</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between py-2 text-gray-400">
              <span>Delhi</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Coming Soon</span>
            </div>
            <div className="flex items-center justify-between py-2 text-gray-400">
              <span>Bangalore</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Version</p>
            <p className="font-medium text-gray-900">1.0.0</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Environment</p>
            <p className="font-medium text-gray-900">{process.env.NODE_ENV || "development"}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Database</p>
            <p className="font-medium text-gray-900">SQLite</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Current User</p>
            <p className="font-medium text-gray-900">{session?.user?.name || session?.user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
