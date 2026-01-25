'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, Activity, 
  History, DollarSign, Euro, PoundSterling, Banknote
} from 'lucide-react'

export default function UserDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cryptoData, setCryptoData] = useState([])
  const [cryptoLoading, setCryptoLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [exchangeRate, setExchangeRate] = useState(1)
  
  // Currency icon mapping
  const getCurrencyIcon = (currency) => {
    const icons = {
      'USD': <DollarSign className="w-8 h-8" />,
      'EUR': <Euro className="w-8 h-8" />,
      'GBP': <PoundSterling className="w-8 h-8" />,
      'NGN': <Banknote className="w-8 h-8" />,
      'ZAR': <Banknote className="w-8 h-8" />,
      'KES': <Banknote className="w-8 h-8" />,
      'GHS': <Banknote className="w-8 h-8" />
    }
    return icons[currency] || <DollarSign className="w-8 h-8" />
  }

  useEffect(() => {
    getProfile()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchExchangeRate()
      fetchCryptoData()
      
      const interval = setInterval(() => {
        fetchExchangeRate()
        fetchCryptoData()
      }, 60000)
      
      return () => clearInterval(interval)
    }
  }, [profile])

  const getProfile = async () => {
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

      setProfile(profileData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExchangeRate = async () => {
    try {
      if (!profile || profile.currency === 'USD') {
        setExchangeRate(1)
        return
      }

      // Using exchangerate-api.com (free tier)
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/USD`
      )
      
      if (!response.ok) {
        console.error('Failed to fetch exchange rates')
        setExchangeRate(1)
        return
      }
      
      const data = await response.json()
      const rate = data.rates[profile.currency] || 1
      setExchangeRate(rate)
    } catch (error) {
      console.error('Error fetching exchange rate:', error)
      setExchangeRate(1)
    }
  }

  const fetchCryptoData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,tether,ripple,cardano,dogecoin,polygon&order=market_cap_desc&per_page=8&page=1&sparkline=true&price_change_percentage=24h'
      )
      
      if (!response.ok) throw new Error('Failed to fetch crypto data')
      
      const data = await response.json()
      
      const transformedData = data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        value: coin.current_price,
        change: coin.price_change_percentage_24h,
        trend: coin.price_change_percentage_24h >= 0 ? 'up' : 'down',
        marketCap: coin.market_cap,
        volume: coin.total_volume,
        sparkline: coin.sparkline_in_7d?.price || [],
        image: coin.image,
        high24h: coin.high_24h,
        low24h: coin.low_24h,
        allocation: 0
      }))
      
      const totalMarketCap = transformedData.reduce((sum, coin) => sum + coin.marketCap, 0)
      transformedData.forEach(coin => {
        coin.allocation = Math.round((coin.marketCap / totalMarketCap) * 100)
      })
      
      setCryptoData(transformedData)
      setLastUpdate(new Date())
      setCryptoLoading(false)
    } catch (error) {
      console.error('Error fetching crypto data:', error)
      setCryptoLoading(false)
    }
  }

  // Convert price to user's currency
  const convertPrice = (usdPrice) => {
    return usdPrice * exchangeRate
  }

  // Format price with currency
  const formatPrice = (usdPrice, decimals = 2) => {
    const convertedPrice = convertPrice(usdPrice)
    return convertedPrice.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })
  }

  const topCryptoAssets = cryptoData.slice(0, 4)

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Hero Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 shadow-2xl shadow-emerald-500/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-emerald-100 text-sm font-medium">TOTAL BALANCE</p>
                {lastUpdate && (
                  <span className="text-xs text-emerald-200/60">
                    Updated {new Date(lastUpdate).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-2">
                {profile.currency} {Number(profile.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h1>
              <div className="flex items-center gap-2 text-emerald-100">
                <TrendingUp className="w-5 h-5" />
                <span className="text-lg font-semibold">
                  {cryptoLoading ? 'Loading...' : `${topCryptoAssets.length} assets tracked`}
                </span>
              </div>
            </div>
            <div className="hidden lg:block p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              {getCurrencyIcon(profile.currency)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {cryptoLoading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <p className="text-emerald-100/80 text-xs mb-1">Loading...</p>
                    <div className="h-7 bg-white/10 rounded w-16"></div>
                  </div>
                ))}
              </>
            ) : topCryptoAssets.length > 0 ? (
              <>
                <div>
                  <p className="text-emerald-100/80 text-xs mb-1">BTC Price</p>
                  <p className="text-xl font-bold">
                    {profile.currency} {topCryptoAssets.find(c => c.symbol === 'BTC') 
                      ? formatPrice(topCryptoAssets.find(c => c.symbol === 'BTC').value) 
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100/80 text-xs mb-1">ETH Price</p>
                  <p className="text-xl font-bold">
                    {profile.currency} {topCryptoAssets.find(c => c.symbol === 'ETH')
                      ? formatPrice(topCryptoAssets.find(c => c.symbol === 'ETH').value)
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-emerald-100/80 text-xs mb-1">Market Cap</p>
                  <p className="text-xl font-bold">
                    {profile.currency} {formatPrice(cryptoData.reduce((sum, c) => sum + c.marketCap, 0) / 1e9, 1)}B
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard icon={<ArrowUpRight className="w-6 h-6" />} title="Deposit" color="emerald" onClick={() => router.push('/user/deposit')} />
        <ActionCard icon={<ArrowDownLeft className="w-6 h-6" />} title="Withdraw" color="rose" onClick={() => router.push('/user/withdrawal')} />
        <ActionCard icon={<Activity className="w-6 h-6" />} title="Trade" color="blue" onClick={() => router.push('/user/trade')} />
        <ActionCard icon={<History className="w-6 h-6" />} title="History" color="purple" onClick={() => router.push('/user/transactions')} />
      </div>

      {/* Crypto Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {cryptoLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 animate-pulse">
              <div className="h-20 bg-slate-700 rounded mb-4"></div>
              <div className="h-16 bg-slate-700 rounded"></div>
            </div>
          ))
        ) : (
          topCryptoAssets.map((asset) => (
            <CryptoCard 
              key={asset.id} 
              asset={asset} 
              currency={profile.currency}
              formatPrice={formatPrice}
            />
          ))
        )}
      </div>

      {/* Portfolio & Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Live Market Data</h3>
            <button 
              onClick={() => {
                fetchExchangeRate()
                fetchCryptoData()
              }} 
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Refresh <Activity className="w-4 h-4 inline" />
            </button>
          </div>
          
          {cryptoData.length > 0 && (
            <div className="space-y-4">
              {cryptoData.slice(0, 6).map((asset, index) => (
                <div key={asset.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center border border-slate-700 overflow-hidden">
                    {asset.image ? <img src={asset.image} alt={asset.name} className="w-8 h-8" /> : asset.symbol}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{asset.name}</span>
                        <span className={`text-xs font-semibold ${asset.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {asset.trend === 'up' ? '↑' : '↓'} {Math.abs(asset.change).toFixed(2)}%
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {profile.currency} {formatPrice(asset.value)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                          index === 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                          index === 3 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                          index === 4 ? 'bg-gradient-to-r from-rose-500 to-pink-500' :
                          'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${Math.min(asset.allocation, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
          <h3 className="text-xl font-bold mb-6">Account Details</h3>
          <div className="space-y-4">
            <ProfileField label="Plan" value={profile.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : 'Basic'} />
            <ProfileField label="Email" value={profile.email} />
            <ProfileField label="Phone" value={profile.phone_number} />
            <ProfileField label="Country" value={profile.country} />
            <ProfileField label="Currency" value={profile.currency} />
          </div>
        </div>
      </div>

      {/* Stats Cards 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Trades" value="0" icon={<Activity className="w-6 h-6" />} color="blue" />
        <StatCard label="Profit/Loss" value="+0.00%" icon={<TrendingUp className="w-6 h-6" />} color="emerald" />
        <StatCard label="Portfolio Value" value={`${profile.currency} ${Number(profile.balance).toFixed(2)}`} icon={<Wallet className="w-6 h-6" />} color="purple" />
      </div>*/}
    </div>
  )
}

// Component definitions
function ActionCard({ icon, title, color, onClick }) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-500/50',
    rose: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:border-rose-500/50',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50',
    purple: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 hover:border-purple-500/50'
  }

  return (
    <button 
      onClick={onClick}
      className={`group relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-2xl p-6 border transition-all hover:scale-105 hover:shadow-xl`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform">{icon}</div>
        <span className="font-semibold">{title}</span>
      </div>
    </button>
  )
}

function CryptoCard({ asset, currency, formatPrice }) {
  const sparklineData = asset.sparkline && asset.sparkline.length > 0 ? asset.sparkline : Array.from({ length: 24 }, (_, i) => asset.value * (1 + Math.random() * 0.02 - 0.01))
  const minPrice = Math.min(...sparklineData)
  const maxPrice = Math.max(...sparklineData)
  const priceRange = maxPrice - minPrice
  
  const generatePath = () => {
    const width = 100
    const height = 40
    const padding = 2
    const points = sparklineData.map((price, index) => {
      const x = (index / (sparklineData.length - 1)) * width
      const y = height - padding - ((price - minPrice) / priceRange) * (height - padding * 2)
      return `${x},${y}`
    })
    const pathD = `M ${points.join(' L ')}`
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`
    return { pathD, areaD }
  }
  
  const { pathD, areaD } = generatePath()
  
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 hover:border-slate-700 transition-all hover:shadow-xl group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {asset.image && <img src={asset.image} alt={asset.name} className="w-8 h-8" />}
          <div>
            <h4 className="font-bold text-lg">{asset.name}</h4>
            <p className="text-sm text-slate-400">{asset.symbol}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${asset.trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {asset.trend === 'up' ? '+' : ''}{asset.change.toFixed(2)}%
        </span>
      </div>
      <div className="mb-2">
        <p className="text-2xl font-bold">{currency} {formatPrice(asset.value)}</p>
        <p className="text-xs text-slate-400 mt-1">
          24h High: {currency} {formatPrice(asset.high24h)}
        </p>
      </div>
      <div className="h-16 opacity-60 group-hover:opacity-100 transition-opacity">
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${asset.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={asset.trend === 'up' ? '#10b981' : '#ef4444'} stopOpacity="0.4"/>
              <stop offset="100%" stopColor={asset.trend === 'up' ? '#10b981' : '#ef4444'} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#gradient-${asset.id})`} />
          <path d={pathD} fill="none" stroke={asset.trend === 'up' ? '#10b981' : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  )
}

function ProfileField({ label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    purple: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30'
  }

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-2xl p-6 border`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}