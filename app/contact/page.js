'use client'
import { useState, useEffect } from 'react'
import { Moon, Sun, Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle, Globe, HeadphonesIcon } from 'lucide-react'
import Header from '@/components/Header'

function ContactCard({ icon: Icon, title, content, link, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl border ${
      isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
        isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'
      }`}>
        <Icon className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={24} />
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      {link ? (
        <a 
          href={link} 
          className={`text-sm hover:underline ${isDarkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-gray-600 hover:text-indigo-600'}`}
        >
          {content}
        </a>
      ) : (
        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{content}</p>
      )}
    </div>
  )
}

function SupportOption({ icon: Icon, title, description, isDarkMode }) {
  return (
    <div className={`p-6 rounded-xl border text-center ${
      isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
    }`}>
      <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
        isDarkMode ? 'bg-emerald-400/10' : 'bg-indigo-50'
      }`}>
        <Icon className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={32} />
      </div>
      <h3 className="font-bold text-xl mb-2">{title}</h3>
      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{description}</p>
    </div>
  )
}

export default function ContactPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setLoading(false)
    setSuccess(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
    
    // Reset success message after 5 seconds
    setTimeout(() => setSuccess(false), 5000)
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
            Get in <span className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'}>Touch</span>
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* CONTACT INFO CARDS */}
      <section className={`py-16 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ContactCard 
              icon={Mail}
              title="Email Us"
              content="support@securetrading.com"
              link="mailto:support@securetrading.com"
              isDarkMode={isDarkMode}
            />
            <ContactCard 
              icon={Phone}
              title="Call Us"
              content="+1 (555) 123-4567"
              link="tel:+15551234567"
              isDarkMode={isDarkMode}
            />
            <ContactCard 
              icon={MapPin}
              title="Visit Us"
              content="123 Trading Street, Financial District, NY 10004"
              isDarkMode={isDarkMode}
            />
            <ContactCard 
              icon={Clock}
              title="Working Hours"
              content="24/7 Support Available"
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* CONTACT FORM & MAP */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-extrabold mb-6">Send Us a Message</h2>
              <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Fill out the form below and our team will get back to you within 24 hours.
              </p>

              {success && (
                <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
                  isDarkMode ? 'bg-emerald-400/10 border border-emerald-400/20' : 'bg-green-50 border border-green-200'
                }`}>
                  <CheckCircle className={isDarkMode ? 'text-emerald-400' : 'text-green-600'} size={20} />
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-green-800'}`}>
                      Message sent successfully!
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-emerald-400/80' : 'text-green-700'}`}>
                      We'll get back to you shortly.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                        : 'bg-white border border-indigo-200 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-400'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                        : 'bg-white border border-indigo-200 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-400'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      isDarkMode
                        ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white'
                        : 'bg-white border border-indigo-200 focus:ring-indigo-500 text-gray-900'
                    }`}
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="account">Account Issues</option>
                    <option value="trading">Trading Questions</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
                      isDarkMode
                        ? 'bg-slate-800/50 border border-slate-700 focus:ring-emerald-500 text-white placeholder:text-slate-500'
                        : 'bg-white border border-indigo-200 focus:ring-indigo-500 text-gray-900 placeholder:text-gray-400'
                    }`}
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    isDarkMode
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map / Additional Info */}
            <div>
              <h2 className="text-3xl font-extrabold mb-6">Our Location</h2>
              <p className={`mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Visit our headquarters or reach out to any of our regional offices worldwide.
              </p>

              {/* Map Placeholder */}
              <div className={`rounded-2xl overflow-hidden border mb-8 ${
                isDarkMode ? 'border-slate-800' : 'border-indigo-200'
              }`}>
                <div className={`aspect-video flex items-center justify-center ${
                  isDarkMode ? 'bg-slate-900/60' : 'bg-indigo-50'
                }`}>
                  <MapPin className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={64} />
                </div>
              </div>

              {/* Office Info */}
              <div className={`p-6 rounded-xl border ${
                isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
              }`}>
                <h3 className="font-bold text-xl mb-4">Headquarters</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={20} />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        123 Trading Street, Financial District<br />
                        New York, NY 10004, USA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={20} />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        +1 (555) 123-4567
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={20} />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        support@securetrading.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className={isDarkMode ? 'text-emerald-400' : 'text-indigo-600'} size={20} />
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                        24/7 Online Support Available
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SUPPORT OPTIONS */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-indigo-50/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Other Ways to Reach Us</h2>
            <p className={`max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Choose the support channel that works best for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <SupportOption 
              icon={MessageSquare}
              title="Live Chat"
              description="Chat with our support team in real-time. Average response time: 2 minutes."
              isDarkMode={isDarkMode}
            />
            <SupportOption 
              icon={HeadphonesIcon}
              title="Phone Support"
              description="Speak directly with our experts. Available 24/7 in multiple languages."
              isDarkMode={isDarkMode}
            />
            <SupportOption 
              icon={Globe}
              title="Help Center"
              description="Browse our comprehensive knowledge base with guides and FAQs."
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">Frequently Asked Questions</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What are your customer support hours?",
                a: "Our customer support team is available 24/7 via live chat and email. Phone support is available Monday-Friday, 9 AM - 6 PM EST."
              },
              {
                q: "How quickly will I receive a response?",
                a: "Live chat responses typically take 2-5 minutes. Email inquiries are usually answered within 24 hours. Phone support provides immediate assistance."
              },
              {
                q: "Do you offer support in multiple languages?",
                a: "Yes! We provide support in English, Spanish, French, German, Chinese, Japanese, and Arabic."
              },
              {
                q: "Can I schedule a call with your team?",
                a: "Absolutely! You can schedule a call through your account dashboard or by contacting our support team directly."
              },
              {
                q: "Is there a support fee?",
                a: "No, all customer support is completely free for all account holders."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-indigo-200 shadow-sm'
                }`}
              >
                <h3 className="font-bold text-lg mb-3">{faq.q}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-6">
            Ready to Start Trading?
          </h2>
          <p className={`text-lg mb-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Create your free account today and join thousands of successful traders
          </p>
          <a 
            href="/signup" 
            className={`inline-block px-8 py-4 rounded-full font-bold transition-colors ${
              isDarkMode
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
            }`}
          >
            Create Free Account
          </a>
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