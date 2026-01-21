'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, TrendingDown, Clock, DollarSign, Calendar,
  Filter, Search, X, ChevronDown, Activity, AlertCircle,
  CheckCircle, XCircle, Timer, ArrowUpRight, ArrowDownLeft
} from 'lucide-react'

export default function MyTradesPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // all, active, closed
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMarket, setFilterMarket] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [trades, setTrades] = useState([])
  const [tradesLoading, setTradesLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchTrades()
    }
  }, [profile])

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
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrades = async () => {
    try {
      setTradesLoading(true)
      
      const { data: tradesData, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTrades(tradesData || [])
    } catch (error) {
      console.error('Error fetching trades:', error)
      setTrades([])
    } finally {
      setTradesLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeElapsed = (openTime) => {
    if (!openTime) return 'N/A'
    const now = new Date()
    const open = new Date(openTime)
    const diff = now - open
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h ago`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ago`
    } else {
      return `${minutes}m ago`
    }
  }

  // Filter trades based on active tab and filters
  const filteredTrades = trades.filter(trade => {
    // Tab filter
    if (activeTab === 'active' && trade.status !== 'active') return false
    if (activeTab === 'closed' && trade.status !== 'closed') return false

    // Search filter
    if (searchQuery && !trade.asset.toLowerCase().includes(searchQuery.toLowerCase())) return false

    // Market filter
    if (filterMarket !== 'all' && trade.market !== filterMarket) return false

    // Status filter
    if (filterStatus === 'profit' && trade.profit <= 0) return false
    if (filterStatus === 'loss' && trade.profit >= 0) return false

    return true
  })

  // Calculate statistics
  const totalTrades = trades.length
  const activeTrades = trades.filter(t => t.status === 'active').length
  const closedTrades = trades.filter(t => t.status === 'closed').length
  const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0)
  const winningTrades = trades.filter(t => t.status === 'closed' && t.profit > 0).length
  const winRate = closedTrades > 0 ? ((winningTrades / closedTrades) * 100).toFixed(1) : 0

  if (loading || tradesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Trades</h1>
          <p className="text-slate-400">View and manage all your trading activity</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/user/trade')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Activity className="w-5 h-5" />
            New Trade
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          label="Total Trades" 
          value={totalTrades} 
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <StatCard 
          label="Active Trades" 
          value={activeTrades} 
          icon={<Timer className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard 
          label="Closed Trades" 
          value={closedTrades} 
          icon={<CheckCircle className="w-5 h-5" />}
          color="slate"
        />
        <StatCard 
          label="Total P/L" 
          value={`$${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          color={totalProfit >= 0 ? "emerald" : "rose"}
        />
        <StatCard 
          label="Win Rate" 
          value={`${winRate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="purple"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-800/50">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by asset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-700">
            <div>
              <label className="block text-sm font-medium mb-2">Market Type</label>
              <select
                value={filterMarket}
                onChange={(e) => setFilterMarket(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Markets</option>
                <option value="Stock">Stock</option>
                <option value="Crypto">Crypto</option>
                <option value="Forex">Forex</option>
                <option value="Indices">Indices</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Performance</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Trades</option>
                <option value="profit">Profitable Only</option>
                <option value="loss">Loss Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <TabButton 
          label="All Trades" 
          count={totalTrades}
          isActive={activeTab === 'all'}
          onClick={() => setActiveTab('all')}
        />
        <TabButton 
          label="Active" 
          count={activeTrades}
          isActive={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
        />
        <TabButton 
          label="Closed" 
          count={closedTrades}
          isActive={activeTab === 'closed'}
          onClick={() => setActiveTab('closed')}
        />
      </div>

      {/* Trades List */}
      <div className="space-y-4">
        {filteredTrades.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-800/50 text-center">
            <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No trades found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || filterMarket !== 'all' || filterStatus !== 'all' 
                ? 'Try adjusting your filters or search query'
                : 'Start trading to see your trades here'}
            </p>
            <button
              onClick={() => router.push('/user/trade')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold transition-all"
            >
              Start Trading
            </button>
          </div>
        ) : (
          filteredTrades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} formatDate={formatDate} getTimeElapsed={getTimeElapsed} />
          ))
        )}
      </div>
    </div>
  )
}

// Tab Button Component
function TabButton({ label, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
        isActive 
          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
      }`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        isActive ? 'bg-emerald-500/20' : 'bg-slate-700'
      }`}>
        {count}
      </span>
    </button>
  )
}

// Stat Card Component
function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    slate: 'from-slate-500/20 to-slate-600/20 border-slate-500/30',
    rose: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    purple: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30'
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

// Trade Card Component
function TradeCard({ trade, formatDate, getTimeElapsed }) {
  const isProfit = trade.profit >= 0
  const isActive = trade.status === 'active'

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section - Asset Info */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            trade.type === 'buy' 
              ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400' 
              : 'bg-gradient-to-br from-rose-500/20 to-pink-500/20 text-rose-400'
          }`}>
            {trade.type === 'buy' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">{trade.asset}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                trade.type === 'buy' 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {trade.type.toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                isActive 
                  ? 'bg-blue-500/20 text-blue-400 animate-pulse' 
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {isActive ? 'ACTIVE' : 'CLOSED'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {trade.market || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {trade.leverage || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {trade.timeframe || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section - Price Info */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-400 mb-1">Entry Price</p>
            <p className="text-lg font-semibold">${trade.entry_price?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Current Price</p>
            <p className="text-lg font-semibold">${trade.current_price?.toLocaleString() || '0'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Amount</p>
            <p className="text-lg font-semibold">{trade.amount || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Account</p>
            <p className="text-lg font-semibold capitalize">{trade.account_type || 'N/A'}</p>
          </div>
        </div>

        {/* Right Section - P/L */}
        <div className="text-right">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
            isProfit 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <div>
              <p className="text-2xl font-bold">
                {isProfit ? '+' : ''}{trade.profit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
              </p>
              <p className="text-sm font-semibold">
                {isProfit ? '+' : ''}{trade.profit_percent?.toFixed(2) || '0.00'}%
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            <div className="flex items-center justify-end gap-1 mb-1">
              <Calendar className="w-3 h-3" />
              <span>Opened: {formatDate(trade.created_at)}</span>
            </div>
            {isActive ? (
              <div className="flex items-center justify-end gap-1 text-blue-400">
                <Timer className="w-3 h-3" />
                <span>{getTimeElapsed(trade.created_at)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Closed: {formatDate(trade.close_time)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}