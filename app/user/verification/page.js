'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, Shield, ArrowLeft, Mail, 
  Send, Clock, Award, AlertCircle
} from 'lucide-react'

export default function VerificationPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/signin')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendVerificationEmail = async () => {
    try {
      setSending(true)

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })

      if (error) throw error

      setEmailSent(true)
      alert('Verification email sent! Please check your inbox.')

    } catch (error) {
      console.error('Error sending verification email:', error)
      alert('Failed to send verification email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at !== null

  // Verified Email Screen
  if (isEmailVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/user/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold mb-3">You Are Verified! ✓</h1>
            <p className="text-slate-400 mb-6">
              Your email address has been successfully verified. You now have full access to all platform features.
            </p>

            <div className="bg-slate-900/50 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className="px-4 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold border border-emerald-500/30">
                  Verified
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Address</span>
                <span className="text-white font-medium">
                  {user.email}
                </span>
              </div>

              {user.email_confirmed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Verified On</span>
                  <span className="text-white font-medium">
                    {new Date(user.email_confirmed_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Name</span>
                <span className="text-white font-medium">
                  {profile?.full_name || 'User'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-slate-900/30 rounded-lg p-4">
                <Award className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Enhanced Security</p>
              </div>
              <div className="bg-slate-900/30 rounded-lg p-4">
                <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Full Access</p>
              </div>
              <div className="bg-slate-900/30 rounded-lg p-4">
                <CheckCircle className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Trusted Account</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/user/dashboard')}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg font-semibold transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Unverified Email Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/user/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800/50 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mb-6">
            <Mail className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">Verify Your Email</h1>
          <p className="text-slate-400 mb-2">
            Please verify your email address to unlock all features and secure your account.
          </p>
          <p className="text-sm text-slate-500 mb-8">
            We'll send a verification link to <strong className="text-white">{user?.email}</strong>
          </p>

          {emailSent && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                <Clock className="w-5 h-5" />
                <p className="font-semibold">Verification Email Sent!</p>
              </div>
              <p className="text-sm text-slate-400">
                Please check your inbox and spam folder. Click the verification link in the email to complete the process.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800/30 rounded-xl p-4">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-1 text-sm">Secure Access</h3>
              <p className="text-xs text-slate-400">
                Protect your account from unauthorized access
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-xl p-4">
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-1 text-sm">Full Features</h3>
              <p className="text-xs text-slate-400">
                Unlock all platform features and capabilities
              </p>
            </div>

            <div className="bg-slate-800/30 rounded-xl p-4">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="font-semibold mb-1 text-sm">Quick Process</h3>
              <p className="text-xs text-slate-400">
                Verification takes just a few clicks
              </p>
            </div>
          </div>

          <button
            onClick={handleSendVerificationEmail}
            disabled={sending}
            className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sending Email...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Verify Now
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 mt-4">
            Didn't receive the email? Check your spam folder or click "Verify Now" to resend.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              <strong className="text-white">Need help?</strong> Contact our support team if you're having trouble verifying your email.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}