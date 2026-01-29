"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { 
  LayoutDashboard, 
  Upload, 
  Users, 
  FileText, 
  BarChart3, 
  Mail, 
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "FINANCE", "MANAGEMENT"] },
  { name: "Upload Invoices", href: "/upload", icon: Upload, roles: ["ADMIN", "FINANCE"] },
  { name: "Members", href: "/members", icon: Users, roles: ["ADMIN", "FINANCE", "MANAGEMENT"] },
  { name: "Invoices", href: "/invoices", icon: FileText, roles: ["ADMIN", "FINANCE", "MANAGEMENT"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "FINANCE", "MANAGEMENT"] },
  { name: "Email Reports", href: "/email", icon: Mail, roles: ["ADMIN", "FINANCE"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredNavigation = navigation.filter(
    item => item.roles.includes(session?.user?.role || "")
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-900 text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
            <h1 className="text-xl font-bold text-white">Soho House</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-amber-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.role}
                </p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
