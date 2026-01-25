'use client'
import { useState, useEffect } from "react"
import { Moon, Sun, CheckCircle, TrendingUp, Shield, Clock, Users, Zap, Globe } from 'lucide-react'
import Header from '@/components/Header'
import { motion } from 'framer-motion'

/* ---------------- COMPONENTS ---------------- */

function StatBadge({ value, label, isDarkMode, index = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.5, rotateX: -90 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.2,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.1,
        rotate: [0, -3, 3, -3, 0],
        transition: { duration: 0.4 }
      }}
      className={`p-6 rounded-xl border text-center cursor-pointer transition-all duration-300 ${
        isDarkMode ? 'bg-slate-800/40 border-slate-700 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20' : 'bg-white border-indigo-200 shadow-sm hover:shadow-indigo-200/50 hover:shadow-xl'
      }`}
    >
      <motion.h4 
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.2 + 0.3, type: "spring", stiffness: 200 }}
        className={`font-extrabold text-3xl mb-1 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`}
      >
        {value}
      </motion.h4>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.2 + 0.5 }}
        className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
      >
        {label}
      </motion.p>
    </motion.div>
  )
}

function ServiceCard({ icon: Icon, title, description, isDarkMode, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className={`p-8 rounded-2xl border transition-all duration-300 ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50 hover:shadow-xl' : 'bg-white border-indigo-200 shadow-sm hover:shadow-md hover:shadow-indigo-200/50'
      }`}
    >
      <motion.div 
        className="mb-4"
        whileHover={{ scale: 1.2, rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <Icon className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={32} />
      </motion.div>
      <h3 className="font-bold text-xl mb-3">{title}</h3>
      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{description}</p>
    </motion.div>
  )
}

function PlanCard({ name, roi, range, features, popular, isDarkMode, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring" }}
      whileHover={{ scale: 1.05, y: -10 }}
      className={`p-8 rounded-2xl border relative transition-all duration-300 ${
        popular 
          ? isDarkMode 
            ? 'border-emerald-400 shadow-lg shadow-emerald-400/20' 
            : 'border-indigo-500 shadow-lg shadow-indigo-500/20'
          : isDarkMode ? 'border-slate-800' : 'border-indigo-200 shadow-sm hover:shadow-md'
      } ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}
    >
      
      {popular && (
        <motion.span
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full ${
            isDarkMode ? 'bg-emerald-400 text-black' : 'bg-indigo-600 text-white'
          }`}
        >
          POPULAR
        </motion.span>
      )}

      <div className="text-center mb-6">
        <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          {name}
        </p>
        <h3 className="text-4xl font-extrabold mb-2">{range}</h3>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((f,i)=>(
          <motion.li 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + i * 0.1 }}
            className="flex items-center gap-2 text-sm"
          >
            <CheckCircle className={`flex-shrink-0 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} size={18} />
            <span>{f}</span>
          </motion.li>
        ))}
      </ul>

      <a href="/signup" className={`block text-center py-3 rounded-full font-bold transition-colors ${
        popular 
          ? isDarkMode
            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
          : isDarkMode 
            ? 'bg-slate-800 hover:bg-slate-700' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
      }`}>
        Start Now
      </a>
    </motion.div>
  )
}

function FeatureCard({ icon: Icon, title, description, isDarkMode, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, rotate: 2 }}
      className={`p-6 rounded-xl border ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-indigo-200 shadow-sm hover:shadow-lg'
      }`}
    >
      <motion.div
        whileHover={{ rotate: 360, scale: 1.2 }}
        transition={{ duration: 0.5 }}
      >
        <Icon className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={32} />
      </motion.div>
      <h3 className="font-bold text-lg mb-2 mt-4">{title}</h3>
      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{description}</p>
    </motion.div>
  )
}

function TestimonialCard({ quote, name, role, isDarkMode, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className={`p-6 rounded-xl border ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-indigo-200 shadow-sm hover:shadow-lg'
      }`}
    >
      <p className={`mb-6 italic ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
        "{quote}"
      </p>
      <div className="flex items-center gap-3">
        <motion.div 
          whileHover={{ scale: 1.2, rotate: 360 }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
            isDarkMode ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
          }`}
        >
          {name.charAt(0)}
        </motion.div>
        <div>
          <p className="font-bold">{name}</p>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{role}</p>
        </div>
      </div>
    </motion.div>
  )
}

function FAQItem({ question, answer, isDarkMode }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border overflow-hidden ${
        isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
      }`}
    >
      <button 
        onClick={() => setOpen(!open)} 
        className={`w-full p-5 text-left font-semibold flex justify-between items-center transition-colors ${
          isDarkMode ? 'hover:text-emerald-400' : 'hover:text-indigo-600'
        }`}
      >
        <span>{question}</span>
        <motion.span 
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl"
        >
          +
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className={`px-5 pb-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          <p className="text-sm leading-relaxed">{answer}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------------- MAIN PAGE ---------------- */

export default function LandingPage() {
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
      <motion.button 
        onClick={toggleTheme}
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed top-24 right-6 z-50 p-3 rounded-full transition-all duration-300 ${
          isDarkMode
            ? 'bg-slate-800 text-amber-400'
            : 'bg-white border border-gray-300 hover:bg-gray-50 text-indigo-600 shadow-lg'
        }`}
      >
        {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
      </motion.button>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center px-6 pt-28 pb-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: isDarkMode 
                ? "url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop')"
                : "url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2940&auto=format&fit=crop')"
            }}
          />
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95' 
              : 'bg-gradient-to-br from-blue-50/95 via-indigo-50/90 to-purple-50/95'
          }`} />
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30 z-[1]">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className={`absolute top-20 right-10 w-72 h-72 rounded-full blur-3xl ${
              isDarkMode ? 'bg-emerald-400' : 'bg-indigo-400'
            }`}
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 ${
                  isDarkMode 
                    ? 'bg-emerald-400/10 border-emerald-400/20' 
                    : 'bg-indigo-100 border-indigo-200'
                }`}
              >
                <span className={`font-semibold text-sm ${isDarkMode ? 'text-emerald-400' : 'text-indigo-700'}`}>
                  🚀 Trusted by 50,000+ Traders
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
              >
                The right place for <span className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}>online trading</span> on financial markets
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`text-lg mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}
              >
                The most convenient trading interface. Instant access to more than 100 assets of the world's leading companies.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <motion.a 
                  href="/signup"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-8 py-4 rounded-full font-bold transition-colors ${
                    isDarkMode
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                  }`}
                >
                  Get Started
                </motion.a>
                <motion.a 
                  href="/signin"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-8 py-4 border rounded-full font-bold transition-colors ${
                    isDarkMode
                      ? 'hover:border-emerald-500'
                      : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Sign In
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Right Content - Stats Dashboard */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`p-8 rounded-2xl border backdrop-blur ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white/80 border-indigo-200 shadow-lg'
              }`}
            >
              <h3 className="text-xl font-bold mb-6">Live Market Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '$2.4M', label: '24h Volume' },
                  { value: '+12.5%', label: 'BTC Growth' },
                  { value: '1,247', label: 'Active Traders' },
                  { value: '24/7', label: 'Support' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                    whileHover={{ scale: 1.05 }}
                    className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-800/60' : 'bg-indigo-50'}`}
                  >
                    <h4 className={`font-bold text-2xl ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`}>{stat.value}</h4>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS */}
      <section className={`py-12 border-y ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-100'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50">
            {['Binance', 'Coinbase', 'MetaTrader', 'TradingView', 'Interactive'].map((name, index) => (
              <motion.div 
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 0.5, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
                className="text-2xl font-bold"
              >
                {name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              <StatBadge value="10+" label="Years Experience" isDarkMode={isDarkMode} index={0} />
              <StatBadge value="25K+" label="Satisfied Customers" isDarkMode={isDarkMode} index={1} />
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-extrabold mb-6">
                We Have 10+ Years of Experience in Professional Trading Services
              </h2>
              <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                A platform that allows novice traders to copy/mirror professional traders' positions. We create all of the materials to assist you in growing and progressing to the next level.
              </p>
              <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                We're delighted you came across Our Company. Don't pass up this chance to hear about what we do and the incredible team that makes it all possible!
              </p>
              <motion.a 
                href="/about"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-block px-6 py-3 rounded-full font-bold transition-colors ${
                  isDarkMode
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                }`}
              >
                Learn More
              </motion.a>
            </motion.div>

          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-20 px-6 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop')"
            }}
          />
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900/40' : 'bg-indigo-50/50'}`} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4">Services We Offer</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              We offer world class services - Check out some of our services below
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: "Copy Trading", description: "Copy trading allows you to directly copy the positions taken by another trader. You simply copy everything." },
              { icon: TrendingUp, title: "Financial Advisory", description: "We offer financial advice leading to smart trading by automating processes and improving decision-making." },
              { icon: Globe, title: "Forex Trading", description: "Foreign Exchange Market, a global decentralized market for the trading of currencies." },
              { icon: Zap, title: "Index Trading", description: "The ROI rates as high as up to 41%. Indices contains about 0.24%, thus is rated as a sweet spot." },
              { icon: TrendingUp, title: "ETF Stocks", description: "Buy stocks, commodities, bonds, and other securities and place them where they will grow." },
              { icon: Globe, title: "CFDs", description: "Trade directly on CFDs without stress. You don't need a digital wallet or an account with an exchange." }
            ].map((service, index) => (
              <ServiceCard key={service.title} {...service} isDarkMode={isDarkMode} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* INVESTMENT PLANS */}
      <section id="plans" className="py-20 px-6 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=2940&auto=format&fit=crop')"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4">Our Plans</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              Explore our plans to suit your financial budget
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Starter", roi: "30%", range: "$1,000 - $5,000", features: ['30% ROI', '24/7 Expert Support', 'Copy Trading', '10% Referral Earnings'] },
              { name: "Silver", roi: "45%", range: "$5,000 - $50,000", features: ['45% ROI', '24/7 Expert Support', 'Copy Trading', '15% Referral Earnings'] },
              { name: "Gold", roi: "60%", range: "$50,000 - $100,000", features: ['60% ROI', '24/7 Expert Support', 'Copy Trading', '20% Referral Earnings'], popular: true },
              { name: "Platinum", roi: "80%", range: "$100,000+", features: ['80% ROI', '24/7 Expert Support', 'Copy Trading', '30% Referral Earnings'] }
            ].map((plan, index) => (
              <PlanCard key={plan.name} {...plan} isDarkMode={isDarkMode} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* COMMITMENT SECTION */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1642790106117-e829e14a795f?q=80&w=2940&auto=format&fit=crop')"
            }}
          />
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900/40' : 'bg-indigo-50/50'}`} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-extrabold mb-6">
                Earn Up to <span className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}>80% Return</span> on Investment
              </h2>
              <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                The professionalism of the team and experience have allowed us to create a technological and reliable tool for investors!
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'Building a Better Trading Future',
                  'Provide a Trading Experience',
                  'The Experts Behind Your Success',
                  'Empowering Traders Worldwide'
                ].map((item, index) => (
                  <motion.div 
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className={`flex-shrink-0 mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} size={20} />
                    <span>{item}</span>
                  </motion.div>
                ))}
              </div>

              <motion.a 
                href="/signup"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-block px-6 py-3 rounded-full font-bold transition-colors ${
                  isDarkMode
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                }`}
              >
                Dive In
              </motion.a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`p-8 rounded-2xl border ${
                isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
              }`}
            >
              <div className={`aspect-square rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-gradient-to-br from-emerald-400/20 to-blue-500/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
              }`}>
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <TrendingUp className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={120} />
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4">Why Choose Us?</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              Here are a few reasons why you should choose SecureTrading
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: "Real-time Data", description: "Transact Crypto, Forex, ETF's and other investments anywhere at anytime." },
              { icon: Users, title: "24/7 Online Support", description: "Our team of professionals and Investment experts are always here to support you." },
              { icon: Shield, title: "Higher Security", description: "Protection against third party attacks and full data encryption." },
              { icon: Zap, title: "Multiple Deposit Options", description: "You can deposit from any crypto wallet and your crypto assets will be stored securely." },
              { icon: TrendingUp, title: "Instant Withdrawal", description: "Withdrawals are processed instantly after confirmation." },
              { icon: CheckCircle, title: "Transparency", description: "Performance statistics, including Requote, Slippage and Order Execution." }
            ].map((feature, index) => (
              <FeatureCard key={feature.title} {...feature} isDarkMode={isDarkMode} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2940&auto=format&fit=crop')"
            }}
          />
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900/40' : 'bg-indigo-50/50'}`} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4">What Our Customers Say</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { quote: "I was new to trading and didn't know where to start. Copy trading allowed me to follow experienced traders and grow my portfolio effortlessly. In just three months, I've seen consistent profits!", name: "John D. Bryan", role: "Customer" },
              { quote: "I've always wanted to trade, but I never had the time or knowledge. Copy trading made it so easy! Now I'm earning profits by following top traders while focusing on my daily job.", name: "Murillo Fred", role: "Customer" },
              { quote: "I was skeptical at first, but after carefully selecting top traders, I've been able to grow my investments steadily. The transparency and control over my funds make this a game-changer!", name: "Emily R.", role: "Customer" },
              { quote: "What I love about copy trading is the ability to diversify. I follow multiple traders with different strategies, which helps balance my portfolio. Highly recommended!", name: "Mike Benard", role: "Customer" },
              { quote: "I used to spend hours analyzing the markets, but with copy trading, I let the experts do the work. My returns have been solid, and I've learned so much just by observing the pros.", name: "Memphis Daniel", role: "Customer" },
              { quote: "I love how copy trading lets me learn from experienced traders while making money. Watching their strategies has helped me improve my own trading skills!", name: "Samantha K.", role: "Customer" }
            ].map((testimonial, index) => (
              <TestimonialCard key={testimonial.name} {...testimonial} isDarkMode={isDarkMode} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4">Most Common FAQ</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              { question: "What is Copy Trading?", answer: "As the name implies, it is 'Copying Trades' from an experienced trader. You simply select a trader and copy whatever trades they place." },
              { question: "How do I make a deposit?", answer: "To deposit funds in your SecureTrading account, you may choose any of the available methods of payment in your country. Log in to your account, click on 'Deposit', enter the amount you wish to deposit, select the method of payment from the dropdown menu, and copy wallet address if crypto deposit is selected." },
              { question: "What is Copy Stop Loss?", answer: "Copy Stop Loss (CSL) is an instruction to close a copy if the value of the entire copy drops below a specific dollar amount or ratio. You can use this to protect your investment - to automatically sell the copy investment if its value goes down. CSL is mandatory on every copy. You can set the CSL anywhere between 5% and 95%." },
              { question: "What level of support do you offer?", answer: "We are available 24/7 to offer support if you encounter any issues while using this platform." },
              { question: "How do I withdraw my profits?", answer: "It is very easy to place withdrawals. Simply login to your account and click 'Withdrawal'. Next enter the withdrawal amount and your desired withdrawal method. Select an account to withdraw from and click proceed." },
              { question: "Is it safe to share my info here?", answer: "Our services are done in confidentiality, we do not share any of our user data. Kindly see our privacy policy for more clarification." },
              { question: "How long are withdrawals processed?", answer: "Payments occur in Instant mode (Instantly) or within 24 hours." },
              { question: "Do you offer referrals?", answer: "Yes, we have a referral program. Check your user dashboard to see your unique referral link." }
            ].map((faq, index) => (
              <FAQItem key={index} {...faq} isDarkMode={isDarkMode} />
            ))}
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