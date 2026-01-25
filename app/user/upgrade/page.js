'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, Crown, Star, Zap, TrendingUp, 
  Shield, Headphones, Users, ArrowRight, Check, X
} from 'lucide-react'

export default function UpgradePlanPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      icon: <Star className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/30',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      minAmount: '$500',
      maxAmount: '$5,000',
      features: [
        { text: 'Max 3 Active Trades', included: true },
        { text: '0.25% Trading Fee', included: true },
        { text: 'Copy Trading Access', included: true },
        { text: 'Standard Support', included: true },
        { text: 'Basic Market Data', included: true },
        { text: 'Priority Support', included: false },
        { text: 'Advanced Analytics', included: false },
        { text: 'Dedicated Account Manager', included: false }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/30',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      popular: true,
      minAmount: '$5,000',
      maxAmount: '$50,000',
      features: [
        { text: 'Max 5 Active Trades', included: true },
        { text: '0.45% Trading Fee', included: true },
        { text: 'Copy Trading Access', included: true },
        { text: 'Priority Support', included: true },
        { text: 'Advanced Market Data', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: 'Trading Signals', included: true },
        { text: 'Dedicated Account Manager', included: false }
      ]
    },
    {
      id: 'vip',
      name: 'VIP',
      icon: <Crown className="w-8 h-8" />,
      color: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-500/30',
      bgColor: 'from-amber-500/10 to-orange-500/10',
      minAmount: '$50,000',
      maxAmount: 'Above',
      features: [
        { text: 'Max 7 Active Trades', included: true },
        { text: '0.65% Trading Fee', included: true },
        { text: 'Copy Trading Access', included: true },
        { text: '24/7 Dedicated Support', included: true },
        { text: 'Premium Market Data', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: 'Trading Signals & Insights', included: true },
        { text: 'Dedicated Account Manager', included: true }
      ]
    }
  ]

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
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

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeClick = (plan) => {
    setSelectedPlan(plan)
    setShowConfirmModal(true)
  }

  const confirmUpgrade = async () => {
    try {
      setUpgrading(true)

      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan: selectedPlan.id,
          plan_updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({ ...profile, plan: selectedPlan.id })
      setShowConfirmModal(false)
      setShowSuccess(true)
      
      setTimeout(() => setShowSuccess(false), 3000)

    } catch (error) {
      console.error('Error upgrading plan:', error)
      alert('Failed to upgrade plan. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  const currentPlan = profile?.plan || 'basic'

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in">
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Plan Updated!</p>
            <p className="text-sm opacity-90">You're now on the {selectedPlan?.name} plan</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3">Upgrade Your Plan</h1>
        <p className="text-slate-400 text-lg">
          Choose the perfect plan to match your trading goals and unlock powerful features
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 border border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-sm text-slate-400">Current Plan</p>
              <p className="font-bold text-lg capitalize">{currentPlan}</p>
            </div>
          </div>
          <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold border border-emerald-500/30">
            Active
          </span>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto mt-12">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id
          
          return (
            <div
              key={plan.id}
              className={`relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border transition-all ${
                plan.popular 
                  ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' 
                  : `border-slate-800/50 ${!isCurrentPlan && 'hover:border-slate-700'}`
              } ${isCurrentPlan && 'ring-2 ring-emerald-500/50'}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-bold">
                  MOST POPULAR
                </div>
              )}

              {/* Active Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4 px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  ACTIVE
                </div>
              )}

              {/* Plan Header */}
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                {plan.icon}
              </div>

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              
              {/* Amount Range */}
              <div className={`mb-4 p-3 rounded-lg bg-gradient-to-br ${plan.bgColor} border ${plan.borderColor}`}>
                <p className="text-xs text-slate-400 mb-1">Trading Amount Range</p>
                <p className="text-lg font-bold">
                  {plan.minAmount} - {plan.maxAmount}
                </p>
              </div>

              <p className="text-slate-400 text-sm mb-6">
                {plan.id === 'basic' && 'Perfect for getting started'}
                {plan.id === 'premium' && 'Best for active traders'}
                {plan.id === 'vip' && 'Ultimate trading experience'}
              </p>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-white' : 'text-slate-600'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {isCurrentPlan ? (
                <button
                  disabled
                  className="w-full py-3 bg-slate-800 rounded-lg font-semibold text-slate-500 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgradeClick(plan)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r ${plan.color} hover:shadow-lg`}
                >
                  Upgrade to {plan.name}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Features Comparison */}
      <div className="max-w-5xl mx-auto mt-12">
        <h2 className="text-2xl font-bold text-center mb-8">Why Upgrade?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800/50">
            <Users className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="font-bold text-lg mb-2">More Trading Capacity</h3>
            <p className="text-sm text-slate-400">
              Execute more trades simultaneously and maximize your trading opportunities
            </p>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800/50">
            <TrendingUp className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="font-bold text-lg mb-2">Better Fee Structure</h3>
            <p className="text-sm text-slate-400">
              Enjoy competitive trading fees that grow with your plan level
            </p>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800/50">
            <Headphones className="w-10 h-10 text-amber-400 mb-4" />
            <h3 className="font-bold text-lg mb-2">Premium Support</h3>
            <p className="text-sm text-slate-400">
              Get faster response times and dedicated assistance when you need it
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800/50">
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center mx-auto mb-4`}>
              {selectedPlan.icon}
            </div>

            <h3 className="text-2xl font-bold text-center mb-2">Upgrade to {selectedPlan.name}?</h3>
            <p className="text-slate-400 text-center mb-6">
              Your plan will be updated immediately and you'll get access to all {selectedPlan.name} features.
            </p>

            <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Current Plan</span>
                <span className="font-semibold capitalize">{currentPlan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">New Plan</span>
                <span className="font-semibold text-emerald-400">{selectedPlan.name}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={upgrading}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={upgrading}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 bg-gradient-to-r ${selectedPlan.color} flex items-center justify-center gap-2`}
              >
                {upgrading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Upgrading...
                  </>
                ) : (
                  'Confirm Upgrade'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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