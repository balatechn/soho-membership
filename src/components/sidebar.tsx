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
  ChevronDown,
  User
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "FINANCE", "MANAGEMENT"] },
  { name: "Upload", href: "/upload", icon: Upload, roles: ["ADMIN", "FINANCE"] },
  { name: "Members", href: "/members", icon: Users, roles: ["ADMIN", "FINANCE", "MANAGEMENT"] },
  { name: "Invoices", href: "/invoices", icon: FileText, roles: ["ADMIN", "FINANCE", "MANAGEMENT"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "FINANCE", "MANAGEMENT"] },
  { name: "Email", href: "/email", icon: Mail, roles: ["ADMIN", "FINANCE"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
]

export function TopNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const filteredNavigation = navigation.filter(
    item => item.roles.includes(session?.user?.role || "")
  )

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 shadow-lg">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <h1 className="text-xl font-bold text-white">Junobo</h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-amber-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center space-x-3">
              {/* User Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">
                    {session?.user?.name || session?.user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform hidden sm:block",
                    userMenuOpen && "rotate-180"
                  )} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session?.user?.name || session?.user?.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session?.user?.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                        {session?.user?.role}
                      </span>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="lg:hidden bg-gray-800 border-t border-gray-700">
            <nav className="px-4 py-3 space-y-1">
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
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}

// Keep Sidebar export for backward compatibility (alias)
export const Sidebar = TopNavigation
