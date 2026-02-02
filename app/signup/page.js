'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Globe } from 'lucide-react'
import Header from '@/components/Header'

export default function SignUp() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    country: '',
    currency: 'USD',
    phoneNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkIfAlreadyLoggedIn()
  }, [])

  // Google Translate Integration
  useEffect(() => {
    // Load Google Translate script
    const addScript = () => {
      if (document.querySelector('script[src*="translate.google.com"]')) return;
      
      window.googleTranslateElementInit = function() {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,es,fr,de,it,pt,ru,ja,ko,zh-CN,zh-TW,ar,hi,bn,pa,te,mr,ta,tr,vi,pl,uk,ro,nl,el,cs,sv,hu,fi,da,no',
          autoDisplay: false
        }, 'google_translate_element_hidden');
      };
      
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    };

    setTimeout(addScript, 100);

    // Minimal styles - only hide the hidden element, allow banner to show
    const style = document.createElement('style');
    style.innerHTML = `
      /* Only hide our hidden translate element */
      #google_translate_element_hidden {
        display: none !important;
      }
      
      /* Style the Google Translate banner to look better */
      .goog-te-banner-frame.skiptranslate {
        background: ${isDarkMode ? '#1e293b' : '#ffffff'} !important;
        border-bottom: 1px solid ${isDarkMode ? '#334155' : '#e5e7eb'} !important;
      }
      
      /* Adjust header when Google Translate bar appears */
      body[style*="top"] header,
      body[style*="top"] > div > header {
        top: 40px !important;
      }
      
      /* Adjust fixed elements when translate bar is present */
      body[style*="top"] .fixed {
        transition: top 0.3s ease !important;
      }
    `;
    document.head.appendChild(style);

    // Monitor body.style.top changes to adjust fixed elements
    const adjustFixedElements = () => {
      const bodyTop = window.getComputedStyle(document.body).top;
      const topValue = parseInt(bodyTop) || 0;
      
      if (topValue > 0) {
        // Google Translate bar is active
        // Find all fixed elements and adjust their top position
        const fixedElements = document.querySelectorAll('.fixed');
        fixedElements.forEach(el => {
          const currentTop = parseInt(window.getComputedStyle(el).top) || 0;
          if (currentTop < 100) { // Only adjust elements near the top
            el.style.top = `${currentTop + topValue}px`;
          }
        });
      }
    };

    // Watch for body style changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          adjustFixedElements();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style']
    });

    // Also run on interval as backup
    const intervalId = setInterval(adjustFixedElements, 500);

    return () => {
      clearInterval(intervalId);
      const scripts = document.querySelectorAll('script[src*="translate.google.com"]');
      scripts.forEach(script => script.remove());
      style.remove();
      observer.disconnect();
    };
  }, [isDarkMode]);

  const changeLanguage = (langCode) => {
    setSelectedLanguage(langCode);
    
    if (langCode === 'en') {
      // Reset to original language
      const translateElement = document.querySelector('.goog-te-combo');
      if (translateElement) {
        translateElement.value = '';
        translateElement.dispatchEvent(new Event('change'));
      }
      
      // Remove Google Translate cookies
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      
      // Reload the page to reset
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Trigger Google Translate for other languages
      setTimeout(() => {
        const selectElement = document.querySelector('.goog-te-combo');
        if (selectElement) {
          selectElement.value = langCode;
          selectElement.dispatchEvent(new Event('change'));
        }
      }, 500);
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh-CN', name: 'Chinese (S)', flag: '🇨🇳' },
    { code: 'zh-TW', name: 'Chinese (T)', flag: '🇹🇼' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' }
  ];

  const checkIfAlreadyLoggedIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role === 'admin') {
          router.push('/admin/dashboard')
          return
        } else {
          router.push('/user/dashboard')
          return
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setCheckingAuth(false)
    }
  }

  // Add this before your return statement
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
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
      // Sign up the user (profile will be auto-created by trigger)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
            country: formData.country,
            currency: formData.currency,
            phone_number: formData.phoneNumber
          }
        }
      })
  
      if (authError) throw authError
  
      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
  
      // Update the profile with additional fields
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          username: formData.username,
          country: formData.country,
          currency: formData.currency,
          phone_number: formData.phoneNumber
        })
        .eq('id', authData.user.id)
  
      if (updateError) throw updateError
  
      alert('Account created successfully! Please check your email to verify your account.')
      router.push('/signin')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header isDarkMode={isDarkMode} />

      {/* Hidden Google Translate Element */}
      <div id="google_translate_element_hidden" style={{ display: 'none' }}></div>

      <div className={`min-h-screen flex items-center justify-center py-24 px-6 transition-colors duration-300 ${
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

        <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300 mt-16 ${
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
            Create Account
          </h2>
          
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
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                    : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                }`}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                    : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                }`}
                placeholder="Choose a username"
              />
            </div>

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
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                    : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                }`}
                placeholder="Create a password"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}>
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                    : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                }`}
                placeholder="Enter your country"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}>
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white'
                    : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900'
                }`}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="NGN">NGN - Nigerian Naira</option>
                <option value="ZAR">ZAR - South African Rand</option>
                <option value="KES">KES - Kenyan Shilling</option>
                <option value="GHS">GHS - Ghanaian Cedi</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  isDarkMode
                    ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                    : 'bg-white border border-gray-300 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400'
                }`}
                placeholder="Enter your phone number"
              />
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className={`text-center mt-6 text-sm ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            Already have an account?{' '}
            <a 
              href="/signin" 
              className={`font-medium hover:underline ${
                isDarkMode
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </>
  )
}