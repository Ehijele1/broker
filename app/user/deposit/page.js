'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Wallet, CreditCard, Building2, Smartphone, Bitcoin,
  DollarSign, CheckCircle, Copy, AlertCircle, Info,
  TrendingUp, Shield, Clock, ArrowRight, Upload, X, Eye, QrCode
} from 'lucide-react'

export default function DepositPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(true)
  
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
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState(null)

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

  const viewQRCode = (qrCodeUrl) => {
    setSelectedQRCode(qrCodeUrl)
    setShowQRModal(true)
  }

  const closeQRModal = () => {
    setShowQRModal(false)
    setSelectedQRCode(null)
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
  const selectedNetworkData = cryptoNetworks.find(n => n.id === selectedNetwork)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* QR Code Modal */}
      {showQRModal && selectedQRCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`relative max-w-lg w-full rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-900 border-purple-800/50' 
              : 'bg-white border-indigo-200'
          }`}>
            <button
              onClick={closeQRModal}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${
                isDarkMode ? 'bg-emerald-500/20' : 'bg-indigo-50'
              }`}>
                <QrCode className={`w-6 h-6 ${
                  isDarkMode ? 'text-emerald-400' : 'text-indigo-600'
                }`} />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Scan QR Code</h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  {selectedNetworkData?.name} - {selectedNetworkData?.network}
                </p>
              </div>
            </div>

            <div className={`rounded-xl p-4 border mb-4 ${
              isDarkMode 
                ? 'bg-white border-slate-700' 
                : 'bg-gray-50 border-indigo-200'
            }`}>
              <img
                src={selectedQRCode}
                alt="QR Code"
                className="w-full rounded-lg"
              />
            </div>

            <div className={`p-4 rounded-xl border ${
              isDarkMode 
                ? 'bg-amber-500/10 border-amber-500/30' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <p className={`text-xs flex items-start gap-2 ${
                isDarkMode ? 'text-amber-400' : 'text-amber-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Scan this QR code with your wallet app to make the payment. 
                  Ensure you're sending on the correct network ({selectedNetworkData?.network}).
                </span>
              </p>
            </div>

            <button
              onClick={closeQRModal}
              className={`w-full mt-4 px-4 py-3 rounded-xl font-semibold transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${
          isDarkMode 
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
        }`}>
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
          <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Deposit Funds
          </h1>
          <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
            Add funds to your trading account
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`rounded-xl px-6 py-3 border ${
            isDarkMode 
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Current Balance
            </p>
            <p className={`text-2xl font-bold ${
              isDarkMode ? 'text-emerald-400' : 'text-indigo-600'
            }`}>
              {profile.currency} {Number(profile.balance).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className={`rounded-2xl p-6 border ${
        isDarkMode 
          ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${
            isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
          }`}>
            <Info className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold mb-2 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-700'
            }`}>Important Notice</h3>
            <ul className={`space-y-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              <li className="flex items-start gap-2">
                <Shield className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span>All deposits are processed securely and encrypted</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span>Processing times vary by payment method</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
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
          <div className={`rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Select Payment Method
            </h3>
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
                    <h4 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {method.name}
                    </h4>
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      {method.description}
                    </p>
                    <div className={`space-y-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
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
            <div className={`rounded-2xl p-6 border ${
              isDarkMode 
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
                : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Select Network
              </h3>
              
              {networksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className={`w-8 h-8 border-4 rounded-full animate-spin ${
                    isDarkMode 
                      ? 'border-emerald-500/20 border-t-emerald-500' 
                      : 'border-indigo-200 border-t-indigo-600'
                  }`}></div>
                </div>
              ) : cryptoNetworks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${
                    isDarkMode ? 'text-slate-600' : 'text-indigo-300'
                  }`} />
                  <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                    No crypto networks available at the moment
                  </p>
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
                            ? isDarkMode
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-indigo-500 bg-indigo-50'
                            : isDarkMode
                              ? 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                              : 'border-indigo-200 hover:border-indigo-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-bold ${
                            isDarkMode 
                              ? network.color || 'text-emerald-500' 
                              : 'text-indigo-600'
                          }`}>
                            {network.name}
                          </h4>
                          {selectedNetwork === network.id && (
                            <CheckCircle className={`w-5 h-5 ${
                              isDarkMode ? 'text-emerald-500' : 'text-indigo-600'
                            }`} />
                          )}
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'} mb-2`}>
                          {network.network}
                        </p>
                        {network.min_amount && (
                          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                            Min: {network.min_amount} {network.name.split(' ')[0]}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Show wallet address when network is selected */}
                  {selectedNetwork && selectedNetworkData && (
                    <div className={`mt-6 p-4 rounded-xl border ${
                      isDarkMode 
                        ? 'bg-slate-800/50 border-slate-700' 
                        : 'bg-indigo-50 border-indigo-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-semibold ${
                          isDarkMode ? 'text-slate-300' : 'text-gray-900'
                        }`}>Deposit Address</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isDarkMode
                            ? `${selectedNetworkData.color || 'text-emerald-500'} bg-current bg-opacity-10`
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {selectedNetworkData.network}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className={`flex-1 text-sm px-3 py-2 rounded border overflow-x-auto ${
                          isDarkMode 
                            ? 'bg-slate-900 border-slate-700 text-white' 
                            : 'bg-white border-indigo-200 text-gray-900'
                        }`}>
                          {selectedNetworkData.address}
                        </code>
                        <button
                          onClick={() => copyToClipboard(selectedNetworkData.address)}
                          className={`p-2 rounded transition-colors ${
                            isDarkMode 
                              ? 'bg-slate-700 hover:bg-slate-600' 
                              : 'bg-indigo-100 hover:bg-indigo-200'
                          }`}
                          title="Copy address"
                        >
                          {copiedAddress ? (
                            <CheckCircle className={`w-5 h-5 ${
                              isDarkMode ? 'text-emerald-500' : 'text-indigo-600'
                            }`} />
                          ) : (
                            <Copy className={`w-5 h-5 ${
                              isDarkMode ? 'text-white' : 'text-indigo-600'
                            }`} />
                          )}
                        </button>
                        {selectedNetworkData.qr_code_url && (
                          <button
                            onClick={() => viewQRCode(selectedNetworkData.qr_code_url)}
                            className={`p-2 rounded transition-colors ${
                              isDarkMode 
                                ? 'bg-emerald-600 hover:bg-emerald-700' 
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                            title="View QR Code"
                          >
                            <QrCode className="w-5 h-5 text-white" />
                          </button>
                        )}
                      </div>
                      
                      {selectedNetworkData.qr_code_url && (
                        <div className={`mt-3 p-3 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-emerald-500/10 border-emerald-500/30' 
                            : 'bg-emerald-50 border-emerald-200'
                        }`}>
                          <p className={`text-xs flex items-center gap-2 ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>
                            <QrCode className="w-4 h-4" />
                            <span>QR Code available! Click the QR button above to scan with your wallet app.</span>
                          </p>
                        </div>
                      )}
                      
                      <p className={`text-xs mt-3 flex items-start gap-1 ${
                        isDarkMode ? 'text-amber-400' : 'text-amber-700'
                      }`}>
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
            <div className={`rounded-2xl p-6 border ${
              isDarkMode 
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
                : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Bank Transfer Details
              </h3>
              
              {networksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className={`w-8 h-8 border-4 rounded-full animate-spin ${
                    isDarkMode 
                      ? 'border-emerald-500/20 border-t-emerald-500' 
                      : 'border-indigo-200 border-t-indigo-600'
                  }`}></div>
                </div>
              ) : !bankDetails ? (
                <div className="text-center py-8">
                  <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${
                    isDarkMode ? 'text-slate-600' : 'text-indigo-300'
                  }`} />
                  <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                    Bank details not available at the moment
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700' 
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Bank Name
                    </p>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {bankDetails.bank_name}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700' 
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Account Name
                    </p>
                    <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {bankDetails.account_name}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-slate-800/50 border-slate-700' 
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Account Number
                      </p>
                      <button
                        onClick={() => copyToClipboard(bankDetails.account_number)}
                        className={`text-xs flex items-center gap-1 ${
                          isDarkMode 
                            ? 'text-emerald-400 hover:text-emerald-300' 
                            : 'text-indigo-600 hover:text-indigo-700'
                        }`}
                      >
                        {copiedAddress ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        Copy
                      </button>
                    </div>
                    <p className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {bankDetails.account_number}
                    </p>
                  </div>
                  {bankDetails.swift_code && (
                    <div className={`p-4 rounded-xl border ${
                      isDarkMode 
                        ? 'bg-slate-800/50 border-slate-700' 
                        : 'bg-indigo-50 border-indigo-200'
                    }`}>
                      <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        SWIFT/BIC Code
                      </p>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {bankDetails.swift_code}
                      </p>
                    </div>
                  )}
                  {bankDetails.routing_number && (
                    <div className={`p-4 rounded-xl border ${
                      isDarkMode 
                        ? 'bg-slate-800/50 border-slate-700' 
                        : 'bg-indigo-50 border-indigo-200'
                    }`}>
                      <p className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Routing Number
                      </p>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {bankDetails.routing_number}
                      </p>
                    </div>
                  )}
                  <div className={`p-4 rounded-xl border ${
                    isDarkMode 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`text-xs flex items-start gap-2 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-700'
                    }`}>
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Please use your account email or username as the transfer reference for faster processing</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deposit Form */}
          <form onSubmit={handleDeposit} className={`rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50' 
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Deposit Amount
            </h3>
            
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
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
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
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-800/50 hover:bg-slate-700 border-slate-700 text-white' 
                        : 'bg-white hover:bg-indigo-50 border-indigo-200 text-gray-900'
                    }`}
                  >
                    {profile.currency} {quickAmount}
                  </button>
                ))}
              </div>

              {/* Upload Proof (for crypto) */}
              {selectedMethod === 'crypto' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Upload Payment Proof <span className={`text-xs ${
                      isDarkMode ? 'text-slate-500' : 'text-gray-500'
                    }`}>(Optional)</span>
                  </label>
                  {proofPreview ? (
                    <div className="relative">
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        className={`w-full h-48 object-cover rounded-lg border-2 ${
                          isDarkMode ? 'border-slate-700' : 'border-indigo-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={removeProofFile}
                        className="absolute top-2 right-2 p-2 bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDarkMode 
                        ? 'border-slate-700 hover:border-slate-600 bg-slate-800/30' 
                        : 'border-indigo-300 hover:border-indigo-400 bg-indigo-50/50'
                    }`}>
                      <Upload className={`w-12 h-12 mb-2 ${
                        isDarkMode ? 'text-slate-500' : 'text-indigo-400'
                      }`} />
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Click to upload screenshot
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                        PNG, JPG up to 10MB
                      </p>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Upload a screenshot of your transaction as proof of payment (optional but recommended)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedMethod || submitting}
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
          <div className={`rounded-2xl p-6 border ${
            isDarkMode 
              ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30' 
              : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200 shadow-sm'
          }`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <TrendingUp className={`w-5 h-5 ${
                isDarkMode ? 'text-emerald-400' : 'text-indigo-600'
              }`} />
              Deposit Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Method:</span>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedMethodData?.name || 'Not selected'}
                </span>
              </div>
              {selectedMethod === 'crypto' && selectedNetworkData && (
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Network:</span>
                  <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedNetworkData.network}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Amount:</span>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {amount || '0'} {profile.currency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Fees:</span>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedMethodData?.fees || 'N/A'}
                </span>
              </div>
              <div className={`pt-3 border-t ${
                isDarkMode ? 'border-emerald-500/30' : 'border-indigo-200'
              }`}>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>You'll Receive:</span>
                  <span className={`font-bold text-xl ${
                    isDarkMode ? 'text-emerald-400' : 'text-indigo-600'
                  }`}>
                    {amount || '0'} {profile.currency}
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
                <h4 className={`font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Secure Deposits
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  All transactions are encrypted and protected with industry-standard security protocols.
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
            <h4 className={`font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Need Help?
            </h4>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              If you have any questions or issues with your deposit, contact our support team.
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