'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, Users, Award, Target, Activity, DollarSign,
  CheckCircle, Star, ArrowUpRight, BarChart3, Clock, Shield,
  AlertCircle, Info, Copy, Search, X
} from 'lucide-react'

export default function CopyTraderPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [traders, setTraders] = useState([])
  const [tradersLoading, setTradersLoading] = useState(true)
  const [selectedTrader, setSelectedTrader] = useState(null)
  const [showCopyModal, setShowCopyModal] = useState(false)
  
  // Copy form state
  const [copyAmount, setCopyAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchTraders()
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

  const fetchTraders = async () => {
    try {
      setTradersLoading(true)
      
      const { data, error } = await supabase
        .from('copy_traders')
        .select('*')
        .eq('is_active', true)
        .order('roi', { ascending: false })

      if (error) throw error

      setTraders(data || [])
    } catch (error) {
      console.error('Error fetching traders:', error)
      setTraders([])
    } finally {
      setTradersLoading(false)
    }
  }

  const handleCopyTrader = async () => {
    if (!copyAmount || !selectedTrader) {
      alert('Please enter copy amount')
      return
    }

    const amount = parseFloat(copyAmount)

    if (amount < selectedTrader.min_copy_amount) {
      alert(`Minimum copy amount is ${profile.currency} ${selectedTrader.min_copy_amount}`)
      return
    }

    if (amount > parseFloat(profile.balance)) {
      alert('Insufficient balance')
      return
    }

    try {
      setSubmitting(true)

      // Create copy trade record
      const { data, error } = await supabase
        .from('user_copy_trades')
        .insert([
          {
            user_id: profile.id,
            trader_id: selectedTrader.id,
            copy_amount: amount,
            status: 'active',
            currency: profile.currency
          }
        ])
        .select()

      if (error) throw error

      // Show success
      setShowSuccess(true)
      setShowCopyModal(false)
      setCopyAmount('')
      setSelectedTrader(null)

      // Hide success after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)

      // Refresh traders list
      fetchTraders()

    } catch (error) {
      console.error('Error copying trader:', error)
      alert('Failed to copy trader. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter traders by name only
  const filteredTraders = traders.filter(trader => {
    if (searchQuery && !trader.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
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
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Trader Copied Successfully!</p>
            <p className="text-sm opacity-90">You're now copying this trader's trades</p>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && selectedTrader && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Copy {selectedTrader.name}</h3>
              <button
                onClick={() => {
                  setShowCopyModal(false)
                  setSelectedTrader(null)
                  setCopyAmount('')
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Trader Info */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={selectedTrader.avatar || `https://ui-avatars.com/api/?name=${selectedTrader.name}&background=random`}
                    alt={selectedTrader.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4 className="font-bold">{selectedTrader.name}</h4>
                    <p className="text-sm text-slate-400">ROI: {selectedTrader.roi}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Win Rate</p>
                    <p className="font-semibold">{selectedTrader.win_rate}%</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Followers</p>
                    <p className="font-semibold">{selectedTrader.followers}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Risk</p>
                    <p className={`font-semibold capitalize ${
                      selectedTrader.risk_level === 'low' ? 'text-emerald-400' :
                      selectedTrader.risk_level === 'medium' ? 'text-amber-400' :
                      'text-rose-400'
                    }`}>
                      {selectedTrader.risk_level}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Copy Amount ({profile.currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={copyAmount}
                    onChange={(e) => setCopyAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={selectedTrader.min_copy_amount}
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                    {profile.currency}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Min: {profile.currency} {selectedTrader.min_copy_amount} • Available: {profile.currency} {Number(profile.balance).toFixed(2)}
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="mb-2">By copying this trader:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Your trades will mirror theirs automatically</li>
                      <li>• You can stop copying anytime</li>
                      <li>• Past performance doesn't guarantee future results</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCopyModal(false)
                    setSelectedTrader(null)
                    setCopyAmount('')
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyTrader}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Start Copying'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Copy Trading</h1>
          <p className="text-slate-400">Copy successful traders and earn automatically</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-emerald-400">
              {profile.currency} {Number(profile.balance).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Info className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-2">How Copy Trading Works</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Users className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span>Choose a trader based on their performance and risk level</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span>Allocate funds to copy their trades automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span>Your account mirrors their trades in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span>You maintain full control and can stop anytime</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search traders by name..."
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
      </div>

      {/* Traders Grid */}
      {tradersLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredTraders.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-800/50 text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Traders Found</h3>
          <p className="text-slate-400">
            {searchQuery
              ? 'No traders match your search'
              : 'No traders available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTraders.map((trader) => (
            <TraderCard
              key={trader.id}
              trader={trader}
              currency={profile.currency}
              onCopy={() => {
                setSelectedTrader(trader)
                setShowCopyModal(true)
              }}
            />
          ))}
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

// Trader Card Component
function TraderCard({ trader, currency, onCopy }) {
  const isPositiveROI = trader.roi >= 0
  const riskColor = {
    low: 'text-emerald-400 bg-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/20',
    high: 'text-rose-400 bg-rose-500/20'
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={trader.avatar || `https://ui-avatars.com/api/?name=${trader.name}&background=random`}
            alt={trader.name}
            className="w-14 h-14 rounded-full border-2 border-slate-700"
          />
          <div>
            <h3 className="font-bold text-lg">{trader.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {trader.verified && (
                <span className="flex items-center gap-1 text-xs text-blue-400">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="w-3 h-3 fill-current" />
                {trader.rating || '5.0'}
              </span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${riskColor[trader.risk_level]}`}>
          {trader.risk_level}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className={`flex items-center justify-center gap-1 mb-1 ${isPositiveROI ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveROI ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
            <span className="text-xs font-medium">ROI</span>
          </div>
          <p className={`text-xl font-bold ${isPositiveROI ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveROI ? '+' : ''}{trader.roi}%
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400 mb-1">Win Rate</p>
          <p className="text-xl font-bold">{trader.win_rate}%</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-400 mb-1">Followers</p>
          <p className="text-xl font-bold">{trader.followers}</p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Total Trades</span>
          <span className="font-semibold">{trader.total_trades || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Experience</span>
          <span className="font-semibold">{trader.experience || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Min Copy</span>
          <span className="font-semibold">{currency} {trader.min_copy_amount}</span>
        </div>
      </div>

      {/* Description */}
      {trader.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {trader.description}
        </p>
      )}

      {/* Copy Button */}
      <button
        onClick={onCopy}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold transition-all shadow-lg group-hover:shadow-emerald-500/20"
      >
        <Copy className="w-5 h-5" />
        Copy Trader
      </button>
    </div>
  )
}