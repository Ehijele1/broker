'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Wallet, CreditCard, Building2, Smartphone, Bitcoin,
  DollarSign, CheckCircle, Copy, AlertCircle, Info,
  TrendingUp, Shield, Clock, ArrowRight, Upload, X
} from 'lucide-react'

export default function DepositPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Deposit form state
  const [amount, setAmount] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [cryptoNetworks, setCryptoNetworks] = useState([])
  const [bankDetails, setBankDetails] = useState(null)
  const [networksLoading, setNetworksLoading] = useState(false)

  // Crypto networks - will be fetched from database
  const paymentMethods = [
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: <Bitcoin className="w-6 h-6" />,
      description: 'Bitcoin, Ethereum, USDT',
      processingTime: 'Instant - 30 mins',
      fees: 'Network fees apply',
      minAmount: 50,
      color: 'from-amber-500 to-orange-500'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: <Building2 className="w-6 h-6" />,
      description: 'Wire transfer',
      processingTime: '1-3 business days',
      fees: 'No fees',
      minAmount: 500,
      color: 'from-emerald-500 to-teal-500'
    }
  ]

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (selectedMethod === 'crypto') {
      fetchCryptoNetworks()
    } else if (selectedMethod === 'bank') {
      fetchBankDetails()
    }
  }, [selectedMethod])

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

  const fetchCryptoNetworks = async () => {
    try {
      setNetworksLoading(true)
      const { data, error } = await supabase
        .from('crypto_addresses')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error

      setCryptoNetworks(data || [])
    } catch (error) {
      console.error('Error fetching crypto networks:', error)
      setCryptoNetworks([])
    } finally {
      setNetworksLoading(false)
    }
  }

  const fetchBankDetails = async () => {
    try {
      setNetworksLoading(true)
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) throw error

      setBankDetails(data)
    } catch (error) {
      console.error('Error fetching bank details:', error)
      setBankDetails(null)
    } finally {
      setNetworksLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProofFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProofFile = () => {
    setProofFile(null)
    setProofPreview(null)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const handleDeposit = async (e) => {
    e.preventDefault()
    
    if (!amount || !selectedMethod) {
      alert('Please fill in all required fields')
      return
    }

    if (selectedMethod === 'crypto' && !selectedNetwork) {
      alert('Please select a crypto network')
      return
    }

    const depositAmount = parseFloat(amount)
    const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod)

    if (depositAmount < selectedPaymentMethod.minAmount) {
      alert(`Minimum deposit amount is ${profile.currency} ${selectedPaymentMethod.minAmount}`)
      return
    }

    try {
      setSubmitting(true)

      // Upload proof file if exists
      let proofUrl = null
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop()
        const fileName = `${profile.id}_${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('deposit-proofs')
          .upload(fileName, proofFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('deposit-proofs')
          .getPublicUrl(fileName)

        proofUrl = publicUrl
      }

      // Create deposit record
      const { data, error } = await supabase
        .from('deposits')
        .insert([
          {
            user_id: profile.id,
            amount: depositAmount,
            payment_method: selectedMethod,
            network: selectedNetwork || null,
            proof_url: proofUrl,
            status: 'pending',
            currency: profile.currency
          }
        ])
        .select()

      if (error) throw error

      // Show success message
      setShowSuccess(true)
      
      // Reset form
      setAmount('')
      setSelectedMethod('')
      setSelectedNetwork('')
      setProofFile(null)
      setProofPreview(null)

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false)
        router.push('/user/transactions')
      }, 5000)

    } catch (error) {
      console.error('Error creating deposit:', error)
      alert('Failed to submit deposit request. Please try again.')
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

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod)
  const selectedNetworkData = cryptoNetworks.find(n => n.id === selectedNetwork)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Deposit Request Submitted!</p>
            <p className="text-sm opacity-90">Your deposit is being processed</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Deposit Funds</h1>
          <p className="text-slate-400">Add funds to your trading account</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl px-6 py-3 border border-slate-800/50">
            <p className="text-xs text-slate-400 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-emerald-400">
              {profile.currency} {Number(profile.balance).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Info className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-2">Important Notice</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span>All deposits are processed securely and encrypted</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span>Processing times vary by payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <span>Ensure you send funds to the correct address/account</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          {/* Select Payment Method */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-xl font-bold mb-6">Select Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethod(method.id)
                    setSelectedNetwork('')
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

          {/* Crypto Networks (shown only when crypto is selected) */}
          {selectedMethod === 'crypto' && (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
              <h3 className="text-xl font-bold mb-6">Select Network</h3>
              
              {networksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              ) : cryptoNetworks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No crypto networks available at the moment</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cryptoNetworks.map((network) => (
                      <button
                        key={network.id}
                        onClick={() => setSelectedNetwork(network.id)}
                        className={`rounded-xl p-4 border-2 transition-all text-left ${
                          selectedNetwork === network.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-bold ${network.color || 'text-emerald-500'}`}>
                            {network.name}
                          </h4>
                          {selectedNetwork === network.id && (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mb-2">{network.network}</p>
                        {network.min_amount && (
                          <p className="text-xs text-slate-500">
                            Min: {network.min_amount} {network.name.split(' ')[0]}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Show wallet address when network is selected */}
                  {selectedNetwork && selectedNetworkData && (
                    <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-300">Deposit Address</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${selectedNetworkData.color || 'text-emerald-500'} bg-current bg-opacity-10`}>
                          {selectedNetworkData.network}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-slate-900 px-3 py-2 rounded border border-slate-700 overflow-x-auto">
                          {selectedNetworkData.address}
                        </code>
                        <button
                          onClick={() => copyToClipboard(selectedNetworkData.address)}
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-amber-400 mt-3 flex items-start gap-1">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Send only {selectedNetworkData.name} to this address. Sending other tokens may result in permanent loss.</span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Bank Details (shown only when bank is selected) */}
          {selectedMethod === 'bank' && (
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
              <h3 className="text-xl font-bold mb-6">Bank Transfer Details</h3>
              
              {networksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              ) : !bankDetails ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Bank details not available at the moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Bank Name</p>
                    <p className="font-semibold">{bankDetails.bank_name}</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Account Name</p>
                    <p className="font-semibold">{bankDetails.account_name}</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-400">Account Number</p>
                      <button
                        onClick={() => copyToClipboard(bankDetails.account_number)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        {copiedAddress ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <p className="font-semibold text-lg">{bankDetails.account_number}</p>
                  </div>
                  {bankDetails.swift_code && (
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">SWIFT/BIC Code</p>
                      <p className="font-semibold">{bankDetails.swift_code}</p>
                    </div>
                  )}
                  {bankDetails.routing_number && (
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1">Routing Number</p>
                      <p className="font-semibold">{bankDetails.routing_number}</p>
                    </div>
                  )}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <p className="text-xs text-blue-400 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Please use your account email or username as the transfer reference for faster processing</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deposit Form */}
          <form onSubmit={handleDeposit} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <h3 className="text-xl font-bold mb-6">Deposit Amount</h3>
            
            <div className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount ({profile.currency})</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                    {profile.currency}
                  </span>
                </div>
                {selectedMethodData && (
                  <p className="text-xs text-slate-400 mt-2">
                    Minimum: {profile.currency} {selectedMethodData.minAmount} • Fees: {selectedMethodData.fees}
                  </p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {[100, 500, 1000, 5000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {profile.currency} {quickAmount}
                  </button>
                ))}
              </div>

              {/* Upload Proof (for crypto) */}
              {selectedMethod === 'crypto' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Payment Proof <span className="text-slate-500 text-xs">(Optional)</span>
                  </label>
                  {proofPreview ? (
                    <div className="relative">
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        className="w-full h-48 object-cover rounded-lg border-2 border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={removeProofFile}
                        className="absolute top-2 right-2 p-2 bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors bg-slate-800/30">
                      <Upload className="w-12 h-12 text-slate-500 mb-2" />
                      <p className="text-sm text-slate-400">Click to upload screenshot</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</p>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Upload a screenshot of your transaction as proof of payment (optional but recommended)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedMethod || submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-bold text-lg transition-all shadow-lg disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-6 h-6" />
                    Submit Deposit Request
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Summary & Info */}
        <div className="space-y-6">
          {/* Deposit Summary */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Deposit Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Method:</span>
                <span className="font-semibold">{selectedMethodData?.name || 'Not selected'}</span>
              </div>
              {selectedMethod === 'crypto' && selectedNetworkData && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Network:</span>
                  <span className="font-semibold">{selectedNetworkData.network}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Amount:</span>
                <span className="font-semibold">{amount || '0'} {profile.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fees:</span>
                <span className="font-semibold">{selectedMethodData?.fees || 'N/A'}</span>
              </div>
              <div className="pt-3 border-t border-emerald-500/30">
                <div className="flex justify-between">
                  <span className="text-slate-400">You'll Receive:</span>
                  <span className="font-bold text-xl text-emerald-400">
                    {amount || '0'} {profile.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold mb-2">Secure Deposits</h4>
                <p className="text-sm text-slate-400">
                  All transactions are encrypted and protected with industry-standard security protocols.
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <h4 className="font-bold mb-3">Need Help?</h4>
            <p className="text-sm text-slate-400 mb-4">
              If you have any questions or issues with your deposit, contact our support team.
            </p>
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