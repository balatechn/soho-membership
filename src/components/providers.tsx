"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
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
