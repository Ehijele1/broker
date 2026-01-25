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
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`)
      const data = await response.json()
      const rate = data.rates[toCurrency]
      
      if (!rate) {
        throw new Error('Exchange rate not found')
      }
      
      const convertedAmount = amount * rate
      return parseFloat(convertedAmount.toFixed(2))
      
    } catch (error) {
      console.error('Currency conversion error:', error)
      alert('Failed to fetch exchange rate. Balance not converted.')
      return amount
    }
  }

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

      if (profileData) {
        setProfile(profileData)
        // Populate form fields
        setFullName(profileData.full_name || '')
        setUsername(profileData.username || '')
        setEmail(profileData.email || '')
        setPhoneNumber(profileData.phone_number || '')
        setCountry(profileData.country || '')
        setCurrency(profileData.currency || 'USD')
        
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
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo size must be less than 2MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setProfilePhoto(file)
    
    // Create preview
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

      // Create unique filename
      const fileExt = profilePhoto.name.split('.').pop()
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, profilePhoto, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      // Update profile with photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setProfile({ ...profile, profile_photo_url: publicUrl })
      setProfilePhoto(null)
      
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
  
      // Check if currency changed
      const currencyChanged = currency !== profile.currency
      let newBalance = profile.balance
  
      if (currencyChanged) {
        newBalance = await convertCurrency(
          profile.currency,
          currency,
          parseFloat(profile.balance)
        )
      }
  
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          phone_number: phoneNumber,
          country: country,
          currency: currency,
          balance: newBalance
        })
        .eq('id', profile.id)
  
      if (error) throw error
  
      setProfile({
        ...profile,
        full_name: fullName,
        username: username,
        phone_number: phoneNumber,
        country: country,
        currency: currency,
        balance: newBalance
      })
  
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
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

      // Clear password fields
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

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
  
      // Check if currency changed
      const currencyChanged = currency !== profile.currency
      let newBalance = profile.balance
  
      if (currencyChanged) {
        newBalance = await convertCurrency(
          profile.currency,
          currency,
          parseFloat(profile.balance)
        )
      }
  
      const { error } = await supabase
        .from('profiles')
        .update({
          currency: currency,
          balance: newBalance
        })
        .eq('id', profile.id)
  
      if (error) throw error
  
      setProfile({ 
        ...profile, 
        currency: currency,
        balance: newBalance
      })
  
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating preferences:', error)
      alert('Failed to update preferences')
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
            <p className="font-bold">Settings Updated!</p>
            <p className="text-sm opacity-90">Your changes have been saved</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-slate-400">Manage your account settings and preferences</p>
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

            {/* Photo Menu Dropdown */}
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

      {/* Photo View Modal */}
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

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Profile Tab */}
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

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <form onSubmit={handleChangePassword} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5" />
                      Update Password
                    </>
                  )}
                </button>
              </form>

              {/* Two-Factor Authentication */}
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
                <h3 className="text-xl font-bold mb-4">Two-Factor Authentication</h3>
                <p className="text-slate-400 mb-4">Add an extra layer of security to your account</p>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-colors">
                  <Smartphone className="w-5 h-5" />
                  Enable 2FA
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleUpdateNotifications} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="font-semibold">Email Notifications</p>
                      <p className="text-sm text-slate-400">Receive email updates about your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="font-semibold">Trade Alerts</p>
                      <p className="text-sm text-slate-400">Get notified about your trade activities</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tradeAlerts}
                        onChange={(e) => setTradeAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="font-semibold">Deposit Alerts</p>
                      <p className="text-sm text-slate-400">Notifications for deposit status updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={depositAlerts}
                        onChange={(e) => setDepositAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="font-semibold">Withdrawal Alerts</p>
                      <p className="text-sm text-slate-400">Notifications for withdrawal status updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={withdrawalAlerts}
                        onChange={(e) => setWithdrawalAlerts(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
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

          {/* Preferences Tab */}
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Language
                    </label>
                    <select
                      defaultValue="en"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
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
          {/* Account Status */}
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
            <button
              onClick={() => router.push('/user/verification')}
              className="w-full mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              Complete Verification
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
            <h3 className="font-bold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">Payment Methods</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left">
                <Building className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Bank Accounts</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors text-left">
                <Shield className="w-5 h-5 text-amber-400" />
                <span className="text-sm">Security Log</span>
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6">
            <h3 className="font-bold text-rose-400 mb-4">Danger Zone</h3>
            <p className="text-sm text-slate-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="w-full px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-sm font-medium transition-colors">
              Delete Account
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