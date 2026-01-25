'use client'
import { useState, useEffect } from 'react'
import { Moon, Sun, Shield, Target, Users, TrendingUp, Award, Globe, CheckCircle, Zap } from 'lucide-react'
import Header from '@/components/Header'

function StatCard({ value, label, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl border text-center ${
      isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      <h3 className={`text-4xl font-extrabold mb-2 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`}>
        {value}
      </h3>
      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{label}</p>
    </div>
  )
}

function ValueCard({ icon: Icon, title, description, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl border ${
      isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
        isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'
      }`}>
        <Icon className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={24} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{description}</p>
    </div>
  )
}

function TeamMember({ name, role, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl border text-center ${
      isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white ${
        isDarkMode ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'
      }`}>
        {name.charAt(0)}
      </div>
      <h3 className="font-bold text-lg mb-1">{name}</h3>
      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{role}</p>
    </div>
  )
}

function Timeline({ year, title, description, isDarkMode }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
          isDarkMode ? 'bg-emerald-400 text-black' : 'bg-indigo-600 text-white'
        }`}>
          {year}
        </div>
        <div className={`w-0.5 flex-1 mt-2 ${isDarkMode ? 'bg-slate-700' : 'bg-indigo-200'}`}></div>
      </div>
      <div className="pb-8">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>{description}</p>
      </div>
    </div>
  )
}

export default function AboutPage() {
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
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            About <span className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}>SecureTrading</span>
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            We're on a mission to democratize trading and make financial markets accessible to everyone, 
            regardless of their experience level or background.
          </p>
        </div>
      </section>

      {/* STATISTICS SECTION */}
      <section className={`py-16 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value="10+" label="Years of Experience" isDarkMode={isDarkMode} />
            <StatCard value="50K+" label="Active Traders" isDarkMode={isDarkMode} />
            <StatCard value="$2.4B+" label="Trading Volume" isDarkMode={isDarkMode} />
            <StatCard value="150+" label="Countries Served" isDarkMode={isDarkMode} />
          </div>
        </div>
      </section>

      {/* OUR STORY SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold mb-6">Our Story</h2>
              <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Founded in 2015, SecureTrading was born from a simple vision: to create a trading platform 
                that combines cutting-edge technology with user-friendly design, making professional trading 
                accessible to everyone.
              </p>
              <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Our founders, experienced traders and technology experts, recognized the gap in the market 
                for a platform that truly prioritizes user success. They set out to build not just another 
                trading platform, but a comprehensive ecosystem that educates, empowers, and supports traders 
                at every level.
              </p>
              <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                Today, we serve over 50,000 traders worldwide, processing billions in trading volume annually, 
                and we're just getting started.
              </p>
            </div>

            <div className={`p-8 rounded-2xl border ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-200 shadow-lg'
            }`}>
              <div className={`aspect-square rounded-xl flex items-center justify-center ${
                isDarkMode ? 'bg-gradient-to-br from-emerald-400/20 to-blue-500/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
              }`}>
                <TrendingUp className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={120} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-indigo-50/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className={`p-8 rounded-2xl border ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <Target className={`mb-4 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} size={40} />
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                To empower individuals worldwide with the tools, knowledge, and confidence to achieve 
                financial independence through intelligent trading and investment strategies.
              </p>
            </div>

            <div className={`p-8 rounded-2xl border ${
              isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
            }`}>
              <Globe className={`mb-4 ${isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}`} size={40} />
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                To become the world's most trusted and innovative trading platform, where technology 
                meets human expertise to create unprecedented opportunities for wealth creation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Our Core Values</h2>
            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              These principles guide everything we do and shape how we serve our community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ValueCard 
              icon={Shield}
              title="Security First"
              description="Your funds and data are protected by bank-grade encryption and multi-layer security protocols."
              isDarkMode={isDarkMode}
            />
            <ValueCard 
              icon={Users}
              title="User-Centric"
              description="Every feature we build is designed with our traders in mind, ensuring the best possible experience."
              isDarkMode={isDarkMode}
            />
            <ValueCard 
              icon={CheckCircle}
              title="Transparency"
              description="We believe in complete transparency in our operations, fees, and trading conditions."
              isDarkMode={isDarkMode}
            />
            <ValueCard 
              icon={Zap}
              title="Innovation"
              description="We continuously invest in cutting-edge technology to stay ahead of market trends."
              isDarkMode={isDarkMode}
            />
            <ValueCard 
              icon={Award}
              title="Excellence"
              description="We strive for excellence in everything we do, from platform performance to customer support."
              isDarkMode={isDarkMode}
            />
            <ValueCard 
              icon={Globe}
              title="Accessibility"
              description="We make professional-grade trading tools accessible to traders of all levels worldwide."
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-indigo-50/50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Our Journey</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              Key milestones in our growth story
            </p>
          </div>

          <div>
            <Timeline 
              year="2015"
              title="The Beginning"
              description="SecureTrading was founded with a vision to revolutionize online trading."
              isDarkMode={isDarkMode}
            />
            <Timeline 
              year="2017"
              title="Global Expansion"
              description="Expanded operations to 50+ countries, serving over 10,000 traders worldwide."
              isDarkMode={isDarkMode}
            />
            <Timeline 
              year="2019"
              title="Copy Trading Launch"
              description="Introduced our revolutionary copy trading feature, allowing beginners to follow experts."
              isDarkMode={isDarkMode}
            />
            <Timeline 
              year="2021"
              title="Mobile Innovation"
              description="Launched our award-winning mobile app, bringing trading to your fingertips."
              isDarkMode={isDarkMode}
            />
            <Timeline 
              year="2023"
              title="AI Integration"
              description="Integrated AI-powered analytics and insights to help traders make smarter decisions."
              isDarkMode={isDarkMode}
            />
            <Timeline 
              year="2026"
              title="Industry Leader"
              description="Reached 50,000+ active traders with $2.4B+ in annual trading volume."
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Meet Our Leadership</h2>
            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Our experienced team of trading experts and technology innovators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TeamMember 
              name="Michael Chen"
              role="CEO & Co-Founder"
              isDarkMode={isDarkMode}
            />
            <TeamMember 
              name="Sarah Johnson"
              role="CTO & Co-Founder"
              isDarkMode={isDarkMode}
            />
            <TeamMember 
              name="David Martinez"
              role="Chief Trading Officer"
              isDarkMode={isDarkMode}
            />
            <TeamMember 
              name="Emily Thompson"
              role="Head of Security"
              isDarkMode={isDarkMode}
            />
            <TeamMember 
              name="James Anderson"
              role="Head of Operations"
              isDarkMode={isDarkMode}
            />
            <TeamMember 
              name="Lisa Wang"
              role="Head of Customer Success"
              isDarkMode={isDarkMode}
            />
            <TeamMember 
              name="Robert Brown"
              role="Chief Compliance Officer"
              isDarkMode={isDarkMode}
            />
            <TeamMember 
              name="Anna Rodriguez"
              role="Head of Marketing"
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Ready to Start Your Trading Journey?
          </h2>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Join thousands of traders who trust SecureTrading for their financial success
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
              Create Free Account
            </a>
            <a 
              href="/contact" 
              className={`px-8 py-4 border rounded-full font-bold transition-colors ${
                isDarkMode
                  ? 'border-slate-700 hover:border-emerald-500'
                  : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Contact Us
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