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
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTransactions: 0,
    netFlow: 0
  })

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-1">All Transactions</h1>
        <p className="text-slate-400">Monitor all platform deposits and withdrawals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Deposits"
          value={`$${stats.totalDeposits.toFixed(2)}`}
          icon={<ArrowDownLeft />}
          color="green"
        />
        <StatCard
          label="Total Withdrawals"
          value={`$${stats.totalWithdrawals.toFixed(2)}`}
          icon={<ArrowUpRight />}
          color="rose"
        />
        <StatCard
          label="Net Flow"
          value={`$${stats.netFlow.toFixed(2)}`}
          icon={<TrendingUp />}
          color={stats.netFlow >= 0 ? 'green' : 'rose'}
        />
        <StatCard
          label="Total Transactions"
          value={stats.totalTransactions}
          icon={<Calendar />}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-800/50">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={exportTransactions}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="text-sm text-slate-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-800/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Method</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredTransactions.map((transaction) => {
                const Icon = transaction.icon
                const isDeposit = transaction.type === 'deposit'
                
                return (
                  <tr key={transaction.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                          {transaction.profiles?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.profiles?.full_name}</div>
                          <div className="text-sm text-slate-400">{transaction.profiles?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${transaction.color}`} />
                        <span className="font-medium capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium capitalize">{transaction.payment_method}</div>
                        {transaction.network && (
                          <div className="text-slate-400">{transaction.network}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-bold text-lg ${transaction.color}`}>
                        {isDeposit ? '+' : '-'}{transaction.currency} {Number(transaction.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : transaction.status === 'approved'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
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
            <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
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