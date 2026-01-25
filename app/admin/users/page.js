'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Search, Filter, Edit, Trash2, UserPlus, Download, 
  ChevronDown, MoreVertical, DollarSign, Mail, Phone,
  MapPin, Calendar, Shield, User
} from 'lucide-react'

export default function UserManagement() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesFilter
  })

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      alert('User deleted successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user: ' + error.message)
    }
  }

  const handleEditUser = (user) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          username: editingUser.username,
          email: editingUser.email,
          phone_number: editingUser.phone_number,
          country: editingUser.country,
          currency: editingUser.currency,
          balance: editingUser.balance,
          role: editingUser.role
        })
        .eq('id', editingUser.id)

      if (error) throw error

      alert('User updated successfully')
      setShowEditModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user: ' + error.message)
    }
  }

  const handleExportUsers = () => {
    const csv = [
      ['Name', 'Username', 'Email', 'Country', 'Currency', 'Balance', 'Role', 'Created At'],
      ...filteredUsers.map(u => [
        u.full_name,
        u.username,
        u.email,
        u.country,
        u.currency,
        u.balance,
        u.role,
        new Date(u.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">User Management</h1>
          <p className="text-slate-400">Manage all platform users</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={handleExportUsers}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => router.push('/admin/users/new')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox 
          label="Total Users" 
          value={users.filter(u => u.role === 'user').length} 
          icon={<User className="w-5 h-5" />}
          color="blue"
        />
        <StatBox 
          label="Administrators" 
          value={users.filter(u => u.role === 'admin').length} 
          icon={<Shield className="w-5 h-5" />}
          color="purple"
        />
        <StatBox 
          label="Total Balance" 
          value={`$${users.reduce((sum, u) => sum + Number(u.balance || 0), 0).toFixed(2)}`} 
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <StatBox 
          label="New This Month" 
          value={users.filter(u => {
            const created = new Date(u.created_at)
            const now = new Date()
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
          }).length}
          icon={<Calendar className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-800/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
          <span>Showing {filteredUsers.length} of {users.length} users</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-800/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{user.full_name}</div>
                        <div className="text-sm text-slate-400">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-white mb-1">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-4 h-4" />
                        {user.phone_number || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{user.country || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-green-400">
                      {user.currency} {Number(user.balance || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No users found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-800/50">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-2xl font-bold">Edit User</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Username</label>
                  <input
                    type="text"
                    value={editingUser.username || ''}
                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editingUser.phone_number || ''}
                    onChange={(e) => setEditingUser({...editingUser, phone_number: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Country</label>
                  <input
                    type="text"
                    value={editingUser.country || ''}
                    onChange={(e) => setEditingUser({...editingUser, country: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Currency</label>
                  <select
                    value={editingUser.currency || 'USD'}
                    onChange={(e) => setEditingUser({...editingUser, currency: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="NGN">NGN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingUser.balance || 0}
                    onChange={(e) => setEditingUser({...editingUser, balance: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                  <select
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Stat Box Component
function StatBox({ label, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    purple: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
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