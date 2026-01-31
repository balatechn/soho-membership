"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

export function ActivityTracker() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user) return

    // Update activity immediately on mount
    const updateActivity = async () => {
      try {
        await fetch("/api/users/activity", { method: "POST" })
      } catch (error) {
        // Silently fail - not critical
      }
    }

    updateActivity()

    // Update activity every 2 minutes
    const interval = setInterval(updateActivity, 2 * 60 * 1000)

    // Update on user interaction
    const handleActivity = () => {
      updateActivity()
    }

    // Listen for user activity
    window.addEventListener("click", handleActivity)
    window.addEventListener("keydown", handleActivity)

    return () => {
      clearInterval(interval)
      window.removeEventListener("click", handleActivity)
      window.removeEventListener("keydown", handleActivity)
    }
  }, [session])

  return null // This component doesn't render anything
}
