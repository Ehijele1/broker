'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import Header from '@/components/Header'

export default function ResetPassword() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [validToken, setValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  // Check if user has valid reset token
  useEffect(() => {
    checkResetToken()
  }, [])

  const checkResetToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setValidToken(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    } catch (error) {
      console.error('Error checking token:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setCheckingToken(false)
    }
  }

  // Save theme preference to localStorage when changed
  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess(true)
      
      // Redirect to signin after 3 seconds
      setTimeout(() => {
        router.push('/signin')
      }, 3000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    const colors = ['', 'text-rose-500', 'text-orange-500', 'text-amber-500', 'text-emerald-500', 'text-emerald-600']
    
    return { strength, label: labels[strength], color: colors[strength] }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  if (checkingToken) {
    return (
      <>
        <Header isDarkMode={isDarkMode} />
        <div className={`min-h-screen flex items-center justify-center ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header isDarkMode={isDarkMode} />
      <div className={`min-h-screen flex items-center justify-center py-12 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`fixed top-24 right-6 z-50 p-3 rounded-full transition-all duration-300 ${
            isDarkMode
              ? 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700 text-amber-400'
              : 'bg-white border border-gray-300 hover:bg-gray-50 text-indigo-600 shadow-lg'
          }`}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/50 backdrop-blur-sm border border-slate-800/50' 
            : 'bg-white border border-gray-200'
        }`}>
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                  : 'bg-gradient-to-br from-blue-600 to-indigo-600'
              }`}>
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <h2 className={`text-2xl font-bold mb-2 text-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Reset Your Password
          </h2>
          <p className={`text-center mb-6 text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Enter your new password below
          </p>

          {/* Success Message */}
          {success && (
            <div className={`px-4 py-3 rounded-lg mb-6 flex items-start gap-3 ${
              isDarkMode
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-green-100 border border-green-400 text-green-700'
            }`}>
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Password Updated!</p>
                <p className="text-sm opacity-90">
                  Your password has been successfully reset. Redirecting to sign in...
                </p>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className={`px-4 py-3 rounded-lg mb-6 flex items-start gap-3 ${
              isDarkMode
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm">{error}</p>
                {!validToken && (
                  <a 
                    href="/forgot-password" 
                    className="text-sm underline mt-1 inline-block"
                  >
                    Request new reset link
                  </a>
                )}
              </div>
            </div>
          )}

          {validToken && !success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                        : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.strength
                              ? passwordStrength.strength <= 2
                                ? 'bg-rose-500'
                                : passwordStrength.strength <= 3
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                              : isDarkMode
                              ? 'bg-slate-700'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-slate-500' : 'text-gray-400'
                  }`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-12 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                        : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* Match Indicator */}
                {confirmPassword && (
                  <p className={`text-xs mt-2 ${
                    newPassword === confirmPassword
                      ? 'text-emerald-500'
                      : 'text-rose-500'
                  }`}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-blue-500/20'
                }`}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}

          {!validToken && (
            <div className="text-center">
              <a 
                href="/forgot-password"
                className={`inline-block px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                }`}
              >
                Request New Reset Link
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}