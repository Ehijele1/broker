'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle,
  AlertCircle, Calendar, DollarSign, Filter, Search, X,
  ChevronDown, Download, RefreshCw, CreditCard, Wallet,
  TrendingUp, Activity
} from 'lucide-react'

export default function AllTransactionsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all') // all, deposit, withdrawal, trade
  const [filterStatus, setFilterStatus] = useState('all') // all, pending, approved, rejected, active, closed
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState('all') // all, today, week, month

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchTransactions()
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

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true)
      
      // Fetch deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (depositsError) throw depositsError

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (withdrawalsError) throw withdrawalsError

      // Fetch trades
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (tradesError) throw tradesError

      // Combine and format transactions
      const formattedDeposits = (depositsData || []).map(deposit => ({
        ...deposit,
        type: 'deposit',
        date: deposit.created_at
      }))

      const formattedWithdrawals = (withdrawalsData || []).map(withdrawal => ({
        ...withdrawal,
        type: 'withdrawal',
        date: withdrawal.created_at
      }))

      const formattedTrades = (tradesData || []).map(trade => ({
        ...trade,
        type: 'trade',
        date: trade.created_at,
        // For trades, amount represents the trade value
        // Status can be 'active' or 'closed'
      }))

      // Combine and sort by date
      const allTransactions = [...formattedDeposits, ...formattedWithdrawals, ...formattedTrades]
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      setTransactions(allTransactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setTransactionsLoading(false)
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'closed':
        return 'text-emerald-400 bg-emerald-500/20'
      case 'pending':
      case 'active':
        return 'text-amber-400 bg-amber-500/20'
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return 'text-rose-400 bg-rose-500/20'
      default:
        return 'text-slate-400 bg-slate-500/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
      case 'active':
        return <Clock className="w-4 h-4" />
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const filterByDateRange = (transaction) => {
    if (dateRange === 'all') return true
    
    const transactionDate = new Date(transaction.date)
    const now = new Date()
    
    switch (dateRange) {
      case 'today':
        return transactionDate.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.setDate(now.getDate() - 7))
        return transactionDate >= weekAgo
      case 'month':
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
        return transactionDate >= monthAgo
      default:
        return true
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    // Type filter
    if (filterType !== 'all' && transaction.type !== filterType) return false
    
    // Status filter
    if (filterStatus !== 'all' && transaction.status?.toLowerCase() !== filterStatus) return false
    
    // Search filter (by amount or method)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesAmount = transaction.amount?.toString().includes(searchQuery)
      const matchesMethod = transaction.payment_method?.toLowerCase().includes(searchLower) ||
                           transaction.method?.toLowerCase().includes(searchLower)
      if (!matchesAmount && !matchesMethod) return false
    }

    // Date range filter
    if (!filterByDateRange(transaction)) return false
    
    return true
  })

  // Calculate statistics
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'approved')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const totalTradesProfit = transactions
    .filter(t => t.type === 'trade' && t.status === 'closed')
    .reduce((sum, t) => sum + (t.profit || 0), 0)
  
  const pendingTransactions = transactions.filter(t => t.status === 'pending').length
  const activeTrades = transactions.filter(t => t.type === 'trade' && t.status === 'active').length

  if (loading) {
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
          <h1 className="text-3xl font-bold mb-2">All Transactions</h1>
          <p className="text-slate-400">View and manage your transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Deposits"
          value={`${profile.currency} ${totalDeposits.toFixed(2)}`}
          icon={<ArrowUpRight className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="Total Withdrawals"
          value={`${profile.currency} ${totalWithdrawals.toFixed(2)}`}
          icon={<ArrowDownLeft className="w-5 h-5" />}
          color="rose"
        />
        <StatCard
          label="Trades P/L"
          value={`${profile.currency} ${totalTradesProfit.toFixed(2)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color={totalTradesProfit >= 0 ? "emerald" : "rose"}
        />
        <StatCard
          label="Active Trades"
          value={activeTrades}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Pending"
          value={pendingTransactions}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
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
              placeholder="Search by amount or method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          {/* Quick Filters */}
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="trade">Trades</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* More Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span className="hidden md:inline">More</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div>
              <label className="block text-sm font-medium mb-2">Date Range</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last 7 Days' },
                  { value: 'month', label: 'Last 30 Days' }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setDateRange(range.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateRange === range.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      {transactionsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-800/50 text-center">
          <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Transactions Found</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery || filterType !== 'all' || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'You haven\'t made any transactions yet'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push('/user/deposit')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold transition-all"
            >
              Make a Deposit
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Type</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Amount</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Method</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-slate-400">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={`${transaction.type}-${transaction.id}`}
                    transaction={transaction}
                    currency={profile.currency}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={`${transaction.type}-${transaction.id}`}
                transaction={transaction}
                currency={profile.currency}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results Info */}
      {filteredTransactions.length > 0 && (
        <div className="text-center text-sm text-slate-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      )}
    </div>
  )
}

// Stat Card Component
function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    rose: 'from-rose-500/20 to-pink-500/20 border-rose-500/30',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
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

// Transaction Row Component (Desktop)
function TransactionRow({ transaction, currency, formatDate, getStatusColor, getStatusIcon }) {
  const isDeposit = transaction.type === 'deposit'
  const isWithdrawal = transaction.type === 'withdrawal'
  const isTrade = transaction.type === 'trade'

  // For trades, determine if it's profit or loss
  const tradeProfit = isTrade ? (transaction.profit || 0) : 0
  const isTradeProfit = tradeProfit >= 0

  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isDeposit ? 'bg-emerald-500/20 text-emerald-400' : 
            isWithdrawal ? 'bg-rose-500/20 text-rose-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {isDeposit ? <ArrowUpRight className="w-5 h-5" /> : 
             isWithdrawal ? <ArrowDownLeft className="w-5 h-5" /> :
             <Activity className="w-5 h-5" />}
          </div>
          <div>
            <span className="font-semibold capitalize">{transaction.type}</span>
            {isTrade && transaction.asset && (
              <p className="text-xs text-slate-400">{transaction.asset}</p>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        {isTrade ? (
          <div>
            <span className={`font-bold ${isTradeProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isTradeProfit ? '+' : ''}{currency} {tradeProfit.toFixed(2)}
            </span>
            <p className="text-xs text-slate-400">
              Amount: {currency} {transaction.amount?.toFixed(2) || '0.00'}
            </p>
          </div>
        ) : (
          <span className={`font-bold ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isDeposit ? '+' : '-'}{currency} {transaction.amount?.toFixed(2) || '0.00'}
          </span>
        )}
      </td>
      <td className="p-4">
        <span className="text-slate-300 capitalize">
          {isTrade ? (transaction.market || 'Trade') : (transaction.payment_method || transaction.method || 'N/A')}
        </span>
      </td>
      <td className="p-4">
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(transaction.status)}`}>
          {getStatusIcon(transaction.status)}
          {transaction.status || 'pending'}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1 text-sm text-slate-400">
          <Calendar className="w-4 h-4" />
          {formatDate(transaction.date)}
        </div>
      </td>
      <td className="p-4">
        <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
          View
        </button>
      </td>
    </tr>
  )
}

// Transaction Card Component (Mobile)
function TransactionCard({ transaction, currency, formatDate, getStatusColor, getStatusIcon }) {
  const isDeposit = transaction.type === 'deposit'
  const isWithdrawal = transaction.type === 'withdrawal'
  const isTrade = transaction.type === 'trade'

  // For trades, determine if it's profit or loss
  const tradeProfit = isTrade ? (transaction.profit || 0) : 0
  const isTradeProfit = tradeProfit >= 0

  return (
    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isDeposit ? 'bg-emerald-500/20 text-emerald-400' : 
            isWithdrawal ? 'bg-rose-500/20 text-rose-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {isDeposit ? <ArrowUpRight className="w-5 h-5" /> : 
             isWithdrawal ? <ArrowDownLeft className="w-5 h-5" /> :
             <Activity className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-semibold capitalize">{transaction.type}</p>
            <p className="text-xs text-slate-400 capitalize">
              {isTrade ? (transaction.asset || transaction.market || 'Trade') : (transaction.payment_method || transaction.method || 'N/A')}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(transaction.status)}`}>
          {getStatusIcon(transaction.status)}
          {transaction.status || 'pending'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        {isTrade ? (
          <div>
            <span className={`text-2xl font-bold ${isTradeProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isTradeProfit ? '+' : ''}{currency} {tradeProfit.toFixed(2)}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Trade: {currency} {transaction.amount?.toFixed(2) || '0.00'}
            </p>
          </div>
        ) : (
          <span className={`text-2xl font-bold ${isDeposit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isDeposit ? '+' : '-'}{currency} {transaction.amount?.toFixed(2) || '0.00'}
          </span>
        )}
        <div className="text-right">
          <p className="text-xs text-slate-400">{formatDate(transaction.date)}</p>
          <button className="text-emerald-400 hover:text-emerald-300 text-xs font-medium mt-1">
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}