import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin-only routes
    if (path.startsWith("/settings") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Finance and Admin routes
    if (
      (path.startsWith("/upload") || path.startsWith("/email")) &&
      !["ADMIN", "FINANCE"].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/members/:path*",
    "/invoices/:path*",
    "/reports/:path*",
    "/email/:path*",
    "/settings/:path*",
  ],
}
