'use client'
import { usePathname } from 'next/navigation'
import AdminChatWidget from '@/components/AdminChatWidget'

export default function AdminLayout({ children }) {
  const pathname = usePathname()
  
  // Don't show chat on signin page
  const showChat = pathname !== '/admin/signin'

  return (
    <>
      {children}
      {showChat && <AdminChatWidget />}
    </>
  )
}