import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      image?: string
    }
  }
  
  interface User {
    id: string
    email: string
    name: string
    role: string
    image?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    email: string
    name: string
  }
}

// Rate limiting cache (simple in-memory)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingAttempts?: number; lockoutEnds?: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(email)
  
  if (attempts) {
    // Reset if lockout period has passed
    if (now - attempts.lastAttempt > LOCKOUT_TIME) {
      loginAttempts.delete(email)
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
    }
    
    if (attempts.count >= MAX_ATTEMPTS) {
      return { 
        allowed: false, 
        lockoutEnds: attempts.lastAttempt + LOCKOUT_TIME 
      }
    }
  }
  
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - (attempts?.count || 0) }
}

function recordLoginAttempt(email: string, success: boolean) {
  if (success) {
    loginAttempts.delete(email)
    return
  }
  
  const now = Date.now()
  const attempts = loginAttempts.get(email)
  
  if (attempts) {
    loginAttempts.set(email, { count: attempts.count + 1, lastAttempt: now })
  } else {
    loginAttempts.set(email, { count: 1, lastAttempt: now })
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const email = credentials.email.toLowerCase().trim()
        
        // Rate limiting check
        const rateLimit = checkRateLimit(email)
        if (!rateLimit.allowed) {
          throw new Error("Too many login attempts. Please try again later.")
        }

        // Find user with optimized query
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            image: true,
          }
        })

        if (!user || !user.password) {
          recordLoginAttempt(email, false)
          throw new Error("Invalid email or password")
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isCorrectPassword) {
          recordLoginAttempt(email, false)
          throw new Error("Invalid email or password")
        }

        // Successful login
        recordLoginAttempt(email, true)

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role,
          image: user.image || undefined,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name
      }
      
      // Update session if triggered
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.email = token.email ?? session.user.email
        session.user.name = token.name ?? session.user.name
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security)
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

// Helper to check if user has required role
export function hasRole(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

// Role hierarchy
export const ROLES = {
  ADMIN: 'ADMIN',
  FINANCE: 'FINANCE', 
  MANAGEMENT: 'MANAGEMENT',
} as const

export type UserRole = keyof typeof ROLES
