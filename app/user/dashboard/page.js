'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, ChartCandlestick, Wallet, ArrowUpRight, ArrowDownLeft, ShieldCheck,
  History, Boxes, Activity, Bell, Settings, LogOut, Menu, X, CalendarDays,
  ChevronRight, Sparkles, BarChart3, Vault, DollarSign, UserRound
} from 'lucide-react'

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [cryptoData, setCryptoData] = useState([])
  const [cryptoLoading, setCryptoLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    checkUser()
    fetchCryptoData()
    
    // Refresh crypto data every 60 seconds
    const interval = setInterval(() => {
      fetchCryptoData()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

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

  const fetchCryptoData = async () => {
    try {
      // CoinGecko API - fetch top cryptocurrencies
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,tether,ripple,cardano,dogecoin,polygon&order=market_cap_desc&per_page=8&page=1&sparkline=true&price_change_percentage=24h'
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch crypto data')
      }
      
      const data = await response.json()
      
      // Transform the data to match our component structure
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
        // Calculate allocation based on market cap (for portfolio distribution)
        allocation: 0 // Will calculate after we have all data
      }))
      
      // Calculate portfolio allocation based on market cap
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  // Get top 4 cryptocurrencies for display
  const topCryptoAssets = cryptoData.slice(0, 4)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">CryptoVault</h1>
                  <p className="text-xs text-slate-400">Premium Trading</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              <NavItem icon={BarChart3} label="Dashboard" active />
              <NavItem icon={Activity} label="Trade" />
              <NavItem icon={ChartCandlestick} label="My Trades" />
              <NavItem icon={Vault} label="Deposit" />
              <NavItem icon={UserRound} label="Copy Trader" />
              <NavItem icon={Boxes} label="Upgrade Plan" />
              <NavItem icon={Wallet} label="Withdrawal" />
              <NavItem icon={CalendarDays} label="All Transactions" />
              <NavItem icon={ShieldCheck} label="Verification" />
              <NavItem icon={History} label="History" />
              <NavItem icon={Settings} label="Settings" />
            </div>

            {/* Quick Stats in Sidebar */}
            <div className="mt-8 p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${cryptoLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                  <span className="text-xs font-medium text-emerald-400">
                    {cryptoLoading ? 'Updating...' : 'Live Market'}
                  </span>
                </div>
              </div>
              {!cryptoLoading && cryptoData.length > 0 && (
                <>
                  <p className="text-2xl font-bold">
                    {cryptoData.filter(c => c.trend === 'up').length}/{cryptoData.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Assets trending up</p>
                </>
              )}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-800/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-sm font-bold">
                {profile.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{profile.full_name}</p>
                <p className="text-xs text-slate-400 truncate">@{profile.username}</p>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-xl font-bold">Welcome back, {profile.full_name}!</h2>
                  <p className="text-sm text-slate-400">Track and manage your crypto portfolio</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

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
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {cryptoLoading ? (
                  <>
                    <div className="animate-pulse">
                      <p className="text-emerald-100/80 text-xs mb-1">Loading...</p>
                      <div className="h-7 bg-white/10 rounded w-16"></div>
                    </div>
                    <div className="animate-pulse">
                      <p className="text-emerald-100/80 text-xs mb-1">Loading...</p>
                      <div className="h-7 bg-white/10 rounded w-16"></div>
                    </div>
                    <div className="animate-pulse">
                      <p className="text-emerald-100/80 text-xs mb-1">Loading...</p>
                      <div className="h-7 bg-white/10 rounded w-16"></div>
                    </div>
                  </>
                ) : topCryptoAssets.length > 0 ? (
                  <>
                    <div>
                      <p className="text-emerald-100/80 text-xs mb-1">BTC Price</p>
                      <p className="text-xl font-bold">
                        ${topCryptoAssets.find(c => c.symbol === 'BTC')?.value.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-emerald-100/80 text-xs mb-1">ETH Price</p>
                      <p className="text-xl font-bold">
                        ${topCryptoAssets.find(c => c.symbol === 'ETH')?.value.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-emerald-100/80 text-xs mb-1">Market Cap</p>
                      <p className="text-xl font-bold">
                        ${(cryptoData.reduce((sum, c) => sum + c.marketCap, 0) / 1e9).toFixed(1)}B
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-emerald-100/80 text-xs mb-1">Today</p>
                      <p className="text-xl font-bold">--</p>
                    </div>
                    <div>
                      <p className="text-emerald-100/80 text-xs mb-1">7 Days</p>
                      <p className="text-xl font-bold">--</p>
                    </div>
                    <div>
                      <p className="text-emerald-100/80 text-xs mb-1">30 Days</p>
                      <p className="text-xl font-bold">--</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionCard 
              icon={<ArrowUpRight className="w-6 h-6" />}
              title="Deposit"
              color="emerald"
            />
            <ActionCard 
              icon={<ArrowDownLeft className="w-6 h-6" />}
              title="Withdraw"
              color="rose"
            />
            <ActionCard 
              icon={<Activity className="w-6 h-6" />}
              title="Trade"
              color="blue"
            />
            <ActionCard 
              icon={<History className="w-6 h-6" />}
              title="History"
              color="purple"
            />
          </div>

          {/* Crypto Assets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {cryptoLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="h-5 bg-slate-700 rounded w-20 mb-2"></div>
                      <div className="h-4 bg-slate-700 rounded w-12"></div>
                    </div>
                    <div className="h-6 bg-slate-700 rounded w-16"></div>
                  </div>
                  <div className="h-8 bg-slate-700 rounded w-24 mb-4"></div>
                  <div className="h-16 bg-slate-700 rounded"></div>
                </div>
              ))
            ) : topCryptoAssets.length > 0 ? (
              topCryptoAssets.map((asset) => (
                <CryptoCard key={asset.id} asset={asset} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-slate-400">
                Failed to load cryptocurrency data. Please refresh.
              </div>
            )}
          </div>

          {/* Portfolio & Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Portfolio Distribution */}
            <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Live Market Data</h3>
                <button 
                  onClick={fetchCryptoData}
                  className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  Refresh <Activity className="w-4 h-4" />
                </button>
              </div>
              
              {cryptoLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-700 rounded w-32 mb-2"></div>
                        <div className="h-2 bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : cryptoData.length > 0 ? (
                <div className="space-y-4">
                  {cryptoData.slice(0, 6).map((asset, index) => (
                    <div key={asset.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center font-bold text-sm border border-slate-700 overflow-hidden">
                        {asset.image ? (
                          <img src={asset.image} alt={asset.name} className="w-8 h-8" />
                        ) : (
                          asset.symbol
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{asset.name}</span>
                            <span className={`text-xs font-semibold ${
                              asset.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {asset.trend === 'up' ? '↑' : '↓'} {Math.abs(asset.change).toFixed(2)}%
                            </span>
                          </div>
                          <span className="text-sm font-medium">${asset.value.toLocaleString()}</span>
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
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No data available
                </div>
              )}
            </div>

            {/* Profile Information */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/50">
              <h3 className="text-xl font-bold mb-6">Account Details</h3>
              <div className="space-y-4">
                <ProfileField label="Email" value={profile.email} />
                <ProfileField label="Phone" value={profile.phone_number} />
                <ProfileField label="Country" value={profile.country} />
                <ProfileField label="Currency" value={profile.currency} />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              label="Total Trades"
              value="0"
              icon={<Activity className="w-6 h-6" />}
              color="blue"
            />
            <StatCard 
              label="Profit/Loss"
              value="+0.00%"
              icon={<TrendingUp className="w-6 h-6" />}
              color="emerald"
            />
            <StatCard 
              label="Portfolio Value"
              value={`${profile.currency} ${Number(profile.balance).toFixed(2)}`}
              icon={<Wallet className="w-6 h-6" />}
              color="purple"
            />
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
      `}</style>
    </div>
  )
}

// Reusable Components
function NavItem({ icon: Icon, label, active = false }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
    }`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  )
}

function ActionCard({ icon, title, color }) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-500/50',
    rose: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:border-rose-500/50',
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-500/50',
    purple: 'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 hover:border-purple-500/50'
  }

  return (
    <button className={`group relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm rounded-2xl p-6 border transition-all hover:scale-105 hover:shadow-xl`}>
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <span className="font-semibold">{title}</span>
      </div>
    </button>
  )
}

function CryptoCard({ asset }) {
  // Normalize sparkline data for visualization
  const sparklineData = asset.sparkline && asset.sparkline.length > 0 
    ? asset.sparkline 
    : Array.from({ length: 24 }, (_, i) => asset.value * (1 + Math.random() * 0.02 - 0.01))
  
  const minPrice = Math.min(...sparklineData)
  const maxPrice = Math.max(...sparklineData)
  const priceRange = maxPrice - minPrice
  
  // Generate SVG path from sparkline data
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
          {asset.image && (
            <img src={asset.image} alt={asset.name} className="w-8 h-8" />
          )}
          <div>
            <h4 className="font-bold text-lg">{asset.name}</h4>
            <p className="text-sm text-slate-400">{asset.symbol}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          asset.trend === 'up' 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/20 text-rose-400'
        }`}>
          {asset.trend === 'up' ? '+' : ''}{asset.change.toFixed(2)}%
        </span>
      </div>
      
      <div className="mb-2">
        <p className="text-2xl font-bold">
          ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          24h High: ${asset.high24h?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
      
      {/* Real sparkline from CoinGecko data */}
      <div className="h-16 opacity-60 group-hover:opacity-100 transition-opacity">
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${asset.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={asset.trend === 'up' ? '#10b981' : '#ef4444'} stopOpacity="0.4"/>
              <stop offset="100%" stopColor={asset.trend === 'up' ? '#10b981' : '#ef4444'} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path
            d={areaD}
            fill={`url(#gradient-${asset.id})`}
          />
          <path
            d={pathD}
            fill="none"
            stroke={asset.trend === 'up' ? '#10b981' : '#ef4444'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
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
        <div className="p-2 bg-white/5 rounded-lg">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}