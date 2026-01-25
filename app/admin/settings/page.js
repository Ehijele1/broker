'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Bitcoin, Building2, Plus, Edit, Trash2, Save, X,
  CheckCircle, AlertCircle
} from 'lucide-react'

export default function AdminSettings() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('crypto')
  const [cryptoAddresses, setCryptoAddresses] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Crypto form state
  const [showCryptoForm, setShowCryptoForm] = useState(false)
  const [editingCrypto, setEditingCrypto] = useState(null)
  const [cryptoForm, setCryptoForm] = useState({
    name: '',
    network: '',
    address: '',
    min_amount: '',
    color: 'text-orange-500',
    is_active: true
  })

  // Bank form state
  const [showBankForm, setShowBankForm] = useState(false)
  const [editingBank, setEditingBank] = useState(null)
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    swift_code: '',
    routing_number: '',
    is_active: true
  })

  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch crypto addresses
      const { data: cryptoData, error: cryptoError } = await supabase
        .from('crypto_addresses')
        .select('*')
        .order('created_at', { ascending: true })

      if (cryptoError) throw cryptoError
      setCryptoAddresses(cryptoData || [])

      // Fetch bank accounts
      const { data: bankData, error: bankError } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: true })

      if (bankError) throw bankError
      setBankAccounts(bankData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCrypto = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingCrypto) {
        // Update existing
        const { error } = await supabase
          .from('crypto_addresses')
          .update(cryptoForm)
          .eq('id', editingCrypto.id)

        if (error) throw error
        showSuccess('Crypto address updated successfully')
      } else {
        // Create new
        const { error } = await supabase
          .from('crypto_addresses')
          .insert([cryptoForm])

        if (error) throw error
        showSuccess('Crypto address added successfully')
      }

      resetCryptoForm()
      fetchData()
    } catch (error) {
      console.error('Error saving crypto address:', error)
      alert('Failed to save crypto address')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBank = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingBank) {
        // Update existing
        const { error } = await supabase
          .from('bank_accounts')
          .update(bankForm)
          .eq('id', editingBank.id)

        if (error) throw error
        showSuccess('Bank account updated successfully')
      } else {
        // Create new
        const { error } = await supabase
          .from('bank_accounts')
          .insert([bankForm])

        if (error) throw error
        showSuccess('Bank account added successfully')
      }

      resetBankForm()
      fetchData()
    } catch (error) {
      console.error('Error saving bank account:', error)
      alert('Failed to save bank account')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCrypto = async (id) => {
    if (!confirm('Are you sure you want to delete this crypto address?')) return

    try {
      const { error } = await supabase
        .from('crypto_addresses')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSuccess('Crypto address deleted')
      fetchData()
    } catch (error) {
      console.error('Error deleting crypto address:', error)
      alert('Failed to delete crypto address')
    }
  }

  const handleDeleteBank = async (id) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSuccess('Bank account deleted')
      fetchData()
    } catch (error) {
      console.error('Error deleting bank account:', error)
      alert('Failed to delete bank account')
    }
  }

  const editCrypto = (crypto) => {
    setEditingCrypto(crypto)
    setCryptoForm(crypto)
    setShowCryptoForm(true)
  }

  const editBank = (bank) => {
    setEditingBank(bank)
    setBankForm(bank)
    setShowBankForm(true)
  }

  const resetCryptoForm = () => {
    setCryptoForm({
      name: '',
      network: '',
      address: '',
      min_amount: '',
      color: 'text-orange-500',
      is_active: true
    })
    setEditingCrypto(null)
    setShowCryptoForm(false)
  }

  const resetBankForm = () => {
    setBankForm({
      bank_name: '',
      account_name: '',
      account_number: '',
      swift_code: '',
      routing_number: '',
      is_active: true
    })
    setEditingBank(null)
    setShowBankForm(false)
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
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
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Payment Settings</h1>
          <p className="text-slate-400">Manage payment methods and details</p>
        </div>
        <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Dashboard
          </button>
      </div>
      

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('crypto')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'crypto'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bitcoin className="w-5 h-5 inline mr-2" />
          Crypto Addresses
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'bank'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-5 h-5 inline mr-2" />
          Bank Accounts
        </button>
      </div>

      {/* Crypto Tab */}
      {activeTab === 'crypto' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Cryptocurrency Addresses</h2>
            <button
              onClick={() => setShowCryptoForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Crypto Address
            </button>
          </div>

          {/* Crypto Form */}
          {showCryptoForm && (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-800/50">
              <h3 className="text-lg font-bold mb-4">
                {editingCrypto ? 'Edit Crypto Address' : 'Add New Crypto Address'}
              </h3>
              <form onSubmit={handleSaveCrypto} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cryptocurrency Name</label>
                    <input
                      type="text"
                      value={cryptoForm.name}
                      onChange={(e) => setCryptoForm({...cryptoForm, name: e.target.value})}
                      placeholder="e.g., Bitcoin (BTC)"
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Network</label>
                    <input
                      type="text"
                      value={cryptoForm.network}
                      onChange={(e) => setCryptoForm({...cryptoForm, network: e.target.value})}
                      placeholder="e.g., BTC, ERC20, TRC20"
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Wallet Address</label>
                    <input
                      type="text"
                      value={cryptoForm.address}
                      onChange={(e) => setCryptoForm({...cryptoForm, address: e.target.value})}
                      placeholder="Enter wallet address"
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={cryptoForm.min_amount}
                      onChange={(e) => setCryptoForm({...cryptoForm, min_amount: e.target.value})}
                      placeholder="e.g., 0.001"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Color Class</label>
                    <select
                      value={cryptoForm.color}
                      onChange={(e) => setCryptoForm({...cryptoForm, color: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    >
                      <option value="text-orange-500">Orange (Bitcoin)</option>
                      <option value="text-blue-500">Blue (Ethereum)</option>
                      <option value="text-green-500">Green (USDT)</option>
                      <option value="text-purple-500">Purple (Other)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cryptoForm.is_active}
                        onChange={(e) => setCryptoForm({...cryptoForm, is_active: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium">Active (visible to users)</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetCryptoForm}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Crypto List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cryptoAddresses.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                <Bitcoin className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No crypto addresses added yet</p>
              </div>
            ) : (
              cryptoAddresses.map((crypto) => (
                <div key={crypto.id} className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className={`font-bold text-lg ${crypto.color}`}>{crypto.name}</h3>
                      <p className="text-sm text-slate-400">{crypto.network}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editCrypto(crypto)}
                        className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCrypto(crypto.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-400">Address</p>
                      <p className="text-sm font-mono bg-slate-800 px-3 py-2 rounded border border-slate-700 overflow-x-auto">
                        {crypto.address}
                      </p>
                    </div>
                    {crypto.min_amount && (
                      <div>
                        <p className="text-xs text-slate-400">Minimum Amount</p>
                        <p className="text-sm font-semibold">{crypto.min_amount}</p>
                      </div>
                    )}
                    <div>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        crypto.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {crypto.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Bank Tab */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Bank Accounts</h2>
            <button
              onClick={() => setShowBankForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Bank Account
            </button>
          </div>

          {/* Bank Form */}
          {showBankForm && (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-800/50">
              <h3 className="text-lg font-bold mb-4">
                {editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
              </h3>
              <form onSubmit={handleSaveBank} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={bankForm.bank_name}
                      onChange={(e) => setBankForm({...bankForm, bank_name: e.target.value})}
                      placeholder="e.g., Chase Bank"
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Name</label>
                    <input
                      type="text"
                      value={bankForm.account_name}
                      onChange={(e) => setBankForm({...bankForm, account_name: e.target.value})}
                      placeholder="e.g., SecureTrading LLC"
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Number</label>
                    <input
                      type="text"
                      value={bankForm.account_number}
                      onChange={(e) => setBankForm({...bankForm, account_number: e.target.value})}
                      placeholder="Enter account number"
                      required
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">SWIFT/BIC Code</label>
                    <input
                      type="text"
                      value={bankForm.swift_code}
                      onChange={(e) => setBankForm({...bankForm, swift_code: e.target.value})}
                      placeholder="Optional"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Routing Number</label>
                    <input
                      type="text"
                      value={bankForm.routing_number}
                      onChange={(e) => setBankForm({...bankForm, routing_number: e.target.value})}
                      placeholder="Optional"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mt-8">
                      <input
                        type="checkbox"
                        checked={bankForm.is_active}
                        onChange={(e) => setBankForm({...bankForm, is_active: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium">Active (visible to users)</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetBankForm}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bank List */}
          <div className="grid grid-cols-1 gap-4">
            {bankAccounts.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
                <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No bank accounts added yet</p>
              </div>
            ) : (
              bankAccounts.map((bank) => (
                <div key={bank.id} className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{bank.bank_name}</h3>
                      <p className="text-sm text-slate-400">{bank.account_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editBank(bank)}
                        className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBank(bank.id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Account Number</p>
                      <p className="font-semibold">{bank.account_number}</p>
                    </div>
                    {bank.swift_code && (
                      <div>
                        <p className="text-slate-400 text-xs">SWIFT Code</p>
                        <p className="font-semibold">{bank.swift_code}</p>
                      </div>
                    )}
                    {bank.routing_number && (
                      <div>
                        <p className="text-slate-400 text-xs">Routing Number</p>
                        <p className="font-semibold">{bank.routing_number}</p>
                      </div>
                    )}
                    <div>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        bank.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {bank.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}