'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { createNotification, notificationTemplates } from '@/lib/notificationUtils'
import { 
  DollarSign, Clock, CheckCircle, XCircle, Eye, 
  Filter, Search, Download, User, Calendar,
  AlertCircle, Image as ImageIcon, ExternalLink
} from 'lucide-react'

export default function AdminDeposits() {
  const router = useRouter()
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedDeposit, setSelectedDeposit] = useState(null)
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
    fetchDeposits()
  }, [])

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error

      setDeposits(data || [])

      const pending = data.filter(d => d.status === 'pending').length
      const approved = data.filter(d => d.status === 'approved').length
      const rejected = data.filter(d => d.status === 'rejected').length
      const totalAmount = data
        .filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + Number(d.amount), 0)

      setStats({ pending, approved, rejected, totalAmount })
    } catch (error) {
      console.error('Error fetching deposits:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = 
      deposit.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || deposit.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleApprove = async (deposit) => {
    if (!confirm(`Approve deposit of ${deposit.currency} ${deposit.amount} for ${deposit.profiles.full_name}?`)) {
      return
    }

    try {
      setProcessing(true)

      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', deposit.user_id)
        .single()

      if (userError) throw userError

      const newBalance = Number(userData.balance) + Number(deposit.amount)

      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', deposit.user_id)

      if (balanceError) throw balanceError

      const { error: depositError } = await supabase
        .from('deposits')
        .update({
          status: 'approved',
          admin_note: adminNote,
          processed_by: (await supabase.auth.getUser()).data.user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', deposit.id)

      if (depositError) throw depositError

      // Create notification for user using your database function
      const notif = notificationTemplates.deposit.approved(
        Number(deposit.amount).toFixed(2), 
        deposit.currency
      )
      
      await createNotification(
        deposit.user_id,
        notif.title,
        notif.message,
        'deposit',
        deposit.id  // related_id
      )

      alert('Deposit approved successfully!')
      setShowDetailsModal(false)
      setAdminNote('')
      fetchDeposits()
    } catch (error) {
      console.error('Error approving deposit:', error)
      alert('Failed to approve deposit: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (deposit) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      setProcessing(true)

      const { error } = await supabase
        .from('deposits')
        .update({
          status: 'rejected',
          admin_note: reason,
          processed_by: (await supabase.auth.getUser()).data.user.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', deposit.id)

      if (error) throw error

      // Create notification for user
      const notif = notificationTemplates.deposit.rejected(
        Number(deposit.amount).toFixed(2), 
        deposit.currency,
        reason
      )
      
      await createNotification(
        deposit.user_id,
        notif.title,
        notif.message,
        'deposit',
        deposit.id  // related_id
      )

      alert('Deposit rejected')
      setShowDetailsModal(false)
      fetchDeposits()
    } catch (error) {
      console.error('Error rejecting deposit:', error)
      alert('Failed to reject deposit')
    } finally {
      setProcessing(false)
    }
  }

  const viewDetails = (deposit) => {
    setSelectedDeposit(deposit)
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
        <h1 className="text-3xl font-bold mb-1">Deposit Management</h1>
        <p className="text-slate-400">Review and process deposit requests</p>
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
        <StatCard label="Total Approved" value={`$${stats.totalAmount.toFixed(2)}`} icon={<DollarSign />} color="purple" />
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
          Showing {filteredDeposits.length} of {deposits.length} deposits
        </div>
      </div>

      {/* Deposits Table */}
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
              {filteredDeposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                        {deposit.profiles?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-medium">{deposit.profiles?.full_name}</div>
                        <div className="text-sm text-slate-400">{deposit.profiles?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-lg">{deposit.currency} {Number(deposit.amount).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium capitalize">{deposit.payment_method}</div>
                      {deposit.network && (
                        <div className="text-slate-400">{deposit.network}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      deposit.status === 'pending' 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : deposit.status === 'approved'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {deposit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(deposit.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewDetails(deposit)}
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

        {filteredDeposits.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No deposits found</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-800/50">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-2xl font-bold">Deposit Details</h3>
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
                    <p className="font-medium">{selectedDeposit.profiles?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Username</p>
                    <p className="font-medium">@{selectedDeposit.profiles?.username}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400">Email</p>
                    <p className="font-medium">{selectedDeposit.profiles?.email}</p>
                  </div>
                </div>
              </div>

              {/* Deposit Info */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Deposit Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Amount</p>
                    <p className="font-bold text-xl text-emerald-400">
                      {selectedDeposit.currency} {Number(selectedDeposit.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Method</p>
                    <p className="font-medium capitalize">{selectedDeposit.payment_method}</p>
                  </div>
                  {selectedDeposit.network && (
                    <div>
                      <p className="text-slate-400">Network</p>
                      <p className="font-medium">{selectedDeposit.network}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400">Status</p>
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedDeposit.status === 'pending' 
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : selectedDeposit.status === 'approved'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedDeposit.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400">Submitted</p>
                    <p className="font-medium">
                      {new Date(selectedDeposit.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {selectedDeposit.proof_url && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Payment Proof
                  </h4>

                  <img
                    src={selectedDeposit.proof_url}
                    alt="Payment proof"
                    className="w-full rounded-lg border border-slate-700"
                  />

                  <a
                    href={selectedDeposit.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
                  >
                    View full image <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Admin Note */}
              {selectedDeposit.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Note (Optional)</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note about this deposit..."
                    rows="3"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white resize-none"
                  />
                </div>
              )}

              {selectedDeposit.admin_note && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Admin Note
                  </h4>
                  <p className="text-sm text-slate-300">{selectedDeposit.admin_note}</p>
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
              {selectedDeposit.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedDeposit)}
                    disabled={processing}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedDeposit)}
                    disabled={processing}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {processing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Approve & Credit Account
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