"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { ActivityTracker } from "./activity-tracker"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ActivityTracker />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
          },
        }}
      />
      {children}
    </SessionProvider>
  )
}
