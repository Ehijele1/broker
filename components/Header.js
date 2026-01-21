'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function Header({ isDarkMode = true }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-slate-900/80 backdrop-blur-lg border-b border-slate-800' 
        : 'bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDarkMode
                ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                : 'bg-gradient-to-br from-blue-600 to-indigo-600'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              SecureTrading
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              About
            </Link>
            <Link 
              href="/features" 
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Features
            </Link>
            <Link 
              href="/contact" 
              className={`transition-colors ${
                isDarkMode 
                  ? 'text-slate-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              href="/signin"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Sign In
            </Link>
            <Link 
              href="/signup"
              className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg ${
                isDarkMode
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white hover:shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-blue-500/20'
              }`}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden py-4 border-t transition-colors ${
            isDarkMode ? 'border-slate-800' : 'border-gray-200'
          }`}>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/" 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/about" 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                About
              </Link>
              <Link 
                href="/features" 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Features
              </Link>
              <Link 
                href="/contact" 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Contact
              </Link>
              <div className="mt-4 flex flex-col gap-2 px-4">
                <Link 
                  href="/signin"
                  className={`px-4 py-2 rounded-lg font-medium text-center transition-colors ${
                    isDarkMode
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup"
                  className={`px-4 py-2 rounded-lg font-medium text-center transition-all shadow-lg ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}