'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

export default function InactivityMonitor({ userId }) {
  const router = useRouter()
  const pathname = usePathname()
  const timeoutRef = useRef(null)
  const INACTIVITY_TIMEOUT = 60 * 60 * 1000 // 1 hour
  

  // Reset the inactivity timer
  const resetTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_TIMEOUT)

    console.log('[INACTIVITY] Timer reset - will logout after 1 hour of inactivity')
  }

  // Handle logout
  const handleLogout = async () => {
    console.log('[INACTIVITY] User inactive for 1 hour - logging out')
    
    try {
      // Mark user as offline
      await supabase
        .from('active_sessions')
        .update({ is_online: false })
        .eq('user_id', userId)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Redirect to signin
      router.push('/signin')
    } catch (error) {
      console.error('[INACTIVITY] Error during logout:', error)
      // Force redirect even if there's an error
      router.push('/signin')
    }
  }

  useEffect(() => {
    if (!userId) return

    console.log('[INACTIVITY] Monitor started for user:', userId)

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
      
      console.log('[INACTIVITY] Monitor stopped')
    }
  }, [userId])

  // Track route changes as activity
  useEffect(() => {
    if (!userId) return
    
    console.log('[INACTIVITY] Route changed - resetting timer')
    resetTimer()
  }, [pathname])

  // This component doesn't render anything
  return null
}