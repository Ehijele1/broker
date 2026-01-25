'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, Clock, CheckCircle, XCircle,
  Search, Eye, DollarSign, User,
  ArrowUpRight, ArrowDownLeft, AlertCircle
} from 'lucide-react'

export default function AdminTrades() {
  const router = useRouter()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Close trade form
  const [outcome, setOutcome] = useState('profit')
  const [profitLossAmount, setProfitLossAmount] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalTrades: 0
  })

  useEffect(() => {
    fetchTrades()
  }, [])

  async function fetchTrades() {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            balance
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTrades(data || [])

      const active = data.filter(t => t.status === 'active').length
      const completed = data.filter(t => t.status === 'completed').length

      setStats({
        active,
        completed,
        totalTrades: data.length
      })

    } catch (err) {
      console.error('Fetch trades error:', err)
    } finally {
      setLoading(false)
    }
  }

  function filteredTrades() {
    return trades.filter(trade => {
      const matchesSearch =
        trade.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.asset?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = filterStatus === 'all' || trade.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }

  function openDetails(trade) {
    setSelectedTrade(trade)
    setOutcome('profit')
    setProfitLossAmount('')
    setExitPrice(trade.entry_price || '')
    setAdminNote('')
    setShowDetailsModal(true)
  }

  async function handleCloseTrade() {
    if (!profitLossAmount || !exitPrice) {
      alert('Enter profit/loss and exit price')
      return
    }

    try {
      setProcessing(true)

      const pl = Number(profitLossAmount)

      // Get user balance
      const { data: user } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', selectedTrade.user_id)
        .single()

      let newBalance = Number(user.balance)

      if (outcome === 'profit') {
        newBalance += pl
      } else {
        newBalance -= pl
      }

      // Update balance
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', selectedTrade.user_id)

      // Update trade
      await supabase
        .from('trades')
        .update({
          status: 'completed',
          outcome,
          profit_loss_amount: outcome === 'profit' ? pl : -pl,
          exit_price: Number(exitPrice),
          admin_note: adminNote,
          closed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user.id
        })
        .eq('id', selectedTrade.id)

      alert('Trade closed successfully')
      setShowDetailsModal(false)
      fetchTrades()

    } catch (err) {
      console.error(err)
      alert('Failed to close trade')
    } finally {
      setProcessing(false)
    }
  }

  async function handleCancelTrade() {
    if (!confirm('Cancel this trade?')) return

    try {
      setProcessing(true)

      await supabase
        .from('trades')
        .update({
          status: 'cancelled',
          admin_note: adminNote || 'Trade cancelled by admin',
          closed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user.id
        })
        .eq('id', selectedTrade.id)

      alert('Trade cancelled')
      setShowDetailsModal(false)
      fetchTrades()

    } catch (err) {
      console.error(err)
      alert('Cancel failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trade Management</h1>
          <p className="text-slate-400">Monitor and manage user trades</p>
        </div>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          Dashboard
        </button>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active Trades" value={stats.active} icon={<Clock />} color="yellow" />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle />} color="green" />
        <StatCard label="Total Trades" value={stats.totalTrades} icon={<TrendingUp />} color="purple" />
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 p-4 rounded-xl border border-purple-800/40">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 bg-slate-800 rounded-lg"
              placeholder="Search user or asset..."
              value={searchQuery}
              onChange={(e)=>setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="bg-slate-800 px-3 rounded-lg"
            value={filterStatus}
            onChange={(e)=>setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 rounded-xl border border-purple-800/40 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="p-4 text-left">User</th>
              <th>Asset</th>
              <th>Type</th>
              <th>Amount</th>
              <th>P/L</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredTrades().map(trade => (
              <tr key={trade.id} className="border-t border-slate-800 hover:bg-slate-800/40">
                <td className="p-4">
                  <div className="font-medium">{trade.profiles?.full_name}</div>
                  <div className="text-xs text-slate-400">{trade.profiles?.email}</div>
                </td>

                <td>{trade.asset}</td>

                <td>
                  {trade.trade_type === 'buy' ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <ArrowUpRight size={14}/> BUY
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <ArrowDownLeft size={14}/> SELL
                    </span>
                  )}
                </td>

                <td>${Number(trade.amount).toFixed(2)}</td>

                <td>
                  {trade.outcome ? (
                    <span className={trade.outcome === 'profit' ? 'text-green-400' : 'text-rose-400'}>
                      ${Number(trade.profit_loss_amount).toFixed(2)}
                    </span>
                  ) : '-'}
                </td>

                <td>
                  <span className="px-2 py-1 text-xs rounded bg-slate-800">
                    {trade.status}
                  </span>
                </td>

                <td className="text-xs text-slate-400">
                  {new Date(trade.created_at).toLocaleString()}
                </td>

                <td>
                  <button
                    onClick={()=>openDetails(trade)}
                    className="p-2 text-purple-400 hover:bg-purple-500/10 rounded"
                  >
                    <Eye size={18}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTrades().length === 0 && (
          <div className="p-10 text-center text-slate-400">
            No trades found
          </div>
        )}
      </div>

      {/* Modal */}
      {showDetailsModal && selectedTrade && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-xl border border-purple-800/50 space-y-4">

            <h2 className="text-xl font-bold">Close Trade</h2>

            <div className="text-sm text-slate-400">
              {selectedTrade.asset} — {selectedTrade.profiles?.full_name}
            </div>

            <select
              value={outcome}
              onChange={(e)=>setOutcome(e.target.value)}
              className="w-full bg-slate-800 p-2 rounded"
            >
              <option value="profit">Profit</option>
              <option value="loss">Loss</option>
            </select>

            <input
              className="w-full bg-slate-800 p-2 rounded"
              placeholder="Profit / Loss Amount"
              value={profitLossAmount}
              onChange={(e)=>setProfitLossAmount(e.target.value)}
            />

            <input
              className="w-full bg-slate-800 p-2 rounded"
              placeholder="Exit Price"
              value={exitPrice}
              onChange={(e)=>setExitPrice(e.target.value)}
            />

            <textarea
              className="w-full bg-slate-800 p-2 rounded"
              placeholder="Admin note (optional)"
              value={adminNote}
              onChange={(e)=>setAdminNote(e.target.value)}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={()=>setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-700 rounded"
              >
                Close
              </button>

              <button
                onClick={handleCancelTrade}
                disabled={processing}
                className="px-4 py-2 bg-red-600 rounded"
              >
                Cancel Trade
              </button>

              <button
                onClick={handleCloseTrade}
                disabled={processing}
                className="px-4 py-2 bg-green-600 rounded"
              >
                {processing ? 'Processing...' : 'Close Trade'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}


/* ===== Stat Card Component ===== */

function StatCard({ label, value, icon, color }) {

  const colors = {
    yellow: 'border-yellow-500/30',
    green: 'border-green-500/30',
    purple: 'border-purple-500/30'
  }

  return (
    <div className={`bg-slate-900/60 p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}