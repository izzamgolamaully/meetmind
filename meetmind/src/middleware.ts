// src/middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Redirect authenticated users away from auth pages
    const token = req.nextauth.token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth/signin")

    if (isAuthPage && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        // Protect /dashboard routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/auth/signin"],
}
