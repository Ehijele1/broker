'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, ArrowLeft, Star, ChevronDown, 
  Activity, DollarSign, Clock, TrendingDown
} from 'lucide-react'

export default function TradePage() {
  const router = useRouter()
  const chartContainerRef = useRef(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Trading state
  const [selectedMarket, setSelectedMarket] = useState('Stock')
  const [selectedAsset, setSelectedAsset] = useState('AAPL')
  const [assetData, setAssetData] = useState({
    price: 255.37,
    change: -2.68,
    changePercent: -1.04,
    high: 258.90,
    low: 254.93,
    volume: '72.14M'
  })
  const [tradeAmount, setTradeAmount] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedLeverage, setSelectedLeverage] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [timeframe, setTimeframe] = useState('1D')
  const [favorites, setFavorites] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Popular assets by market
  const markets = {
    Stock: [
      { symbol: 'AAPL', name: 'Apple Inc', price: 255.37, change: -1.04 },
      { symbol: 'TSLA', name: 'Tesla Inc', price: 342.89, change: 2.45 },
      { symbol: 'GOOGL', name: 'Alphabet Inc', price: 178.52, change: 0.89 },
      { symbol: 'AMZN', name: 'Amazon.com', price: 198.65, change: -0.54 },
      { symbol: 'MSFT', name: 'Microsoft', price: 425.18, change: 1.23 },
      { symbol: 'META', name: 'Meta Platforms', price: 512.33, change: -2.11 }
    ],
    Crypto: [
      { symbol: 'BTC/USD', name: 'Bitcoin', price: 91126, change: -1.55 },
      { symbol: 'ETH/USD', name: 'Ethereum', price: 3106, change: -2.55 },
      { symbol: 'SOL/USD', name: 'Solana', price: 133.31, change: 5.14 },
      { symbol: 'BNB/USD', name: 'Binance Coin', price: 921.34, change: -1.91 },
      { symbol: 'XRP/USD', name: 'Ripple', price: 1.98, change: -2.13 }
    ],
    Forex: [
      { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.17352, change: 0.78 },
      { symbol: 'GBP/USD', name: 'British Pound / USD', price: 1.3245, change: -0.34 },
      { symbol: 'USD/JPY', name: 'USD / Japanese Yen', price: 149.82, change: 0.12 },
      { symbol: 'AUD/USD', name: 'Australian Dollar / USD', price: 0.6712, change: 0.45 },
      { symbol: 'USD/CAD', name: 'USD / Canadian Dollar', price: 1.3456, change: -0.23 }
    ],
    Indices: [
      { symbol: 'SPX', name: 'S&P 500', price: 25116.3, change: -0.51 },
      { symbol: 'NDX', name: 'NASDAQ 100', price: 18245.6, change: -0.89 },
      { symbol: 'DJI', name: 'Dow Jones', price: 38723.2, change: -0.34 },
      { symbol: 'DAX', name: 'DAX 40', price: 19234.5, change: 0.67 },
      { symbol: 'FTSE', name: 'FTSE 100', price: 8123.4, change: 0.23 }
    ]
  }

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    // Load TradingView widget
    if (chartContainerRef.current && typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = () => {
        if (window.TradingView) {
          new window.TradingView.widget({
            autosize: true,
            symbol: getSymbolForChart(),
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: 'light',
            style: '1',
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: 'tradingview_chart',
            studies: [
              'MASimple@tv-basicstudies'
            ],
            disabled_features: ['use_localstorage_for_settings']
          })
        }
      }
      document.head.appendChild(script)

      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      }
    }
  }, [selectedAsset, selectedMarket])

  const getSymbolForChart = () => {
    if (selectedMarket === 'Stock') return `NASDAQ:${selectedAsset}`
    if (selectedMarket === 'Crypto') return `BINANCE:${selectedAsset.replace('/USD', 'USDT')}`
    if (selectedMarket === 'Forex') return `FX:${selectedAsset.replace('/', '')}`
    if (selectedMarket === 'Indices') {
      if (selectedAsset === 'SPX') return 'SP:SPX'
      if (selectedAsset === 'NDX') return 'NASDAQ:NDX'
      if (selectedAsset === 'DJI') return 'DJ:DJI'
      return selectedAsset
    }
    return selectedAsset
  }

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/signin')
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      if (profileData.role === 'admin') {
        router.push('/admin/dashboard')
        return
      }

      setProfile(profileData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssetChange = (asset) => {
    setSelectedAsset(asset.symbol)
    setAssetData({
      price: asset.price,
      change: asset.price * (asset.change / 100),
      changePercent: asset.change,
      high: asset.price * 1.02,
      low: asset.price * 0.98,
      volume: '72.14M'
    })
  }

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
    if (!isFavorite) {
      setFavorites([...favorites, selectedAsset])
    } else {
      setFavorites(favorites.filter(f => f !== selectedAsset))
    }
  }

  const handleTrade = (type) => {
    // Validate inputs
    if (!tradeAmount || !selectedTime || !selectedLeverage || !selectedAccount) {
      alert('Please fill in all fields')
      return
    }

    if (parseFloat(tradeAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (parseFloat(tradeAmount) > parseFloat(profile.balance)) {
      alert('Insufficient balance')
      return
    }

    // Show success message
    setSuccessMessage(`${type.toUpperCase()} order placed: ${tradeAmount} units of ${selectedAsset}`)
    setShowSuccess(true)
    
    // Clear form
    setTradeAmount('')
    setSelectedTime('')
    setSelectedLeverage('')
    setSelectedAccount('')

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!profile) return null

  const currentMarketAssets = markets[selectedMarket]
  const currentAsset = currentMarketAssets.find(a => a.symbol === selectedAsset) || currentMarketAssets[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
          <Activity className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-black text-white border-b border-gray-800">
        <div className="px-4 py-3">
          {/* Top ticker */}
          <div className="flex items-center gap-6 text-sm overflow-x-auto mb-3 pb-2">
            <TickerItem label="S&P 500" value="25,116.3" change="-127.90" percent="-0.51%" positive={false} />
            <TickerItem label="EUR/USD" value="1.17352" change="+0.01" percent="+0.78%" positive={true} />
            <TickerItem label="Bitcoin" value="91,126" change="-1,434" percent="-1.55%" positive={false} />
            <TickerItem label="Ethereum" value="3,106.0" change="-80.9" percent="-2.55%" positive={false} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/user/dashboard')}
                className="flex items-center gap-2 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden md:inline">Back</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <span className="text-xs font-bold">{profile.full_name?.charAt(0)}</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold">{profile.full_name}</p>
                  <p className="text-xs text-gray-400">Balance: {profile.currency} {Number(profile.balance).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Chart Area */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Market & Asset Selection */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select 
              value={selectedMarket}
              onChange={(e) => {
                setSelectedMarket(e.target.value)
                const newMarket = e.target.value
                const firstAsset = markets[newMarket][0]
                handleAssetChange(firstAsset)
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="Stock">Stock</option>
              <option value="Crypto">Crypto</option>
              <option value="Forex">Forex</option>
              <option value="Indices">Indices</option>
            </select>

            <select 
              value={selectedAsset}
              onChange={(e) => {
                const asset = currentMarketAssets.find(a => a.symbol === e.target.value)
                if (asset) handleAssetChange(asset)
              }}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              {currentMarketAssets.map(asset => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Asset Info */}
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{currentAsset.name}</h2>
                <span className="text-sm text-gray-500">· {timeframe} · Live</span>
                <button 
                  onClick={toggleFavorite}
                  className={`p-1 ${isFavorite ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-500`}
                >
                  <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-bold text-gray-900">${assetData.price.toLocaleString()}</p>
                <div className="flex items-center gap-2 text-sm">
                  {assetData.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={assetData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {assetData.changePercent >= 0 ? '+' : ''}{assetData.change.toFixed(2)} ({assetData.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>Vol {assetData.volume}</span>
              <span>H: ${assetData.high.toFixed(2)}</span>
              <span>L: ${assetData.low.toFixed(2)}</span>
            </div>
          </div>

          {/* Timeframe Selection */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W', '1M'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-sm rounded whitespace-nowrap ${
                  timeframe === tf 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* TradingView Chart */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '500px' }}>
            <div id="tradingview_chart" ref={chartContainerRef} style={{ height: '100%' }}></div>
          </div>
        </div>

        {/* Right Panel - Place Trade */}
        <div className="w-full lg:w-96 bg-white border-l border-gray-200 p-4 lg:p-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 mb-6 border border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-blue-600" />
              Place Trade
            </h3>
            
            <div className="space-y-4">
              {/* Asset Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <div className="px-4 py-3 bg-white rounded-lg font-semibold text-gray-900 border border-gray-300">
                  {selectedAsset}
                </div>
              </div>

              {/* Price & Balance */}
              <div className="flex justify-between text-sm bg-white p-3 rounded-lg border border-gray-300">
                <span className="text-gray-600">Price: <span className="font-semibold text-gray-900">${assetData.price.toLocaleString()}</span></span>
                <span className="text-gray-600">Balance: <span className="font-semibold text-green-600">${Number(profile.balance).toFixed(2)}</span></span>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {profile.currency}
                  </span>
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time Frame
                </label>
                <select 
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">--select time--</option>
                  <option value="1">1 minute</option>
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                  <option value="1440">1 day</option>
                </select>
              </div>

              {/* Leverage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leverage</label>
                <select 
                  value={selectedLeverage}
                  onChange={(e) => setSelectedLeverage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">--Leverage--</option>
                  <option value="1">1x (No Leverage)</option>
                  <option value="2">2x</option>
                  <option value="5">5x</option>
                  <option value="10">10x</option>
                  <option value="20">20x</option>
                </select>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select 
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">--Select account--</option>
                  <option value="main">Main Account</option>
                  <option value="demo">Demo Account</option>
                </select>
              </div>

              {/* Buy/Sell Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleTrade('buy')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  BUY
                </button>
                <button
                  onClick={() => handleTrade('sell')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-lg transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <TrendingDown className="w-5 h-5" />
                  SELL
                </button>
              </div>
            </div>
          </div>

          {/* My Favorites */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">My Favorites</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">view all</button>
            </div>
            {favorites.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No Favorites added</p>
                <p className="text-gray-400 text-xs mt-1">Click the star icon to add favorites</p>
              </div>
            ) : (
              <div className="space-y-2">
                {favorites.map(fav => (
                  <div key={fav} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-medium text-gray-900">{fav}</span>
                    <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  </div>
                ))}
              </div>
            )}
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

// Ticker Item Component
function TickerItem({ label, value, change, percent, positive }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold">{value}</span>
      <span className={`text-xs ${positive ? 'text-green-500' : 'text-red-500'}`}>
        {change} ({percent})
      </span>
    </div>
  )
}