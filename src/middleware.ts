import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequestWithAuth } from "next-auth/middleware"

// Role-based access control configuration
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['/dashboard', '/upload', '/members', '/invoices', '/reports', '/email', '/settings'],
  FINANCE: ['/dashboard', '/upload', '/members', '/invoices', '/reports', '/email'],
  MANAGEMENT: ['/dashboard', '/members', '/invoices', '/reports'],
}

function hasAccess(role: string | undefined, path: string): boolean {
  if (!role) return false
  const allowedPaths = ROLE_PERMISSIONS[role] || []
  return allowedPaths.some(allowed => path.startsWith(allowed))
}

export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Skip API routes - they handle their own auth
    if (path.startsWith('/api/')) {
      return NextResponse.next()
    }

    // Check role-based access
    if (!hasAccess(token?.role as string, path)) {
      // Redirect to dashboard if user doesn't have access
      const dashboardUrl = new URL("/dashboard", req.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Add security headers
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page without token
        if (req.nextUrl.pathname === '/login') return true
        // Require token for all other protected routes
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/upload/:path*",
    "/members/:path*",
    "/invoices/:path*",
    "/reports/:path*",
    "/email/:path*",
    "/settings/:path*",
  ],
}
