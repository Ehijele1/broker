'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Moon, Sun, Eye, EyeOff, Globe } from 'lucide-react'
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
  const [rememberMe, setRememberMe] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark')
    }
  }, [])

  // Load saved email and remember me preference
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    const wasRemembered = localStorage.getItem('rememberMe') === 'true'
    
    if (savedEmail && wasRemembered) {
      setFormData(prev => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
  }, [])

  // Add this useEffect after your existing useEffect for theme
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
      /* Hide our hidden translate element */
      #google_translate_element_hidden {
        display: none !important;
      }
      
      /* HIDE the Google Translate banner completely */
      .goog-te-banner-frame.skiptranslate {
        display: none !important;
      }
      
      /* Remove the top margin that Google Translate adds to body */
      body {
        top: 0 !important;
      }
      
      /* Hide the Google Translate toolbar */
      .skiptranslate {
        display: none !important;
      }
      
      /* Hide the "Show original" button/tooltip */
      #goog-gt-tt, .goog-te-balloon-frame {
        display: none !important;
      }
      
      /* Additional: Hide any Google Translate gadget */
      .goog-te-gadget {
        display: none !important;
      }
      
      /* Ensure body doesn't get pushed down */
      body.translated-ltr {
        top: 0 !important;
        margin-top: 0 !important;
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

      // Handle Remember Me functionality
      if (rememberMe) {
        // Save email and remember preference to localStorage
        localStorage.setItem('rememberedEmail', formData.email.trim())
        localStorage.setItem('rememberMe', 'true')
      } else {
        // Clear saved email if Remember Me is unchecked
        localStorage.removeItem('rememberedEmail')
        localStorage.removeItem('rememberMe')
      }

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
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`mr-2 w-4 h-4 rounded focus:ring-2 cursor-pointer ${
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