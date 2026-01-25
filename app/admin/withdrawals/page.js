'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  DollarSign, Clock, CheckCircle, XCircle, Eye, 
  Filter, Search, User, AlertCircle, Bitcoin, Building2
} from 'lucide-react'

export default function AdminWithdrawals() {
  const router = useRouter()
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  })

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            email,
            balance
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setWithdrawals(data || [])

      // Calculate stats
      const pending = data.filter(w => w.status === 'pending').length
      const approved = data.filter(w => w.status === 'approved').length
      const rejected = data.filter(w => w.status === 'rejected').length
      const totalAmount = data
        .filter(w => w.status === 'approved')
        .reduce((sum, w) => sum + Number(w.amount), 0)

      setStats({ pending, approved, rejected, totalAmount })
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      withdrawal.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || withdrawal.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleApprove = async (withdrawal) => {
    if (!confirm(`Approve withdrawal of ${withdrawal.currency} ${withdrawal.amount} for ${withdrawal.profiles.full_name}?`)) {
      return
    }

    try {
      setProcessing(true)

      // Get user's current balance
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', withdrawal.user_id)
        .single()

      if (userError) throw userError

      const currentBalance = Number(userData.balance)
      const withdrawalAmount = Number(withdrawal.amount)

      // Check if user still has sufficient balance
      if (currentBalance < withdrawalAmount) {
        alert('User has insufficient balance for this withdrawal')
        return
      }

      const newBalance = currentBalance - withdrawalAmount

      // Update user balance (deduct amount)
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', withdrawal.user_id)

      if (balanceError) throw balanceError

      // Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          admin_note: adminNote,
          processed_by: (await supabase.auth.getUser()).data.user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id)

      if (withdrawalError) throw withdrawalError

      alert('Withdrawal approved successfully!')
      setShowDetailsModal(false)
      setAdminNote('')
      fetchWithdrawals()
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      alert('Failed to approve withdrawal: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (withdrawal) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      setProcessing(true)

      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          admin_note: reason,
          processed_by: (await supabase.auth.getUser()).data.user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id)

      if (error) throw error

      alert('Withdrawal rejected')
      setShowDetailsModal(false)
      fetchWithdrawals()
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
      alert('Failed to reject withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  const viewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal)
    setShowDetailsModal(true)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Withdrawal Management</h1>
          <p className="text-slate-400">Review and process withdrawal requests</p>
        </div>
        <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Dashboard
          </button>
      </div>
      

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending" value={stats.pending} icon={<Clock />} color="yellow" />
        <StatCard label="Approved" value={stats.approved} icon={<CheckCircle />} color="green" />
        <StatCard label="Rejected" value={stats.rejected} icon={<XCircle />} color="red" />
        <StatCard label="Total Processed" value={`$${stats.totalAmount.toFixed(2)}`} icon={<DollarSign />} color="purple" />
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-800/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>
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
        </div>
        <div className="mt-3 text-sm text-slate-400">
          Showing {filteredWithdrawals.length} of {withdrawals.length} withdrawals
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-800/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Method</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                        {withdrawal.profiles?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">{withdrawal.profiles?.full_name}</div>
                        <div className="text-sm text-slate-400">{withdrawal.profiles?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-lg text-rose-400">
                      -{withdrawal.currency} {Number(withdrawal.amount).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      {withdrawal.payment_method === 'crypto' ? (
                        <>
                          <Bitcoin className="w-4 h-4 text-orange-400" />
                          <div>
                            <div className="font-medium">Crypto</div>
                            <div className="text-slate-400">{withdrawal.crypto_network}</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          <div>
                            <div className="font-medium">Bank</div>
                            <div className="text-slate-400">{withdrawal.bank_name}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      withdrawal.status === 'pending' 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : withdrawal.status === 'approved'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(withdrawal.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewDetails(withdrawal)}
                      className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredWithdrawals.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No withdrawals found</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-800/50">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-2xl font-bold">Withdrawal Details</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Name</p>
                    <p className="font-medium">{selectedWithdrawal.profiles?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Username</p>
                    <p className="font-medium">@{selectedWithdrawal.profiles?.username}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Email</p>
                    <p className="font-medium">{selectedWithdrawal.profiles?.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Current Balance</p>
                    <p className="font-medium text-emerald-400">
                      {selectedWithdrawal.currency} {Number(selectedWithdrawal.profiles?.balance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Withdrawal Info */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Withdrawal Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Amount</p>
                    <p className="font-bold text-xl text-rose-400">
                      {selectedWithdrawal.currency} {Number(selectedWithdrawal.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Method</p>
                    <p className="font-medium capitalize">{selectedWithdrawal.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedWithdrawal.status === 'pending' 
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : selectedWithdrawal.status === 'approved'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedWithdrawal.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-400">Requested</p>
                    <p className="font-medium">
                      {new Date(selectedWithdrawal.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              {selectedWithdrawal.payment_method === 'crypto' ? (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Bitcoin className="w-5 h-5 text-orange-400" />
                    Crypto Withdrawal Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-400">Network</p>
                      <p className="font-semibold text-orange-400">{selectedWithdrawal.crypto_network}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Wallet Address</p>
                      <p className="font-mono text-xs bg-slate-900 px-3 py-2 rounded border border-slate-700 break-all">
                        {selectedWithdrawal.crypto_address}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-xs text-amber-400 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        Verify the wallet address before approving. Transactions cannot be reversed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    Bank Withdrawal Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Bank Name</p>
                      <p className="font-medium">{selectedWithdrawal.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Account Name</p>
                      <p className="font-medium">{selectedWithdrawal.account_name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400">Account Number</p>
                      <p className="font-semibold text-lg">{selectedWithdrawal.account_number}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Check Warning */}
              {selectedWithdrawal.status === 'pending' && 
               Number(selectedWithdrawal.profiles?.balance) < Number(selectedWithdrawal.amount) && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-400 mb-1">Insufficient Balance</p>
                      <p className="text-sm text-slate-300">
                        User's current balance ({selectedWithdrawal.currency} {Number(selectedWithdrawal.profiles?.balance || 0).toFixed(2)}) 
                        is less than the withdrawal amount ({selectedWithdrawal.currency} {Number(selectedWithdrawal.amount).toFixed(2)}).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Note */}
              {selectedWithdrawal.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Note (Optional)</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note about this withdrawal..."
                    rows="3"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white resize-none"
                  />
                </div>
              )}

              {selectedWithdrawal.admin_note && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Admin Note
                  </h4>
                  <p className="text-sm text-slate-300">{selectedWithdrawal.admin_note}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setAdminNote('')
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Close
              </button>
              {selectedWithdrawal.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedWithdrawal)}
                    disabled={processing}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedWithdrawal)}
                    disabled={processing || Number(selectedWithdrawal.profiles?.balance) < Number(selectedWithdrawal.amount)}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Approve & Deduct Balance
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    yellow: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    red: 'from-red-500/20 to-rose-500/20 border-red-500/30',
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