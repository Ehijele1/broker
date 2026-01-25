'use client'
import { useState, useEffect } from 'react'
import { Moon, Sun, Shield, TrendingUp, Users, Zap, Globe, Clock, Lock, BarChart3, Smartphone, HeadphonesIcon, Bell, DollarSign, BookOpen, LineChart, PieChart, AlertCircle, CheckCircle, ArrowRightLeft, Wallet, CreditCard, FileText } from 'lucide-react'
import Header from '@/components/Header'

function FeatureCard({ icon: Icon, title, description, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl border transition-all duration-300 hover:-translate-y-2 ${
      isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-emerald-400/50' : 'bg-white border-indigo-200 shadow-sm hover:shadow-lg hover:border-indigo-400'
    }`}>
      <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 ${
        isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'
      }`}>
        <Icon className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={28} />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
        {description}
      </p>
    </div>
  )
}

function BenefitItem({ text, isDarkMode }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle className={`flex-shrink-0 mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} size={20} />
      <span className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>{text}</span>
    </div>
  )
}

function PricingFeature({ title, description, icon: Icon, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl border ${
      isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'}`}>
          <Icon className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={24} />
        </div>
        <div>
          <h4 className="font-bold mb-2">{title}</h4>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{description}</p>
        </div>
      </div>
    </div>
  )
}

export default function FeaturesPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if(saved) setIsDarkMode(saved === 'dark')
  }, [])

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile?.role === 'admin') {
          window.location.href = '/admin/dashboard'
        } else {
          window.location.href = '/user/dashboard'
        }
      } else {
        setCheckingAuth(false)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setCheckingAuth(false)
    }
  }

  const toggleTheme = () => {
    const val = !isDarkMode
    setIsDarkMode(val)
    localStorage.setItem('theme', val ? 'dark' : 'light')
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-slate-950' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4 ${
            isDarkMode 
              ? 'border-emerald-500/20 border-t-emerald-500' 
              : 'border-indigo-200 border-t-indigo-600'
          }`}></div>
          <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'}`}>
      
      <Header isDarkMode={isDarkMode} />

      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className={`fixed top-24 right-6 z-50 p-3 rounded-full transition-all duration-300 ${
          isDarkMode
            ? 'bg-slate-800 text-amber-400'
            : 'bg-white border border-gray-300 hover:bg-gray-50 text-indigo-600 shadow-lg'
        }`}
      >
        {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
      </button>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className={`inline-block px-4 py-2 rounded-full mb-6 ${
            isDarkMode ? 'bg-emerald-400/10 border border-emerald-400/20' : 'bg-indigo-100 border border-indigo-200'
          }`}>
            <span className={`font-semibold text-sm ${isDarkMode ? 'text-emerald-400' : 'text-indigo-700'}`}>
              ⚡ Powerful Trading Platform
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Everything You Need to <span className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}>Trade Successfully</span>
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            From advanced analytics to copy trading, our platform provides all the tools and features you need to trade like a professional.
          </p>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Core Trading Features</h2>
            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Professional-grade tools designed to give you an edge in the markets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Users}
              title="Copy Trading"
              description="Automatically mirror the trades of successful traders. Follow experts and replicate their strategies with just one click."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={BarChart3}
              title="Advanced Analytics"
              description="Real-time market data, customizable charts, and technical indicators to make informed trading decisions."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={TrendingUp}
              title="Multi-Asset Trading"
              description="Trade forex, cryptocurrencies, stocks, indices, commodities, and CFDs all from a single platform."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={Zap}
              title="Lightning-Fast Execution"
              description="Execute trades in milliseconds with our optimized infrastructure and direct market access."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={LineChart}
              title="AI-Powered Insights"
              description="Get intelligent trading suggestions and market predictions powered by advanced machine learning algorithms."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={PieChart}
              title="Portfolio Management"
              description="Track your investments, analyze performance, and optimize your portfolio with powerful management tools."
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* COPY TRADING DEEP DIVE */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold mb-6">
                <span className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}>Copy Trading</span> Made Simple
              </h2>
              <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Never miss an opportunity. Follow expert traders and automatically copy their positions, 
                strategies, and portfolio allocations in real-time.
              </p>

              <div className="space-y-4">
                <BenefitItem text="Choose from thousands of verified expert traders" isDarkMode={isDarkMode} />
                <BenefitItem text="Set custom risk management parameters" isDarkMode={isDarkMode} />
                <BenefitItem text="Copy multiple traders simultaneously" isDarkMode={isDarkMode} />
                <BenefitItem text="Stop-loss and take-profit automation" isDarkMode={isDarkMode} />
                <BenefitItem text="Detailed performance analytics for each trader" isDarkMode={isDarkMode} />
                <BenefitItem text="Start with as little as $100" isDarkMode={isDarkMode} />
              </div>

              <a 
                href="/signup" 
                className={`inline-block mt-8 px-8 py-4 rounded-full font-bold transition-colors ${
                  isDarkMode
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                }`}
              >
                Start Copy Trading
              </a>
            </div>

            <div className={`p-8 rounded-2xl border ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-indigo-50 border-indigo-200'
            }`}>
              <div className="aspect-square rounded-xl flex items-center justify-center">
                <Users className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={200} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Bank-Grade Security</h2>
            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Your safety is our top priority. We use military-grade encryption and multiple security layers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={Shield}
              title="SSL Encryption"
              description="All data transmission is protected with 256-bit SSL encryption, the same standard used by banks."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={Lock}
              title="Two-Factor Authentication"
              description="Add an extra layer of security to your account with 2FA using authenticator apps or SMS."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={AlertCircle}
              title="Real-Time Monitoring"
              description="24/7 fraud detection and monitoring to protect your account from unauthorized access."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={Wallet}
              title="Segregated Accounts"
              description="Client funds are kept in segregated accounts, separate from company operational funds."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={FileText}
              title="Regulatory Compliance"
              description="Fully licensed and regulated in multiple jurisdictions, ensuring your protection."
              isDarkMode={isDarkMode}
            />
            <FeatureCard 
              icon={Bell}
              title="Activity Alerts"
              description="Get instant notifications for all account activities including logins, withdrawals, and trades."
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* PLATFORM ACCESS */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-indigo-50/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Trade Anywhere, Anytime</h2>
            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Access your account and trade on any device with our responsive platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className={`p-8 rounded-2xl border text-center ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <div className="mb-6 flex justify-center">
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'}`}>
                  <Globe className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={48} />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Web Platform</h3>
              <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Full-featured trading platform accessible from any web browser. No downloads required.
              </p>
              <a 
                href="/signin" 
                className={`inline-block px-6 py-3 rounded-full font-semibold transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700' 
                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                }`}
              >
                Open Web Platform
              </a>
            </div>

            <div className={`p-8 rounded-2xl border text-center ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <div className="mb-6 flex justify-center">
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'}`}>
                  <Smartphone className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={48} />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Mobile Apps</h3>
              <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Trade on-the-go with our native iOS and Android apps. Full functionality in your pocket.
              </p>
              <a 
                href="#" 
                className={`inline-block px-6 py-3 rounded-full font-semibold transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700' 
                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                }`}
              >
                Download App
              </a>
            </div>

            <div className={`p-8 rounded-2xl border text-center ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <div className="mb-6 flex justify-center">
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'}`}>
                  <BarChart3 className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={48} />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">Desktop App</h3>
              <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Advanced trading interface for Windows and Mac with enhanced charting capabilities.
              </p>
              <a 
                href="#" 
                className={`inline-block px-6 py-3 rounded-full font-semibold transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700' 
                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                }`}
              >
                Download Desktop
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ACCOUNT FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Account Management</h2>
            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Seamless deposits, withdrawals, and account operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <PricingFeature 
              icon={CreditCard}
              title="Multiple Payment Methods"
              description="Deposit and withdraw using credit/debit cards, bank transfers, e-wallets, and cryptocurrencies."
              isDarkMode={isDarkMode}
            />
            <PricingFeature 
              icon={Zap}
              title="Instant Deposits"
              description="Most deposits are credited to your account instantly, so you can start trading immediately."
              isDarkMode={isDarkMode}
            />
            <PricingFeature 
              icon={Clock}
              title="Fast Withdrawals"
              description="Request withdrawals anytime and receive your funds within 24 hours or instantly for select methods."
              isDarkMode={isDarkMode}
            />
            <PricingFeature 
              icon={DollarSign}
              title="No Hidden Fees"
              description="Transparent pricing with no hidden fees. You only pay the spread on trades, nothing more."
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* EDUCATION & SUPPORT */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className={`p-8 rounded-2xl border ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-indigo-50 border-indigo-200'
            }`}>
              <div className="aspect-square rounded-xl flex items-center justify-center">
                <BookOpen className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={200} />
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-extrabold mb-6">
                Learn & Grow with <span className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}>Expert Support</span>
              </h2>
              <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Access comprehensive educational resources and get support whenever you need it.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'}`}>
                    <BookOpen className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Trading Academy</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Free courses, webinars, and tutorials covering everything from basics to advanced strategies.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'}`}>
                    <HeadphonesIcon className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">24/7 Customer Support</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Get help anytime via live chat, email, or phone. Our expert team is always ready to assist.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'}`}>
                    <Users className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">Trading Community</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Join our community of traders to share insights, strategies, and learn from each other.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-indigo-50/50'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Ready to Experience the Difference?
          </h2>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Create your free account today and get access to all our premium features
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a 
              href="/signup" 
              className={`px-8 py-4 rounded-full font-bold transition-colors ${
                isDarkMode
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
              }`}
            >
              Start Trading Free
            </a>
            <a 
              href="/contact" 
              className={`px-8 py-4 border rounded-full font-bold transition-colors ${
                isDarkMode
                  ? 'border-slate-700 hover:border-emerald-500'
                  : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-16 px-6 border-t ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-100'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* About */}
            <div>
              <h3 className={`font-extrabold text-xl mb-4 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`}>
                SecureTrading
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                We help your money grow by putting it to work. Our experts ensure not only that your funds are at work, but are put in carefully planned and strategically diversified trading and investment portfolio.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {['About Us', 'Forex Charts', 'Index Charts', 'Crypto Charts'].map(item => (
                  <li key={item}>
                    <a href="#" className={`transition-colors ${
                      isDarkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-gray-600 hover:text-indigo-600'
                    }`}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                {['Terms & Conditions', 'Privacy Policy', 'Risk Disclosure', 'Support Center'].map(item => (
                  <li key={item}>
                    <a href="#" className={`transition-colors ${
                      isDarkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-gray-600 hover:text-indigo-600'
                    }`}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {['Copy Trading', 'Stock Trading', 'Forex Trading', 'Crypto Trading'].map(item => (
                  <li key={item}>
                    <a href="#" className={`transition-colors ${
                      isDarkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-gray-600 hover:text-indigo-600'
                    }`}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <div className={`pt-8 border-t text-center text-sm ${
            isDarkMode ? 'border-slate-800 text-slate-400' : 'border-indigo-100 text-gray-600'
          }`}>
            <p>© 2026 All Rights Reserved By SecureTrading</p>
          </div>
        </div>
      </footer>

    </div>
  )
}