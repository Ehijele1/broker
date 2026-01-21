'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Header from '@/components/Header'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

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
    setSuccess(false)

    try {
      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess(true)
      setEmail('')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
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
          {/* Back Button */}
          <button
            onClick={() => router.push('/signin')}
            className={`flex items-center gap-2 mb-6 transition-colors ${
              isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Sign In</span>
          </button>

          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                  : 'bg-gradient-to-br from-blue-600 to-indigo-600'
              }`}>
                <Mail className="w-8 h-8 text-white" />
              </div>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-20 h-20 border-4 rounded-full animate-spin ${
                    isDarkMode
                      ? 'border-emerald-500/20 border-t-emerald-500'
                      : 'border-blue-200 border-t-blue-600'
                  }`}></div>
                </div>
              )}
            </div>
          </div>

          <h2 className={`text-2xl font-bold mb-2 text-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Forgot Password?
          </h2>
          <p className={`text-center mb-6 text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            No worries! Enter your email address and we'll send you a link to reset your password.
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
                <p className="font-semibold mb-1">Email Sent!</p>
                <p className="text-sm opacity-90">
                  Check your inbox for password reset instructions. If you don't see it, check your spam folder.
                </p>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className={`px-4 py-3 rounded-lg mb-6 ${
              isDarkMode
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-slate-500' : 'text-gray-400'
                }`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    isDarkMode
                      ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                      : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-blue-500/20'
              }`}
            >
              {loading ? 'Sending...' : success ? 'Email Sent' : 'Send Reset Link'}
            </button>
          </form>

          {/* Additional Info */}
          <div className={`mt-6 p-4 rounded-lg ${
            isDarkMode
              ? 'bg-slate-800/30 border border-slate-700'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <p className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-gray-600'
            }`}>
              <strong className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                Remember your password?
              </strong>
              {' '}
              <a 
                href="/signin" 
                className={`font-medium hover:underline ${
                  isDarkMode
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Sign in here
              </a>
            </p>
          </div>

          {/* Help Section */}
          <div className={`mt-6 text-center text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            <p>Need help? Contact our support team</p>
            <a 
              href="/contact" 
              className={`font-medium hover:underline ${
                isDarkMode
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              support@securetrading.com
            </a>
          </div>
        </div>
      </div>
    </>
  )
}