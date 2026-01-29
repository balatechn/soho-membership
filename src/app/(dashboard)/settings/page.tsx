"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Settings, Users, Bell, Plus, Edit2, Trash2, Eye, EyeOff, X, Check, RefreshCw } from "lucide-react"
import { redirect } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MANAGEMENT"
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchUsers()
    }
  }, [session])

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      const data = await response.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create user")
        return
      }

      setSuccess("User created successfully!")
      setShowCreateModal(false)
      setFormData({ name: "", email: "", password: "", role: "MANAGEMENT" })
      fetchUsers()
    } catch {
      setError("An error occurred")
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setError("")
    setSuccess("")

    try {
      const updateData: Record<string, string> = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      }
      
      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update user")
        return
      }

      setSuccess("User updated successfully!")
      setShowEditModal(false)
      setSelectedUser(null)
      setFormData({ name: "", email: "", password: "", role: "MANAGEMENT" })
      fetchUsers()
    } catch {
      setError("An error occurred")
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.name || user.email}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE"
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Failed to delete user")
        return
      }

      setSuccess("User deleted successfully!")
      fetchUsers()
    } catch {
      alert("An error occurred")
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role
    })
    setShowEditModal(true)
    setError("")
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700"
      case "FINANCE":
        return "bg-blue-100 text-blue-700"
      case "MANAGEMENT":
        return "bg-gray-100 text-gray-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage application settings and user accounts</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* User Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                <p className="text-sm text-gray-500">Create and manage user accounts</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFormData({ name: "", email: "", password: "", role: "MANAGEMENT" })
                  setShowCreateModal(true)
                  setError("")
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-amber-700 font-medium text-sm">
                            {(user.name || user.email)[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{user.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete User"
                          disabled={user.email === session?.user?.email}
                        >
                          <Trash2 className={`w-4 h-4 ${user.email === session?.user?.email ? "opacity-30" : ""}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">ADMIN</span>
          </div>
          <p className="text-gray-600 text-sm">Full access to all features including user management, settings, and all data operations.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">FINANCE</span>
          </div>
          <p className="text-gray-600 text-sm">Can upload invoices, view reports, manage members, and send emails. Cannot manage users.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">MANAGEMENT</span>
          </div>
          <p className="text-gray-600 text-sm">Read-only access to dashboards, reports, and member information. Cannot upload or modify data.</p>
        </div>
      </div>

      {/* Other Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <p className="font-medium text-gray-900">smtp.gmail.com</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">SMTP Port</p>
              <p className="font-medium text-gray-900">587</p>
            </div>
            <p className="text-xs text-gray-400">
              Update SMTP settings in environment variables.
            </p>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">System Information</h2>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Version</p>
              <p className="font-medium text-gray-900">1.0.0</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Database</p>
              <p className="font-medium text-gray-900">PostgreSQL (Supabase)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Current User</p>
              <p className="font-medium text-gray-900">{session?.user?.name || session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="MANAGEMENT">MANAGEMENT - Read Only</option>
                    <option value="FINANCE">FINANCE - Upload & Reports</option>
                    <option value="ADMIN">ADMIN - Full Access</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                      placeholder="Leave blank to keep current"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Leave blank to keep current password</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    disabled={selectedUser.email === session?.user?.email}
                  >
                    <option value="MANAGEMENT">MANAGEMENT - Read Only</option>
                    <option value="FINANCE">FINANCE - Upload & Reports</option>
                    <option value="ADMIN">ADMIN - Full Access</option>
                  </select>
                  {selectedUser.email === session?.user?.email && (
                    <p className="text-xs text-amber-600 mt-1">Cannot change your own role</p>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
