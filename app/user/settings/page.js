'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  User, Mail, Phone, MapPin, Lock, Eye, EyeOff, Shield,
  Bell, Globe, DollarSign, Save, CheckCircle, AlertCircle,
  Camera, Key, CreditCard, Upload, X, Activity, Wallet
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('Settings Updated!')
  const [activeTab, setActiveTab] = useState('profile')
  const [isDarkMode, setIsDarkMode] = useState(true)
  
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

  // Load theme preference and listen for changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }

    // Listen for theme changes
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setIsDarkMode(e.newValue === 'dark')
      }
    }

    // Listen for custom theme change event
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

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${
          isDarkMode
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
            : 'bg-white border-2 border-indigo-500 text-gray-900'
        }`}>
          <CheckCircle className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-indigo-600'}`} />
          <div>
            <p className="font-bold">{successMessage}</p>
            <p className={`text-sm ${isDarkMode ? 'opacity-90' : 'text-gray-600'}`}>Your changes have been saved</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Account Settings</h1>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Manage your account settings and preferences</p>
      </div>

      {/* Profile Header Card */}
      <div className={`rounded-2xl p-6 border ${
        isDarkMode
          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30'
          : 'bg-white border-indigo-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            {photoPreview ? (
              <img 
                src={photoPreview} 
                alt="Profile" 
                className={`w-20 h-20 rounded-full object-cover border-2 ${
                  isDarkMode ? 'border-emerald-500' : 'border-indigo-500'
                }`}
              />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
                isDarkMode
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
              }`}>
                {profile.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={() => setShowPhotoMenu(!showPhotoMenu)}
              className={`absolute bottom-0 right-0 p-2 rounded-full border-2 transition-colors ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-900'
                  : 'bg-white hover:bg-indigo-50 border-indigo-200'
              }`}
            >
              <Camera className={`w-4 h-4 ${isDarkMode ? 'text-white' : 'text-indigo-600'}`} />
            </button>

            {showPhotoMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowPhotoMenu(false)}
                ></div>
                <div className={`absolute top-full right-0 mt-2 w-48 border rounded-lg shadow-xl z-50 overflow-hidden ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-indigo-200'
                }`}>
                  {photoPreview && (
                    <button
                      onClick={handleViewPhoto}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                        isDarkMode
                          ? 'hover:bg-slate-700 text-white'
                          : 'hover:bg-indigo-50 text-gray-900'
                      }`}
                    >
                      <Eye className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className="text-sm">View Photo</span>
                    </button>
                  )}
                  <button
                    onClick={handleChangePhoto}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                      isDarkMode
                        ? 'hover:bg-slate-700 text-white'
                        : 'hover:bg-indigo-50 text-gray-900'
                    }`}
                  >
                    <Upload className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} />
                    <span className="text-sm">{photoPreview ? 'Change Photo' : 'Add Photo'}</span>
                  </button>
                  {photoPreview && (
                    <button
                      onClick={handleDeletePhoto}
                      disabled={uploadingPhoto}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left disabled:opacity-50 ${
                        isDarkMode
                          ? 'hover:bg-slate-700 text-white'
                          : 'hover:bg-indigo-50 text-gray-900'
                      }`}
                    >
                      <X className={`w-4 h-4 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} />
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
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.full_name}</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>@{profile.username}</p>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`}>{profile.email}</p>
          </div>
          {profilePhoto && (
            <div className="flex gap-2">
              <button
                onClick={handleRemovePhoto}
                disabled={uploadingPhoto}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
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
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700'
                  : 'bg-white hover:bg-gray-100'
              }`}
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
                ? isDarkMode
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white text-indigo-600 border-2 border-indigo-500 shadow-sm'
                : isDarkMode
                  ? 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
                  : 'bg-white text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-indigo-200 shadow-sm'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className={`rounded-2xl p-6 border space-y-6 ${
              isDarkMode
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50'
                : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <div>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                          : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <User className="w-4 h-4 inline mr-2" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                          : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className={`w-full px-4 py-3 border rounded-lg cursor-not-allowed ${
                        isDarkMode
                          ? 'bg-slate-800/30 border-slate-700 text-slate-500'
                          : 'bg-gray-100 border-gray-300 text-gray-500'
                      }`}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Email cannot be changed</p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                          : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                          : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Preferred Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                          : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                      }`}
                    >
                      {currencies.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                    {currency !== profile.currency && (
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        ⚠️ Your balance will be converted from {profile.currency} to {currency}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white'
                }`}
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

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className={`rounded-2xl p-6 border space-y-6 ${
              isDarkMode
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50'
                : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <div>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Lock className="w-4 h-4 inline mr-2" />
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 ${
                          isDarkMode
                            ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                            : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Key className="w-4 h-4 inline mr-2" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 ${
                          isDarkMode
                            ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                            : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                        }`}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Must be at least 6 characters</p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <Key className="w-4 h-4 inline mr-2" />
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 pr-12 ${
                          isDarkMode
                            ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                            : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                          isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className={`text-sm flex items-center gap-2 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                      <AlertCircle className="w-4 h-4" />
                      Passwords do not match
                    </p>
                  )}
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${
                isDarkMode
                  ? 'bg-slate-800/30 border-slate-700'
                  : 'bg-indigo-50 border-indigo-200'
              }`}>
                <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Shield className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} />
                  Password Requirements
                </h4>
                <ul className={`space-y-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-700'}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} />
                    At least 6 characters long
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} />
                    Include letters and numbers for better security
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={saving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* Notification Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleUpdateNotifications} className={`rounded-2xl p-6 border space-y-6 ${
              isDarkMode
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50'
                : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <div>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notification Preferences</h3>
                <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Choose what notifications you want to receive</p>
                
                <div className="space-y-6">
                  {/* Email Notifications */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/30 border-slate-700'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Mail className={`w-5 h-5 mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} />
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Notifications</h4>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Receive updates and alerts via email</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        emailNotifications 
                          ? isDarkMode ? 'bg-emerald-500' : 'bg-indigo-600'
                          : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          emailNotifications ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Trade Alerts */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/30 border-slate-700'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Activity className={`w-5 h-5 mt-1 ${isDarkMode ? 'text-blue-400' : 'text-indigo-600'}`} />
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Trade Alerts</h4>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Get notified when trades are executed, closed, or reach profit/loss targets</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTradeAlerts(!tradeAlerts)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        tradeAlerts 
                          ? isDarkMode ? 'bg-emerald-500' : 'bg-indigo-600'
                          : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          tradeAlerts ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Deposit Alerts */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/30 border-slate-700'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <CreditCard className={`w-5 h-5 mt-1 ${isDarkMode ? 'text-purple-400' : 'text-indigo-600'}`} />
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Deposit Alerts</h4>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Receive notifications about deposit status and confirmations</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDepositAlerts(!depositAlerts)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        depositAlerts 
                          ? isDarkMode ? 'bg-emerald-500' : 'bg-indigo-600'
                          : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          depositAlerts ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Withdrawal Alerts */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/30 border-slate-700'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Wallet className={`w-5 h-5 mt-1 ${isDarkMode ? 'text-amber-400' : 'text-indigo-600'}`} />
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Withdrawal Alerts</h4>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Stay updated on withdrawal requests, approvals, and completions</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWithdrawalAlerts(!withdrawalAlerts)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        withdrawalAlerts 
                          ? isDarkMode ? 'bg-emerald-500' : 'bg-indigo-600'
                          : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                          withdrawalAlerts ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Security Alerts (Always On) */}
                  <div className={`flex items-center justify-between p-4 rounded-lg border ${
                    isDarkMode
                      ? 'bg-slate-800/30 border-slate-700'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Shield className={`w-5 h-5 mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} />
                      <div>
                        <h4 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Security Alerts
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDarkMode
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>Always On</span>
                        </h4>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Important security notifications (cannot be disabled)</p>
                      </div>
                    </div>
                    <div className={`relative w-14 h-7 rounded-full opacity-50 cursor-not-allowed ${
                      isDarkMode ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}>
                      <span className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full translate-x-7" />
                    </div>
                  </div>
                </div>
              </div>

              <div className={`border rounded-lg p-4 ${
                isDarkMode
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <Bell className={`w-5 h-5 mt-0.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <div>
                    <h4 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Notification Tip</h4>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Keep notifications enabled to stay updated on important account activities and never miss critical alerts.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving Preferences...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Notification Settings
                  </>
                )}
              </button>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleUpdatePreferences} className={`rounded-2xl p-6 border space-y-6 ${
              isDarkMode
                ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50'
                : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <div>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Display Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Default Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        isDarkMode
                          ? 'bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500'
                          : 'bg-white border-indigo-300 text-gray-900 focus:ring-indigo-500'
                      }`}
                    >
                      {currencies.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>All amounts will be displayed in this currency</p>
                    {currency !== profile.currency && (
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        ⚠️ Your balance will be converted from {profile.currency} to {currency}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white'
                }`}
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
          <div className={`rounded-2xl p-6 border ${
            isDarkMode
              ? 'bg-slate-900/50 backdrop-blur-sm border-slate-800/50'
              : 'bg-white border-indigo-200 shadow-sm'
          }`}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Email Verified</span>
                <CheckCircle className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} />
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