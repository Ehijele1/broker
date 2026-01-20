'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'


export default function Header() {
  const [servicesOpen, setServicesOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)

  {/*// Mock cryptocurrency data with prices
  const cryptoData = [
    { name: 'BTC', price: '$43,250.50', change: '+2.5%', positive: true },
    { name: 'ETH', price: '$2,345.80', change: '+1.8%', positive: true },
    { name: 'BNB', price: '$315.20', change: '-0.5%', positive: false },
    { name: 'SOL', price: '$98.75', change: '+5.2%', positive: true },
    { name: 'XRP', price: '$0.62', change: '+3.1%', positive: true },
    { name: 'ADA', price: '$0.48', change: '-1.2%', positive: false },
    { name: 'DOGE', price: '$0.085', change: '+0.8%', positive: true },
    { name: 'MATIC', price: '$0.92', change: '+2.3%', positive: true },
    { name: 'DOT', price: '$7.45', change: '-0.9%', positive: false },
    { name: 'AVAX', price: '$38.60', change: '+4.1%', positive: true },
  ]*/}

  const [cryptoData, setCryptoData] = useState([])

  useEffect(() => {
    const fetchCrypto = async () => {
      try {
        const res = await fetch('/api/crypto')
        const data = await res.json()
        setCryptoData(data)
      } catch (error) {
        console.error('Error fetching crypto prices')
      }
    }
  
    fetchCrypto()
    const interval = setInterval(fetchCrypto, 60000)
  
    return () => clearInterval(interval)
  }, [])
  


  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Main Navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              SecureTrading
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Home
            </Link>

            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              About
            </Link>

            {/* Services Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center">
                Services
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2">
                  <Link href="/buy-crypto" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    Buy Crypto
                  </Link>
                  <Link href="/copy-trading" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    Copy Trading
                  </Link>
                </div>
              )}
            </div>

            {/* Trading Tools Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setToolsOpen(true)}
              onMouseLeave={() => setToolsOpen(false)}
            >
              <button className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center">
                Trading Tools
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {toolsOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2">
                  <Link href="/forex-chart" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    Forex Chart
                  </Link>
                  <Link href="/index-chart" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    Index Chart
                  </Link>
                  <Link href="/crypto-market" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    Crypto Market
                  </Link>
                </div>
              )}
            </div>

            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Contact Us
            </Link>

            <Link 
              href="/signin" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Live Crypto Ticker */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden py-3">
        <div className="flex animate-scroll whitespace-nowrap">
          {cryptoData.length > 0 &&
            [...cryptoData, ...cryptoData].map((crypto, index) => (
              <div key={index} className="inline-flex items-center mx-8">
                <span className="text-white font-bold mr-2">{crypto.name}</span>
                <span className="text-gray-300 mr-2">{crypto.price}</span>
                <span
                  className={`text-sm font-semibold ${
                    crypto.positive ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {crypto.change}
                </span>
              </div>
            ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </header>
  )
}