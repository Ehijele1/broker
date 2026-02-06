'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  ArrowUpRight, ArrowDownLeft, Search, Filter, Download,
  TrendingUp, DollarSign, Users, Calendar
} from 'lucide-react'

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransactions: 0,
    netFlow: 0
  })

  // Load theme preference and listen for changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }

    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setIsDarkMode(e.newValue === 'dark')
      }
    }

    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem('theme')
      setIsDarkMode(savedTheme === 'dark')
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('themeChange', handleThemeChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('themeChange', handleThemeChange)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      // Fetch deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (depositsError) throw depositsError

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (withdrawalsError) throw withdrawalsError

      // Combine and format transactions
      const deposits = (depositsData || []).map(d => ({
        ...d,
        type: 'deposit',
        icon: ArrowDownLeft,
        color: 'text-green-400'
      }))

      const withdrawals = (withdrawalsData || []).map(w => ({
        ...w,
        type: 'withdrawal',
        icon: ArrowUpRight,
        color: 'text-rose-400'
      }))

      const allTransactions = [...deposits, ...withdrawals].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )

      setTransactions(allTransactions)

      // Calculate stats
      const totalDeposits = deposits
        .filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + Number(d.amount), 0)

      const totalWithdrawals = withdrawals
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + Number(w.amount), 0)

      setStats({
        totalDeposits,
        totalWithdrawals,
        totalTransactions: allTransactions.length,
        netFlow: totalDeposits - totalWithdrawals
      })
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus
    const matchesSearch = 
      transaction.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesType && matchesStatus && matchesSearch
  })

  const exportTransactions = () => {
    const csv = [
      ['Date', 'User', 'Email', 'Type', 'Method', 'Amount', 'Status'],
      ...filteredTransactions.map(t => [
        new Date(t.created_at).toLocaleString(),
        t.profiles?.full_name,
        t.profiles?.email,
        t.type,
        t.payment_method,
        `${t.currency} ${t.amount}`,
        t.status
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `admin-transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="flex justify-center">
          <div className="relative">
            {/* Logo */}
            <div className={`w-20 h-20 rounded-lg flex items-center justify-center shadow-lg ${
            isDarkMode
              ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
              : 'bg-gradient-to-br from-blue-600 to-indigo-600'
          }`}>
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            </div>
            
            {/* Spinning circle around logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-24 h-24 border-4 rounded-full animate-spin ${
                isDarkMode
                ? 'border-emerald-500/20 border-t-emerald-500'
                : 'border-indigo-200 border-t-indigo-600'
                }`}>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          All Transactions
        </h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
          Monitor all platform deposits and withdrawals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Deposits"
          value={`$${stats.totalDeposits.toFixed(2)}`}
          icon={<ArrowDownLeft />}
          color="green"
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Total Withdrawals"
          value={`$${stats.totalWithdrawals.toFixed(2)}`}
          icon={<ArrowUpRight />}
          color="rose"
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Net Flow"
          value={`$${stats.netFlow.toFixed(2)}`}
          icon={<TrendingUp />}
          color={stats.netFlow >= 0 ? 'green' : 'rose'}
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Total Transactions"
          value={stats.totalTransactions}
          icon={<Calendar />}
          color="purple"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Filters */}
      <div className={`rounded-2xl p-4 border ${
        isDarkMode 
          ? 'bg-slate-900/50 backdrop-blur-sm border-purple-800/50' 
          : 'bg-white border-indigo-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500' 
                  : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
              }`}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500' 
                : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
            }`}
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              isDarkMode 
                ? 'bg-slate-800 border-slate-700 text-white focus:ring-purple-500' 
                : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
            }`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={exportTransactions}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
            }`}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`rounded-2xl overflow-hidden border ${
        isDarkMode 
          ? 'bg-slate-900/50 backdrop-blur-sm border-purple-800/50' 
          : 'bg-white border-indigo-200 shadow-sm'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-slate-800/50' : 'bg-indigo-50'}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>User</th>
                <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>Type</th>
                <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>Method</th>
                <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>Amount</th>
                <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>Status</th>
                <th className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>Date</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/50' : 'divide-indigo-100'}`}>
              {filteredTransactions.map((transaction) => {
                const Icon = transaction.icon
                const isDeposit = transaction.type === 'deposit'
                
                return (
                  <tr key={transaction.id} className={isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-indigo-50/50'}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-purple-400 to-indigo-500' 
                            : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                        }`}>
                          {transaction.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {transaction.profiles?.full_name}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {transaction.profiles?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${
                          isDarkMode 
                            ? transaction.color 
                            : isDeposit ? 'text-green-600' : 'text-rose-600'
                        }`} />
                        <span className={`font-medium capitalize ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className={`font-medium capitalize ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{transaction.payment_method}</div>
                        {transaction.network && (
                          <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                            {transaction.network}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-bold text-lg ${
                        isDarkMode 
                          ? transaction.color 
                          : isDeposit ? 'text-green-600' : 'text-rose-600'
                      }`}>
                        {isDeposit ? '+' : '-'}{transaction.currency} {Number(transaction.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'pending' 
                          ? isDarkMode
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-300'
                          : transaction.status === 'approved'
                          ? isDarkMode
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-green-50 text-green-700 border border-green-300'
                          : isDarkMode
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-red-50 text-red-700 border border-red-300'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className={`w-16 h-16 mx-auto mb-4 ${
              isDarkMode ? 'text-slate-600' : 'text-indigo-300'
            }`} />
            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              No transactions found
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, isDarkMode }) {
  const colorClasses = {
    green: isDarkMode 
      ? 'from-green-500/20 to-emerald-500/20 border-green-500/30'
      : 'bg-white border-indigo-200 shadow-sm',
    rose: isDarkMode 
      ? 'from-rose-500/20 to-pink-500/20 border-rose-500/30'
      : 'bg-white border-indigo-200 shadow-sm',
    purple: isDarkMode 
      ? 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30'
      : 'bg-white border-indigo-200 shadow-sm'
  }

  const iconColor = {
    green: isDarkMode ? 'text-green-400' : 'text-indigo-600',
    rose: isDarkMode ? 'text-rose-400' : 'text-indigo-600',
    purple: isDarkMode ? 'text-purple-400' : 'text-indigo-600'
  }

  const bgClass = isDarkMode ? 'bg-gradient-to-br' : ''

  return (
    <div className={`${bgClass} ${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{label}</p>
        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-indigo-50'}`}>
          <span className={iconColor[color]}>{icon}</span>
        </div>
      </div>
      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}