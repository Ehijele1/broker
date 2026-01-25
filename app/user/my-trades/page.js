'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, TrendingDown, Clock, CheckCircle, XCircle,
  Filter, DollarSign, Activity, ArrowUpRight, ArrowDownLeft
} from 'lucide-react'

export default function MyTrades() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalProfit: 0,
    totalLoss: 0
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/signin')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      await fetchTrades(user.id)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrades = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTrades(data || [])

      // Calculate stats
      const active = data.filter(t => t.status === 'active').length
      const completed = data.filter(t => t.status === 'completed').length
      const totalProfit = data
        .filter(t => t.outcome === 'profit')
        .reduce((sum, t) => sum + Number(t.profit_loss_amount || 0), 0)
      const totalLoss = data
        .filter(t => t.outcome === 'loss')
        .reduce((sum, t) => sum + Number(t.profit_loss_amount || 0), 0)

      setStats({ active, completed, totalProfit, totalLoss: Math.abs(totalLoss) })
    } catch (error) {
      console.error('Error fetching trades:', error)
    }
  }

  const filteredTrades = trades.filter(trade => {
    if (filterStatus === 'all') return true
    return trade.status === filterStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Trades</h1>
        <p className="text-slate-400">View your trading history and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Trades" value={stats.active} icon={<Clock />} color="yellow" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle />} color="blue" />
        <StatCard 
          label="Total Profit" 
          value={`${profile.currency} ${stats.totalProfit.toFixed(2)}`} 
          icon={<TrendingUp />} 
          color="green" 
        />
        <StatCard 
          label="Total Loss" 
          value={`${profile.currency} ${stats.totalLoss.toFixed(2)}`} 
          icon={<TrendingDown />} 
          color="red" 
        />
      </div>

      {/* Filter */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-800/50">
        <div className="flex items-center justify-between">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Trades</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-sm text-slate-400">
            Showing {filteredTrades.length} of {trades.length} trades
          </span>
        </div>
      </div>

      {/* Trades List */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 overflow-hidden">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No trades found</p>
            <p className="text-slate-500 text-sm mt-1">Your trades will appear here</p>
            <button
              onClick={() => router.push('/user/trade')}
              className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-colors"
            >
              Start Trading
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Asset</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Leverage</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Entry Price</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">P/L</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{trade.asset}</div>
                      <div className="text-xs text-slate-400">{trade.timeframe}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {trade.trade_type === 'buy' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                        )}
                        <span className={`font-medium uppercase ${
                          trade.trade_type === 'buy' ? 'text-green-400' : 'text-rose-400'
                        }`}>
                          {trade.trade_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">
                        {profile.currency} {Number(trade.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-800 rounded text-xs font-semibold">
                        {trade.leverage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">${Number(trade.entry_price).toFixed(2)}</div>
                      {trade.exit_price && (
                        <div className="text-xs text-slate-400">
                          Exit: ${Number(trade.exit_price).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {trade.outcome ? (
                        <div className={`font-bold ${
                          trade.outcome === 'profit' ? 'text-green-400' : 'text-rose-400'
                        }`}>
                          {trade.outcome === 'profit' ? '+' : '-'}
                          {profile.currency} {Math.abs(Number(trade.profit_loss_amount || 0)).toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        trade.status === 'active' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : trade.status === 'completed'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {trade.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(trade.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30'
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