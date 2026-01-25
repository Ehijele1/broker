'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'
import UserChat from '@/components/userchat'
import { 
  BarChart3, Activity, ChartCandlestick, Wallet, ArrowUpRight, 
  ShieldCheck, History, Boxes, Bell, Settings, LogOut, Menu, X, 
  CalendarDays, Vault, UserRound
} from 'lucide-react'

export default function UserLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
  
      setUser(user)
  
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
  
      if (profileError) {
        console.error('Profile error:', profileError)
        setLoading(false)
        return
      }
  
      if (profileData.role === 'admin') {
        router.push('/admin/dashboard')
        return
      }
  
      setProfile(profileData)
      
      // Update session on load using your RPC function
      await supabase.rpc('update_user_session', {
        p_user_id: user.id
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update user session periodically using your RPC function
  useEffect(() => {
    if (!user) return

    // Update every 2 minutes to keep user active
    const interval = setInterval(async () => {
      try {
        await supabase.rpc('update_user_session', {
          p_user_id: user.id
        })
      } catch (error) {
        console.error('Error updating session:', error)
      }
    }, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  const handleSignOut = async () => {
    // Mark user as offline before signing out
    if (user) {
      try {
        await supabase
          .from('active_sessions')
          .update({ is_online: false })
          .eq('user_id', user.id)
      } catch (error) {
        console.error('Error updating session on signout:', error)
      }
    }
    
    await supabase.auth.signOut()
    router.push('/signin')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }

  if (!loading && !user) {
    router.push('/signin')
    return null
  }
  
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">SecureTrading</h1>
                  <p className="text-xs text-slate-400">Premium Trading</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              <NavItem icon={BarChart3} label="Dashboard" href="/user/dashboard" currentPath={pathname} />
              <NavItem icon={Activity} label="Trade" href="/user/trade" currentPath={pathname} />
              <NavItem icon={ChartCandlestick} label="My Trades" href="/user/my-trades" currentPath={pathname} />
              <NavItem icon={Vault} label="Deposit" href="/user/deposit" currentPath={pathname} />
              <NavItem icon={UserRound} label="Copy Trader" href="/user/copy-trader" currentPath={pathname} />
              <NavItem icon={Boxes} label="Upgrade Plan" href="/user/upgrade" currentPath={pathname} />
              <NavItem icon={Wallet} label="Withdrawal" href="/user/withdrawal" currentPath={pathname} />
              <NavItem icon={CalendarDays} label="All Transactions" href="/user/transactions" currentPath={pathname} />
              <NavItem icon={ShieldCheck} label="Verification" href="/user/verification" currentPath={pathname} />
              <NavItem icon={Settings} label="Settings" href="/user/settings" currentPath={pathname} />
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-800/50">
            <div className="flex items-center gap-3 mb-3">
              {/* Profile Photo Button */}
              <button
                onClick={() => router.push('/user/settings')}
                className="group relative"
                title="Go to Settings"
              >
                {profile.profile_photo_url ? (
                  <img 
                    src={profile.profile_photo_url} 
                    alt={profile.full_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-colors"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-colors">
                    {profile.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{profile.full_name}</p>
                <p className="text-xs text-slate-400 truncate">@{profile.username}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-xl font-bold">Welcome back, {profile.full_name}!</h2>
                  <p className="text-sm text-slate-400">Track and manage your investments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Use your existing NotificationBell component */}
                <NotificationBell userId={user.id} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {children}
        </div>
      </main>

      {/* User Chat Component - Floating chat for all user pages */}
      <UserChat />
    </div>
  )
}

// Navigation Item Component
function NavItem({ icon: Icon, label, href, currentPath }) {
  const router = useRouter()
  const isActive = currentPath === href
  
  return (
    <button 
      onClick={() => router.push(href)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive 
          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  )
}