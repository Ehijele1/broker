'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Wallet, Bitcoin, Building2, ArrowLeft, AlertCircle,
  CheckCircle, Shield, Clock, Info, DollarSign
} from 'lucide-react'

export default function WithdrawalPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)
  
  // Withdrawal form state
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Crypto withdrawal details
  const [cryptoNetwork, setCryptoNetwork] = useState('')
  const [cryptoAddress, setCryptoAddress] = useState('')
  
  // Bank withdrawal details
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

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
  
  const paymentMethods = [
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-6 h-6" />,
      description: 'Withdraw to crypto wallet',
      processingTime: '24-48 hours',
      fees: '2%',
      minAmount: 50,
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <Building2 className="w-6 h-6" />,
      description: 'Withdraw to bank account',
      processingTime: '3-5 business days',
      fees: '1%',
      minAmount: 100,
      color: 'from-emerald-500 to-teal-500'
    }
  ]

  useEffect(() => {
    checkUser()
  }, [])

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

  const handleWithdraw = async (e) => {
    e.preventDefault()
    
    if (!amount || !selectedMethod) {
      alert('Please fill in all required fields')
      return
    }

    const withdrawAmount = parseFloat(amount)
    const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod)

    if (withdrawAmount < selectedPaymentMethod.minAmount) {
      alert(`Minimum withdrawal amount is ${profile.currency} ${selectedPaymentMethod.minAmount}`)
      return
    }

    if (withdrawAmount > parseFloat(profile.balance)) {
      alert('Insufficient balance')
      return
    }

    // Validate method-specific fields
    if (selectedMethod === 'crypto') {
      if (!cryptoNetwork || !cryptoAddress) {
        alert('Please fill in crypto withdrawal details')
        return
      }
    } else if (selectedMethod === 'bank') {
      if (!bankName || !accountName || !accountNumber) {
        alert('Please fill in bank withdrawal details')
        return
      }
    }

    try {
      setSubmitting(true)

      // Create withdrawal record
      const withdrawalData = {
        user_id: profile.id,
        amount: withdrawAmount,
        payment_method: selectedMethod,
        currency: profile.currency,
        status: 'pending'
      }

      // Add method-specific details
      if (selectedMethod === 'crypto') {
        withdrawalData.crypto_network = cryptoNetwork
        withdrawalData.crypto_address = cryptoAddress
      } else if (selectedMethod === 'bank') {
        withdrawalData.bank_name = bankName
        withdrawalData.account_name = accountName
        withdrawalData.account_number = accountNumber
      }

      const { error } = await supabase
        .from('withdrawals')
        .insert([withdrawalData])

      if (error) throw error

      // Show success message
      setShowSuccess(true)
      
      // Reset form
      setAmount('')
      setSelectedMethod('')
      setCryptoNetwork('')
      setCryptoAddress('')
      setBankName('')
      setAccountName('')
      setAccountNumber('')

      // Redirect after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
        router.push('/user/transactions')
      }, 3000)

    } catch (error) {
      console.error('Error creating withdrawal:', error)
      alert('Failed to submit withdrawal request. Please try again.')
    } finally {
      setSubmitting(false)
    }
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

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod)
  const availableBalance = parseFloat(profile.balance)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${
          isDarkMode 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
        }`}>
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Withdrawal Request Submitted!</p>
            <p className="text-sm opacity-90">Your request is being processed</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Withdraw Funds
          </h1>
          <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
            Request withdrawal from your account
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`rounded-xl px-6 py-3 border ${
            isDarkMode 
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Available Balance
            </p>
            <p className={`text-2xl font-bold ${
              isDarkMode ? 'text-emerald-400' : 'text-indigo-600'
            }`}>
              {profile.currency} {availableBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className={`rounded-2xl p-6 border ${
        isDarkMode 
          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${
            isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100'
          }`}>
            <AlertCircle className={`w-6 h-6 ${
              isDarkMode ? 'text-amber-400' : 'text-amber-600'
            }`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-2 ${
              isDarkMode ? 'text-amber-400' : 'text-amber-700'
            }`}>Withdrawal Guidelines</h3>
            <ul className={`space-y-2 text-sm ${
              isDarkMode ? 'text-slate-300' : 'text-gray-700'
            }`}>
              <li className="flex items-start gap-2">
                <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isDarkMode ? 'text-amber-400' : 'text-amber-600'
                }`} />
                <span>Withdrawal requests are processed within 24-48 hours</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isDarkMode ? 'text-amber-400' : 'text-amber-600'
                }`} />
                <span>Withdrawal fees apply based on payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isDarkMode ? 'text-amber-400' : 'text-amber-600'
                }`} />
                <span>Ensure your withdrawal details are correct to avoid delays</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Withdrawal Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Select Payment Method */}
          <div className={`rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <h3 className={`text-xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Select Withdrawal Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`relative overflow-hidden rounded-xl p-6 border-2 transition-all text-left ${
                    selectedMethod === method.id
                      ? isDarkMode
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-indigo-500 bg-indigo-50'
                      : isDarkMode
                        ? 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                        : 'border-indigo-200 hover:border-indigo-300 bg-white shadow-sm'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${method.color} opacity-10 rounded-full blur-3xl`}></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${method.color} ${
                        isDarkMode ? 'bg-opacity-20' : 'bg-opacity-10'
                      }`}>
                        <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          {method.icon}
                        </span>
                      </div>
                      {selectedMethod === method.id && (
                        <div className={`p-1 rounded-full ${
                          isDarkMode ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}>
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <h4 className={`font-bold text-lg mb-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{method.name}</h4>
                    <p className={`text-sm mb-3 ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>{method.description}</p>
                    <div className={`space-y-1 text-xs ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {method.processingTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Fee: {method.fees} • Min: {profile.currency} {method.minAmount}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawal Form */}
          <form onSubmit={handleWithdraw} className={`rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <h3 className={`text-xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Withdrawal Details</h3>
            
            <div className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Amount ({profile.currency})</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    max={availableBalance}
                    required
                    className={`w-full px-4 py-3 border rounded-lg pr-16 focus:outline-none focus:ring-2 ${
                      isDarkMode 
                        ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500' 
                        : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
                    }`}
                  />
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 font-semibold ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    {profile.currency}
                  </span>
                </div>
                {selectedMethodData && (
                  <p className={`text-xs mt-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-600'
                  }`}>
                    Available: {profile.currency} {availableBalance.toFixed(2)} • 
                    Minimum: {profile.currency} {selectedMethodData.minAmount} • 
                    Fee: {selectedMethodData.fees}
                  </p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {[0.25, 0.5, 0.75, 1].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => setAmount((availableBalance * percent).toFixed(2))}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-800/50 hover:bg-slate-700 border-slate-700 text-white' 
                        : 'bg-white hover:bg-indigo-50 border-indigo-200 text-gray-900'
                    }`}
                  >
                    {percent === 1 ? 'Max' : `${percent * 100}%`}
                  </button>
                ))}
              </div>

              {/* Crypto Withdrawal Details */}
              {selectedMethod === 'crypto' && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Crypto Network</label>
                    <select
                      value={cryptoNetwork}
                      onChange={(e) => setCryptoNetwork(e.target.value)}
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500' 
                          : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
                      }`}
                    >
                      <option value="">Select network</option>
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ERC20">Ethereum (ERC20)</option>
                      <option value="TRC20">Tron (TRC20)</option>
                      <option value="BEP20">Binance Smart Chain (BEP20)</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Wallet Address</label>
                    <input
                      type="text"
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      placeholder="Enter your wallet address"
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 font-mono text-sm ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500' 
                          : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
                      }`}
                    />
                    <p className={`text-xs mt-2 flex items-start gap-1 ${
                      isDarkMode ? 'text-amber-400' : 'text-amber-700'
                    }`}>
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      Double-check your wallet address. Funds sent to wrong address cannot be recovered.
                    </p>
                  </div>
                </>
              )}

              {/* Bank Withdrawal Details */}
              {selectedMethod === 'bank' && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500' 
                          : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Enter account holder name"
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500' 
                          : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      required
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode 
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500' 
                          : 'bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedMethod || submitting || availableBalance === 0}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg disabled:cursor-not-allowed ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-6 h-6" />
                    Submit Withdrawal Request
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Summary & Info */}
        <div className="space-y-6">
          {/* Withdrawal Summary */}
          <div className={`rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30' 
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200 shadow-sm'
          }`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <DollarSign className={`w-5 h-5 ${
                isDarkMode ? 'text-emerald-400' : 'text-indigo-600'
              }`} />
              Withdrawal Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                  Method:
                </span>
                <span className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{selectedMethodData?.name || 'Not selected'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                  Amount:
                </span>
                <span className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{amount || '0'} {profile.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                  Fee:
                </span>
                <span className={`font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{selectedMethodData?.fees || 'N/A'}</span>
              </div>
              <div className={`pt-3 border-t ${
                isDarkMode ? 'border-emerald-500/30' : 'border-indigo-200'
              }`}>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                    You'll Receive:
                  </span>
                  <span className={`font-bold text-xl ${
                    isDarkMode ? 'text-emerald-400' : 'text-indigo-600'
                  }`}>
                    {amount && selectedMethodData 
                      ? (parseFloat(amount) * (1 - parseFloat(selectedMethodData.fees) / 100)).toFixed(2)
                      : '0'} {profile.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className={`rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-xl ${
                isDarkMode ? 'bg-emerald-500/20' : 'bg-indigo-50'
              }`}>
                <Shield className={`w-6 h-6 ${
                  isDarkMode ? 'text-emerald-400' : 'text-indigo-600'
                }`} />
              </div>
              <div>
                <h4 className={`font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Secure Withdrawals</h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  All withdrawal requests are manually reviewed for security.
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className={`rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <h4 className={`font-bold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Need Help?</h4>
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              If you have any questions about withdrawals, contact our support team.
            </p>
            <button
              type="button"
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
              }`}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

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