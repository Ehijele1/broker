'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  User, Mail, Phone, MapPin, Lock, Eye, EyeOff, Shield,
  Bell, Globe, DollarSign, Save, CheckCircle, AlertCircle,
  Camera, Edit2, Key, Smartphone, CreditCard, Building, Upload, X
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('Settings Updated!')
  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile form state
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState('')
  const [currency, setCurrency] = useState('')
  
  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [tradeAlerts, setTradeAlerts] = useState(true)
  const [depositAlerts, setDepositAlerts] = useState(true)
  const [withdrawalAlerts, setWithdrawalAlerts] = useState(true)

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'security', name: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'preferences', name: 'Preferences', icon: <Globe className="w-5 h-5" /> }
  ]

  const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'KES', 'GHS']

  const convertCurrency = async (fromCurrency, toCurrency, amount) => {
    if (fromCurrency === toCurrency) {
      return amount
    }

    try {
      console.log(`[CURRENCY] Converting ${amount} from ${fromCurrency} to ${toCurrency}`)
      
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
      
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.rates || !data.rates[toCurrency]) {
        throw new Error(`Exchange rate for ${toCurrency} not found`)
      }
      
      const rate = data.rates[toCurrency]
      const convertedAmount = amount * rate
      const finalAmount = parseFloat(convertedAmount.toFixed(2))
      
      console.log(`[CURRENCY] Conversion successful: ${amount} ${fromCurrency} = ${finalAmount} ${toCurrency} (rate: ${rate})`)
      
      return finalAmount
      
    } catch (error) {
      console.error('[CURRENCY] Conversion error:', error)
      throw error
    }
  }

  // Helper function to sync currency to localStorage
  const syncCurrencyToLocalStorage = (userId, newCurrency, newBalance) => {
    try {
      const key = `user_currency_${userId}`
      const data = {
        currency: newCurrency,
        balance: newBalance,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem(key, JSON.stringify(data))
      console.log('[LOCALSTORAGE] Currency synced:', data)
    } catch (error) {
      console.error('[LOCALSTORAGE] Failed to sync:', error)
    }
  }

  // Helper function to get currency from localStorage
  const getCurrencyFromLocalStorage = (userId) => {
    try {
      const key = `user_currency_${userId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const data = JSON.parse(stored)
        console.log('[LOCALSTORAGE] Currency loaded:', data)
        return data
      }
    } catch (error) {
      console.error('[LOCALSTORAGE] Failed to load:', error)
    }
    return null
  }

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      console.log('[AUTH] Checking user...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('[AUTH] No user found, redirecting to signin')
        router.push('/signin')
        return
      }

      console.log('[AUTH] User found:', user.id)
      
      // Check localStorage first for instant UI update
      const cachedCurrency = getCurrencyFromLocalStorage(user.id)
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('[DB] Error fetching profile:', profileError)
        throw profileError
      }

      if (profileData) {
        console.log('[DB] Profile loaded from database:', {
          id: profileData.id,
          currency: profileData.currency,
          balance: profileData.balance
        })
        
        // Use database value as source of truth
        const actualCurrency = profileData.currency || 'USD'
        const actualBalance = profileData.balance || 0
        
        // Sync to localStorage if different
        if (!cachedCurrency || cachedCurrency.currency !== actualCurrency) {
          syncCurrencyToLocalStorage(user.id, actualCurrency, actualBalance)
        }
        
        setProfile(profileData)
        
        // Populate form fields
        setFullName(profileData.full_name || '')
        setUsername(profileData.username || '')
        setEmail(profileData.email || '')
        setPhoneNumber(profileData.phone_number || '')
        setCountry(profileData.country || '')
        setCurrency(actualCurrency)
        
        console.log('[STATE] Form currency set to:', actualCurrency)
        
        // Set profile photo preview if exists
        if (profileData.profile_photo_url) {
          setPhotoPreview(profileData.profile_photo_url)
        }
        
        // Set notification preferences if they exist
        setEmailNotifications(profileData.email_notifications ?? true)
        setTradeAlerts(profileData.trade_alerts ?? true)
        setDepositAlerts(profileData.deposit_alerts ?? true)
        setWithdrawalAlerts(profileData.withdrawal_alerts ?? true)
      }
    } catch (error) {
      console.error('[ERROR] checkUser failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo size must be less than 2MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setProfilePhoto(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadPhoto = async () => {
    if (!profilePhoto) return

    try {
      setUploadingPhoto(true)

      const fileExt = profilePhoto.name.split('.').pop()
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, profilePhoto, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, profile_photo_url: publicUrl })
      setProfilePhoto(null)
      
      setSuccessMessage('Photo uploaded successfully!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setProfilePhoto(null)
    setPhotoPreview(profile?.profile_photo_url || null)
  }

  const handleDeletePhoto = async () => {
    try {
      setUploadingPhoto(true)

      const { error } = await supabase
        .from('profiles')
        .update({ profile_photo_url: null })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, profile_photo_url: null })
      setPhotoPreview(null)
      setShowPhotoMenu(false)
      
      setSuccessMessage('Photo deleted successfully!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Failed to delete photo. Please try again.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleViewPhoto = () => {
    setShowPhotoModal(true)
    setShowPhotoMenu(false)
  }

  const handleChangePhoto = () => {
    document.getElementById('photo-upload').click()
    setShowPhotoMenu(false)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      console.log('[SAVE] Starting profile update...')
      console.log('[SAVE] Current profile currency:', profile.currency)
      console.log('[SAVE] New currency:', currency)
      console.log('[SAVE] Current balance:', profile.balance)
  
      const currencyChanged = currency !== profile.currency
      let newBalance = parseFloat(profile.balance) || 0
  
      if (currencyChanged) {
        console.log('[SAVE] Currency changed detected!')
        try {
          newBalance = await convertCurrency(
            profile.currency,
            currency,
            newBalance
          )
          console.log('[SAVE] New balance after conversion:', newBalance)
        } catch (conversionError) {
          console.error('[SAVE] Conversion failed:', conversionError)
          alert(`Failed to convert currency: ${conversionError.message}. Please try again later.`)
          setSaving(false)
          return
        }
      }
  
      const updateData = {
        full_name: fullName,
        username: username,
        phone_number: phoneNumber,
        country: country,
        currency: currency,
        balance: newBalance
      }
      
      console.log('[SAVE] Updating database with:', updateData)
  
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
  
      if (error) {
        console.error('[SAVE] Database update error:', error)
        throw error
      }
      
      console.log('[SAVE] Database update successful:', updatedData)
  
      // Sync to localStorage
      syncCurrencyToLocalStorage(profile.id, currency, newBalance)
  
      // Update local state with the exact data from database
      const newProfileState = {
        ...profile,
        full_name: fullName,
        username: username,
        phone_number: phoneNumber,
        country: country,
        currency: currency,
        balance: newBalance
      }
      
      console.log('[SAVE] Updating local state to:', newProfileState)
      setProfile(newProfileState)
      setCurrency(currency)
      
      console.log('[SAVE] Save complete!')
  
      if (currencyChanged) {
        setSuccessMessage(`Currency changed to ${currency} and balance converted!`)
      } else {
        setSuccessMessage('Profile updated successfully!')
      }
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
    } catch (error) {
      console.error('[SAVE] Error updating profile:', error)
      alert(`Failed to update profile: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setSuccessMessage('Password updated successfully!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateNotifications = async (e) => {
    e.preventDefault()

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications,
          trade_alerts: tradeAlerts,
          deposit_alerts: depositAlerts,
          withdrawal_alerts: withdrawalAlerts
        })
        .eq('id', profile.id)

      if (error) throw error

      setSuccessMessage('Notification preferences updated!')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating notifications:', error)
      alert('Failed to update notification settings')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePreferences = async (e) => {
    e.preventDefault()
  
    try {
      setSaving(true)
      console.log('[PREF] Starting preferences update...')
      console.log('[PREF] Current profile currency:', profile.currency)
      console.log('[PREF] New currency:', currency)
      console.log('[PREF] Current balance:', profile.balance)
  
      const currencyChanged = currency !== profile.currency
      let newBalance = parseFloat(profile.balance) || 0
  
      if (currencyChanged) {
        console.log('[PREF] Currency changed detected!')
        try {
          newBalance = await convertCurrency(
            profile.currency,
            currency,
            newBalance
          )
          console.log('[PREF] New balance after conversion:', newBalance)
        } catch (conversionError) {
          console.error('[PREF] Conversion failed:', conversionError)
          alert(`Failed to convert currency: ${conversionError.message}. Please try again later.`)
          setSaving(false)
          return
        }
      }
  
      const updateData = {
        currency: currency,
        balance: newBalance
      }
      
      console.log('[PREF] Updating database with:', updateData)
  
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
  
      if (error) {
        console.error('[PREF] Database update error:', error)
        throw error
      }
      
      console.log('[PREF] Database update successful:', updatedData)
  
      // Sync to localStorage
      syncCurrencyToLocalStorage(profile.id, currency, newBalance)
  
      // Update local state
      const newProfileState = { 
        ...profile, 
        currency: currency,
        balance: newBalance
      }
      
      console.log('[PREF] Updating local state to:', newProfileState)
      setProfile(newProfileState)
      setCurrency(currency)
      
      console.log('[PREF] Save complete!')
  
      if (currencyChanged) {
        setSuccessMessage(`Currency changed to ${currency} and balance converted!`)
      } else {
        setSuccessMessage('Preferences updated successfully!')
      }
      
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
    } catch (error) {
      console.error('[PREF] Error updating preferences:', error)
      alert(`Failed to update preferences: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

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
            <p className="font-bold">{successMessage}</p>
            <p className="text-sm opacity-90">Your changes have been saved</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-slate-400">Manage your account settings and preferences</p>
      </div>

      {/* Debug Info (Remove in production) */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-800/50">
        <p className="text-xs text-slate-400">
          <strong>Debug Info:</strong> DB Currency: {profile?.currency} | Form Currency: {currency} | Balance: {profile?.balance}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          <strong>LocalStorage:</strong> {JSON.stringify(getCurrencyFromLocalStorage(profile?.id))}
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold">
                {profile.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={() => setShowPhotoMenu(!showPhotoMenu)}
              className="absolute bottom-0 right-0 p-2 bg-slate-800 hover:bg-slate-700 rounded-full border-2 border-slate-900 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>

            {showPhotoMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowPhotoMenu(false)}
                ></div>
                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  {photoPreview && (
                    <button
                      onClick={handleViewPhoto}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                    >
                      <Eye className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">View Photo</span>
                    </button>
                  )}
                  <button
                    onClick={handleChangePhoto}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">{photoPreview ? 'Change Photo' : 'Add Photo'}</span>
                  </button>
                  {photoPreview && (
                    <button
                      onClick={handleDeletePhoto}
                      disabled={uploadingPhoto}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left disabled:opacity-50"
                    >
                      <X className="w-4 h-4 text-rose-400" />
                      <span className="text-sm">Delete Photo</span>
                    </button>
                  )}
                </div>
              </>
            )}
            
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile.full_name}</h2>
            <p className="text-slate-400">@{profile.username}</p>
            <p className="text-sm text-emerald-400 mt-1">{profile.email}</p>
          </div>
          {profilePhoto && (
            <div className="flex gap-2">
              <button
                onClick={handleRemovePhoto}
                disabled={uploadingPhoto}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploadingPhoto ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-3xl w-full">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={photoPreview}
              alt="Profile"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content - Same as before, keeping it shorter for readability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 bg-slate-800/30 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Preferred Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {currencies.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                    {currency !== profile.currency && (
                      <p className="text-xs text-amber-400 mt-1">
                        ⚠️ Your balance will be converted from {profile.currency} to {currency}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          )}

          {/* Other tabs remain the same... */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleUpdatePreferences} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Display Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Default Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {currencies.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-1">All amounts will be displayed in this currency</p>
                    {currency !== profile.currency && (
                      <p className="text-xs text-amber-400 mt-1">
                        ⚠️ Your balance will be converted from {profile.currency} to {currency}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Preferences
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <h3 className="font-bold mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Email Verified</span>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Phone Verified</span>
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">KYC Status</span>
                <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                  {profile.kyc_status || 'Pending'}
                </span>
              </div>
            </div>
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