'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Wallet, ArrowDownLeft, Building2, Bitcoin, DollarSign,
  CheckCircle, AlertCircle, Info, Shield, Clock, TrendingDown,
  AlertTriangle, ChevronRight, CreditCard
} from 'lucide-react'

export default function WithdrawalPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Withdrawal form state
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Crypto withdrawal fields
  const [walletAddress, setWalletAddress] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  
  // Bank withdrawal fields
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [swiftCode, setSwiftCode] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')

  // Withdrawal methods
  const withdrawalMethods = [
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-6 h-6" />,
      description: 'Bitcoin, Ethereum, USDT',
      processingTime: '24-48 hours',
      fees: 'Network fees apply',
      minAmount: 100,
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <Building2 className="w-6 h-6" />,
      description: 'Wire transfer to your bank',
      processingTime: '3-5 business days',
      fees: 'No fees',
      minAmount: 1000,
      color: 'from-emerald-500 to-teal-500'
    }
  ]

  // Crypto networks for withdrawal
  const cryptoNetworks = [
    { id: 'btc', name: 'Bitcoin (BTC)', network: 'Bitcoin Network', fee: '0.0005 BTC' },
    { id: 'eth', name: 'Ethereum (ETH)', network: 'ERC-20', fee: '0.005 ETH' },
    { id: 'usdt-trc20', name: 'USDT', network: 'TRC-20 (Tron)', fee: '1 USDT' },
    { id: 'usdt-erc20', name: 'USDT', network: 'ERC-20 (Ethereum)', fee: '5 USDT' }
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

  const handleWithdrawal = async (e) => {
    e.preventDefault()
    
    if (!amount || !selectedMethod) {
      alert('Please fill in all required fields')
      return
    }

    const withdrawalAmount = parseFloat(amount)
    const selectedWithdrawalMethod = withdrawalMethods.find(m => m.id === selectedMethod)

    // Validations
    if (withdrawalAmount < selectedWithdrawalMethod.minAmount) {
      alert(`Minimum withdrawal amount is ${profile.currency} ${selectedWithdrawalMethod.minAmount}`)
      return
    }

    if (withdrawalAmount > parseFloat(profile.balance)) {
      alert('Insufficient balance')
      return
    }

    // Method-specific validations
    if (selectedMethod === 'crypto') {
      if (!selectedNetwork || !walletAddress) {
        alert('Please select network and enter wallet address')
        return
      }
      
      // Basic wallet address validation
      if (walletAddress.length < 26) {
        alert('Please enter a valid wallet address')
        return
      }
    }

    if (selectedMethod === 'bank') {
      if (!bankName || !accountName || !accountNumber) {
        alert('Please fill in all bank details')
        return
      }
      
      if (accountNumber.length < 8) {
        alert('Please enter a valid account number')
        return
      }
    }

    try {
      setSubmitting(true)

      // Prepare withdrawal data
      const withdrawalData = {
        user_id: profile.id,
        amount: withdrawalAmount,
        method: selectedMethod,
        status: 'pending',
        currency: profile.currency
      }

      // Add method-specific data
      if (selectedMethod === 'crypto') {
        withdrawalData.wallet_address = walletAddress
        withdrawalData.network = selectedNetwork
      } else if (selectedMethod === 'bank') {
        withdrawalData.bank_name = bankName
        withdrawalData.account_name = accountName
        withdrawalData.account_number = accountNumber
        withdrawalData.swift_code = swiftCode || null
        withdrawalData.routing_number = routingNumber || null
      }

      // Create withdrawal record
      const { data, error } = await supabase
        .from('withdrawals')
        .insert([withdrawalData])
        .select()

      if (error) throw error

      // Show success message
      setShowSuccess(true)
      
      // Reset form
      setAmount('')
      setSelectedMethod('')
      setWalletAddress('')
      setSelectedNetwork('')
      setBankName('')
      setAccountName('')
      setAccountNumber('')
      setSwiftCode('')
      setRoutingNumber('')

      // Redirect after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
        router.push('/user/transactions')
      }, 5000)

    } catch (error) {
      console.error('Error creating withdrawal:', error)
      alert('Failed to submit withdrawal request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  const selectedMethodData = withdrawalMethods.find(m => m.id === selectedMethod)
  const selectedNetworkData = cryptoNetworks.find(n => n.id === selectedNetwork)
  const availableBalance = parseFloat(profile.balance)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Withdrawal Request Submitted!</p>
            <p className="text-sm opacity-90">Your withdrawal is being processed</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Withdraw Funds</h1>
          <p className="text-slate-400">Request withdrawal from your account</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-emerald-400">
              {profile.currency} {availableBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-400 mb-2">Withdrawal Notice</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>All withdrawals are subject to verification and may take 24-48 hours to process</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>Ensure your account is verified before requesting withdrawal</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>Double-check all details as transactions cannot be reversed</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Withdrawal Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Select Withdrawal Method */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-xl font-bold mb-6">Select Withdrawal Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {withdrawalMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethod(method.id)
                    // Reset method-specific fields
                    if (method.id === 'crypto') {
                      setBankName('')
                      setAccountName('')
                      setAccountNumber('')
                      setSwiftCode('')
                      setRoutingNumber('')
                    } else {
                      setWalletAddress('')
                      setSelectedNetwork('')
                    }
                  }}
                  className={`relative overflow-hidden rounded-xl p-6 border-2 transition-all text-left ${
                    selectedMethod === method.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                  }`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${method.color} opacity-10 rounded-full blur-3xl`}></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${method.color} bg-opacity-20`}>
                        {method.icon}
                      </div>
                      {selectedMethod === method.id && (
                        <div className="p-1 bg-emerald-500 rounded-full">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-lg mb-1">{method.name}</h4>
                    <p className="text-sm text-slate-400 mb-3">{method.description}</p>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {method.processingTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Min: {profile.currency} {method.minAmount}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawal Form */}
          {selectedMethod && (
            <form onSubmit={handleWithdrawal} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
              <h3 className="text-xl font-bold mb-6">Withdrawal Details</h3>
              
              <div className="space-y-4">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Withdrawal Amount ({profile.currency}) <span className="text-rose-500">*</span>
                  </label>
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
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                      {profile.currency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-slate-400">
                      Minimum: {profile.currency} {selectedMethodData.minAmount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAmount(availableBalance.toString())}
                      className="text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      Max: {profile.currency} {availableBalance.toFixed(2)}
                    </button>
                  </div>
                </div>

                {/* Crypto-specific fields */}
                {selectedMethod === 'crypto' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Network <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Select Network --</option>
                        {cryptoNetworks.map((network) => (
                          <option key={network.id} value={network.id}>
                            {network.name} ({network.network}) - Fee: {network.fee}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Wallet Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder="Enter your wallet address"
                        required
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-xs text-amber-400 mt-2 flex items-start gap-1">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Ensure the address matches the selected network. Wrong address may result in permanent loss of funds.</span>
                      </p>
                    </div>
                  </>
                )}

                {/* Bank-specific fields */}
                {selectedMethod === 'bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Bank Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Enter bank name"
                        required
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Account Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Enter account holder name"
                        required
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Account Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        required
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          SWIFT/BIC Code <span className="text-slate-500 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={swiftCode}
                          onChange={(e) => setSwiftCode(e.target.value)}
                          placeholder="SWIFT code"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Routing Number <span className="text-slate-500 text-xs">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          placeholder="Routing number"
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-bold text-lg transition-all shadow-lg disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="w-6 h-6" />
                      Submit Withdrawal Request
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column - Summary & Info */}
        <div className="space-y-6">
          {/* Withdrawal Summary */}
          <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-400" />
              Withdrawal Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Method:</span>
                <span className="font-semibold">{selectedMethodData?.name || 'Not selected'}</span>
              </div>
              {selectedMethod === 'crypto' && selectedNetworkData && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Network:</span>
                    <span className="font-semibold">{selectedNetworkData.network}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Network Fee:</span>
                    <span className="font-semibold">{selectedNetworkData.fee}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Amount:</span>
                <span className="font-semibold">{amount || '0'} {profile.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Processing:</span>
                <span className="font-semibold">{selectedMethodData?.processingTime || 'N/A'}</span>
              </div>
              <div className="pt-3 border-t border-rose-500/30">
                <div className="flex justify-between">
                  <span className="text-slate-400">You'll Receive:</span>
                  <span className="font-bold text-xl text-rose-400">
                    {amount || '0'} {profile.currency}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Network fees deducted separately</p>
              </div>
            </div>
          </div>

          {/* Available Balance */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Wallet className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold mb-2">Available Balance</h4>
                <p className="text-3xl font-bold text-emerald-400 mb-1">
                  {profile.currency} {availableBalance.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400">
                  Ensure sufficient balance for withdrawal
                </p>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="font-bold mb-2">Secure Withdrawals</h4>
                <p className="text-sm text-slate-400">
                  All withdrawal requests are manually reviewed for your security. Ensure your account is verified.
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <h4 className="font-bold mb-3">Need Help?</h4>
            <p className="text-sm text-slate-400 mb-4">
              If you have any questions about withdrawals, contact our support team.
            </p>
            <button
              type="button"
              onClick={() => router.push('/user/verification')}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors mb-2"
            >
              Verify Account
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
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