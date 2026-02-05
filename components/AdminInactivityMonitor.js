'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const ADMIN_LAST_ACTIVITY_KEY = 'admin_last_activity_time'

export default function AdminInactivityMonitor({ userId }) {
  const router = useRouter()
  const pathname = usePathname()
  const timeoutRef = useRef(null)
  const ADMIN_INACTIVITY_TIMEOUT = 60 * 60 * 1000 // 1 hour
  const ADMIN_SESSION_MAX_AGE = 60 * 60 * 1000 // 1 hour (same as inactivity for admins)

  // Check if admin session is expired (on page load/reload)
  const checkSessionExpiry = async () => {
    const now = Date.now()
    
    // Check last activity - this is the main check
    const lastActivity = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY)
    if (lastActivity) {
      const timeSinceActivity = now - parseInt(lastActivity)
      
      // If admin was away for more than 1 hour (closed tab/disconnected/inactive)
      if (timeSinceActivity > ADMIN_SESSION_MAX_AGE) {
        console.log('[ADMIN INACTIVITY] Session expired - last activity was', Math.floor(timeSinceActivity / 1000 / 60), 'minutes ago')
        await handleLogout()
        return false
      }
    }

    return true
  }

  // Reset the inactivity timer
  const resetTimer = () => {
    // Update last activity time
    const now = Date.now()
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, now.toString())

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout()
    }, ADMIN_INACTIVITY_TIMEOUT)

    console.log('[ADMIN INACTIVITY] Timer reset - will logout after 1 hour of inactivity')
  }

  // Handle logout
  const handleLogout = async () => {
    console.log('[ADMIN INACTIVITY] Logging out admin user')
    
    try {
      // Clear admin session tracking
      localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY)
      
      // Mark admin as offline
      if (userId) {
        await supabase
          .from('active_sessions')
          .update({ is_online: false })
          .eq('user_id', userId)
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Redirect to signin
      router.push('/signin')
    } catch (error) {
      console.error('[ADMIN INACTIVITY] Error during logout:', error)
      // Force redirect even if there's an error
      router.push('/signin')
    }
  }

  // Initial session check on mount
  useEffect(() => {
    if (!userId) return

    console.log('[ADMIN INACTIVITY] Checking admin session validity for user:', userId)
    
    checkSessionExpiry().then(isValid => {
      if (!isValid) {
        console.log('[ADMIN INACTIVITY] Admin session invalid - redirecting to signin')
        return
      }
      
      console.log('[ADMIN INACTIVITY] Admin session valid - starting monitor')
    })
  }, [])

  useEffect(() => {
    if (!userId) return

    console.log('[ADMIN INACTIVITY] Admin monitor started for user:', userId)

    // Events to track for activity
    const events = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'mousemove'
    ]

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer, true)
    })

    // Start initial timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer, true)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      console.log('[ADMIN INACTIVITY] Admin monitor stopped')
    }
  }, [userId])

  // Track route changes as activity
  useEffect(() => {
    if (!userId) return
    
    console.log('[ADMIN INACTIVITY] Route changed - resetting admin timer')
    resetTimer()
  }, [pathname])

  // This component doesn't render anything
  return null
}