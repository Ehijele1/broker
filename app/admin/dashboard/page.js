'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ActiveUsers from '@/components/ActiveUsers'
import { 
  DollarSign, TrendingUp, Users, Activity,
  ArrowUpRight, ArrowDownLeft, Settings, Bitcoin, Building2, RefreshCw
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeTrades: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    cryptoAddressCount: 0,
    bankAccountCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
    setupRealtimeSubscriptions()
  }, [])

  const setupRealtimeSubscriptions = () => {
    // Subscribe to deposits changes
    const depositsChannel = supabase
      .channel('deposits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deposits'
        },
        () => {
          console.log('Deposit change detected, refreshing stats...')
          fetchDashboardStats()
        }
      )
      .subscribe()

    // Subscribe to withdrawals changes
    const withdrawalsChannel = supabase
      .channel('withdrawals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals'
        },
        () => {
          console.log('Withdrawal change detected, refreshing stats...')
          fetchDashboardStats()
        }
      )
      .subscribe()

    // Subscribe to trades changes
    const tradesChannel = supabase
      .channel('trades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades'
        },
        () => {
          console.log('Trade change detected, refreshing stats...')
          fetchDashboardStats()
        }
      )
      .subscribe()

    // Subscribe to profiles changes (new users)
    const profilesChannel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('New user detected, refreshing stats...')
          fetchDashboardStats()
        }
      )
      .subscribe()

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(depositsChannel)
      supabase.removeChannel(withdrawalsChannel)
      supabase.removeChannel(tradesChannel)
      supabase.removeChannel(profilesChannel)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        usersCount,
        depositsSum,
        withdrawalsSum,
        tradesCount,
        pendingDepositsCount,
        pendingWithdrawalsCount,
        cryptoCount,
        bankCount
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('deposits').select('amount').eq('status', 'approved'),
        supabase.from('withdrawals').select('amount').eq('status', 'approved'),
        supabase.from('trades').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('crypto_addresses').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bank_accounts').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ])

      const totalDeposits = depositsSum.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0
      const totalWithdrawals = withdrawalsSum.data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0

      setStats({
        totalUsers: usersCount.count || 0,
        totalDeposits,
        totalWithdrawals,
        activeTrades: tradesCount.count || 0,
        pendingDeposits: pendingDepositsCount.count || 0,
        pendingWithdrawals: pendingWithdrawalsCount.count || 0,
        cryptoAddressCount: cryptoCount.count || 0,
        bankAccountCount: bankCount.count || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    setRefreshing(true)
    fetchDashboardStats()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header with Settings and Refresh Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-slate-400">Overview of your trading platform</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-semibold disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Payment Settings Button */}
          <button
            onClick={() => router.push('/admin/settings')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
          >
            <Settings className="w-5 h-5" />
            Payment Settings
          </button>
        </div>
      </div>

      {/* Real-time Update Indicator */}
      <div className="flex items-center gap-2 text-sm text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        Live updates enabled - Dashboard auto-refreshes when data changes
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users - Clickable */}
        <ClickableStatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={<Users />}
          color="purple"
          onClick={() => router.push('/admin/users')}
        />

        {/* Active Trades - Clickable */}
        <ClickableStatCard
          label="Active Trades"
          value={stats.activeTrades}
          icon={<TrendingUp />}
          color="blue"
          onClick={() => router.push('/admin/trades')}
        />

        {/* Pending Deposits - Clickable */}
        <ClickableStatCard
          label="Pending Deposits"
          value={stats.pendingDeposits}
          icon={<DollarSign />}
          color="yellow"
          alert={stats.pendingDeposits > 0}
          onClick={() => router.push('/admin/deposits')}
          subtitle={stats.pendingDeposits > 0 ? `${stats.pendingDeposits} awaiting approval` : 'No pending deposits'}
        />

        {/* Pending Withdrawals - Clickable */}
        <ClickableStatCard
          label="Pending Withdrawals"
          value={stats.pendingWithdrawals}
          icon={<Activity />}
          color="orange"
          alert={stats.pendingWithdrawals > 0}
          onClick={() => router.push('/admin/withdrawals')}
          subtitle={stats.pendingWithdrawals > 0 ? `${stats.pendingWithdrawals} awaiting approval` : 'No pending withdrawals'}
        />
      </div>

      {/* Financial Overview 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Total Deposits (Approved)"
          value={`$${stats.totalDeposits.toFixed(2)}`}
          icon={<ArrowDownLeft />}
          color="green"
        />
        <StatCard
          label="Total Withdrawals (Approved)"
          value={`$${stats.totalWithdrawals.toFixed(2)}`}
          icon={<ArrowUpRight />}
          color="red"
        />
      </div>*/}

      {/* Payment Methods Quick Stats */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-800/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Payment Methods</h3>
          <button
            onClick={() => router.push('/admin/settings')}
            className="text-sm text-purple-400 hover:text-purple-300 font-medium"
          >
            Manage →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Bitcoin className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Crypto Addresses</p>
              <p className="text-2xl font-bold">{stats.cryptoAddressCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Bank Accounts</p>
              <p className="text-2xl font-bold">{stats.bankAccountCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Users Component */}
      <ActiveUsers />
    </div>
  )
}

// Non-clickable Stat Card
function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-xl p-4 border`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

// Clickable Stat Card with Hover Effects
function ClickableStatCard({ label, value, icon, color, subtitle, alert, onClick }) {
  const colorClasses = {
    purple: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-fuchsia-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30 hover:from-red-500/30 hover:to-rose-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30',
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:from-orange-500/30 hover:to-amber-500/30'
  }

  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-xl p-4 border transition-all duration-200 hover:scale-105 hover:shadow-lg cursor-pointer text-left w-full ${
        alert ? 'ring-2 ring-yellow-500/50 animate-pulse' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <p className="text-sm text-slate-400">{label}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 bg-white/5 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold">{value}</p>
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}