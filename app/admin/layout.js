'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminChatWidget from '@/components/AdminChatWidget'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Don't show chat on signin page
  const showChat = pathname !== '/admin/signin'

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for signin page
      if (pathname === '/admin/signin') {
        setChecking(false)
        setIsAuthorized(true)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/admin/signin')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role !== 'admin') {
          router.push('/admin/signin')
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/admin/signin')
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  // Show loading spinner while checking auth
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  // Only render children if authorized
  if (!isAuthorized) {
    return null
  }

  return (
    <>
      {children}
      {showChat && <AdminChatWidget />}
    </>
  )
}