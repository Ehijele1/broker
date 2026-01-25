'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Eye, EyeOff } from 'lucide-react'
import Header from '@/components/Header'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  // Add this useEffect after your existing useEffect for theme
  useEffect(() => {
    checkIfAlreadyLoggedIn()
  }, [])

  const checkIfAlreadyLoggedIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // User is already authenticated, check their role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/user/dashboard')
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  // Save theme preference to localStorage when changed
  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Sign in the user
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) throw signInError

      // Get user profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      // Redirect based on role
      if (profile.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/user/dashboard')
      }
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
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform ${
                isDarkMode
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                  : 'bg-gradient-to-br from-blue-600 to-indigo-600'
              }`}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
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

          <h2 className={`text-2xl font-bold mb-6 text-center ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Welcome Back
          </h2>
          <p className={`text-center mb-6 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Sign in to your account
          </p>
          
          {error && (
            <div className={`px-4 py-3 rounded-lg mb-4 ${
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
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                    : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                }`}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    isDarkMode
                      ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                      : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isDarkMode
                      ? 'text-slate-400 hover:text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className={`mr-2 w-4 h-4 rounded focus:ring-2 ${
                    isDarkMode
                      ? 'text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500'
                      : 'text-blue-600 bg-white border-gray-300 focus:ring-blue-500'
                  }`}
                />
                <span className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-600'
                }`}>
                  Remember me
                </span>
              </label>
              <a 
                href="/forgot-password" 
                className={`text-sm hover:underline ${
                  isDarkMode
                    ? 'text-emerald-400 hover:text-emerald-300'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Forgot Password?
              </a>
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className={`text-center mt-6 text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Don't have an account?{' '}
            <a 
              href="/signup" 
              className={`font-medium hover:underline ${
                isDarkMode
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </>
  )
}