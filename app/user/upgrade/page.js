"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Crown,
  Star,
  Zap,
  TrendingUp,
  Shield,
  Headphones,
  Users,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

export default function UpgradePlanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load theme preference and listen for changes
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }

    const handleStorageChange = (e) => {
      if (e.key === "theme") {
        setIsDarkMode(e.newValue === "dark");
      }
    };

    const handleThemeChange = () => {
      const savedTheme = localStorage.getItem("theme");
      setIsDarkMode(savedTheme === "dark");
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChange", handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChange", handleThemeChange);
    };
  }, []);

  const plans = [
    {
      id: "basic",
      name: "Basic",
      icon: <Star className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
      borderColor: "border-blue-500/30",
      bgColor: "from-blue-500/10 to-cyan-500/10",
      lightBorderColor: "border-blue-300",
      lightBgColor: "bg-blue-50",
      minAmount: "$500",
      maxAmount: "$5,000",
      features: [
        { text: "Max 3 Active Trades", included: true },
        { text: "0.25% Trading Fee", included: true },
        { text: "Copy Trading Access", included: true },
        { text: "Standard Support", included: true },
        { text: "Basic Market Data", included: true },
        { text: "Priority Support", included: false },
        { text: "Advanced Analytics", included: false },
        { text: "Dedicated Account Manager", included: false },
      ],
    },
    {
      id: "premium",
      name: "Premium",
      icon: <Zap className="w-8 h-8" />,
      color: "from-purple-500 to-pink-500",
      borderColor: "border-purple-500/30",
      bgColor: "from-purple-500/10 to-pink-500/10",
      lightBorderColor: "border-purple-300",
      lightBgColor: "bg-purple-50",
      popular: true,
      minAmount: "$5,000",
      maxAmount: "$50,000",
      features: [
        { text: "Max 5 Active Trades", included: true },
        { text: "0.45% Trading Fee", included: true },
        { text: "Copy Trading Access", included: true },
        { text: "Priority Support", included: true },
        { text: "Advanced Market Data", included: true },
        { text: "Advanced Analytics", included: true },
        { text: "Trading Signals", included: true },
        { text: "Dedicated Account Manager", included: false },
      ],
    },
    {
      id: "vip",
      name: "VIP",
      icon: <Crown className="w-8 h-8" />,
      color: "from-amber-500 to-orange-500",
      borderColor: "border-amber-500/30",
      bgColor: "from-amber-500/10 to-orange-500/10",
      lightBorderColor: "border-amber-300",
      lightBgColor: "bg-amber-50",
      minAmount: "$50,000",
      maxAmount: "Above",
      features: [
        { text: "Max 7 Active Trades", included: true },
        { text: "0.65% Trading Fee", included: true },
        { text: "Copy Trading Access", included: true },
        { text: "24/7 Dedicated Support", included: true },
        { text: "Premium Market Data", included: true },
        { text: "Advanced Analytics", included: true },
        { text: "Trading Signals & Insights", included: true },
        { text: "Dedicated Account Manager", included: true },
      ],
    },
  ];

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = (plan) => {
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const confirmUpgrade = async () => {
    try {
      setUpgrading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          plan: selectedPlan.id,
          plan_updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, plan: selectedPlan.id });
      setShowConfirmModal(false);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error upgrading plan:", error);
      alert("Failed to upgrade plan. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      >
        <div className="flex justify-center">
          <div className="relative">
            {/* Logo */}
            <div
              className={`w-20 h-20 rounded-lg flex items-center justify-center shadow-lg ${
                isDarkMode
                  ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                  : "bg-gradient-to-br from-blue-600 to-indigo-600"
              }`}
            >
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            {/* Spinning circle around logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-24 h-24 border-4 rounded-full animate-spin ${
                  isDarkMode
                    ? "border-emerald-500/20 border-t-emerald-500"
                    : "border-indigo-200 border-t-indigo-600"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = profile?.plan || "basic";

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${
            isDarkMode
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          }`}
        >
          <CheckCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">Plan Updated!</p>
            <p className="text-sm opacity-90">
              You're now on the {selectedPlan?.name} plan
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isDarkMode
              ? "bg-gradient-to-br from-emerald-500 to-teal-600"
              : "bg-gradient-to-br from-blue-600 to-indigo-600"
          }`}
        >
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <h1
          className={`text-4xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
        >
          Upgrade Your Plan
        </h1>
        <p
          className={`text-lg ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
        >
          Choose the perfect plan to match your trading goals and unlock
          powerful features
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="max-w-3xl mx-auto">
        <div
          className={`rounded-xl p-4 border flex items-center justify-between ${
            isDarkMode
              ? "bg-slate-900/50 backdrop-blur-sm border-slate-800/50"
              : "bg-white border-indigo-200 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3">
            <Shield
              className={`w-6 h-6 ${isDarkMode ? "text-emerald-400" : "text-indigo-600"}`}
            />
            <div>
              <p
                className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
              >
                Current Plan
              </p>
              <p
                className={`font-bold text-lg capitalize ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {currentPlan}
              </p>
            </div>
          </div>
          <span
            className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
              isDarkMode
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-emerald-50 text-emerald-700 border-emerald-300"
            }`}
          >
            Active
          </span>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto mt-12">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 border transition-all ${
                plan.popular
                  ? isDarkMode
                    ? "border-purple-500/50 shadow-lg shadow-purple-500/20 bg-slate-900/50 backdrop-blur-sm"
                    : "border-purple-300 shadow-lg shadow-purple-200/50 bg-white"
                  : isDarkMode
                    ? `bg-slate-900/50 backdrop-blur-sm border-slate-800/50 ${!isCurrentPlan && "hover:border-slate-700"}`
                    : `bg-white border-indigo-200 shadow-sm ${!isCurrentPlan && "hover:border-indigo-300 hover:shadow-lg"}`
              } ${isCurrentPlan && (isDarkMode ? "ring-2 ring-emerald-500/50" : "ring-2 ring-indigo-500")}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold ${
                    isDarkMode
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  }`}
                >
                  MOST POPULAR
                </div>
              )}

              {/* Active Badge */}
              {isCurrentPlan && (
                <div
                  className={`absolute -top-3 right-4 px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  }`}
                >
                  <CheckCircle className="w-3 h-3" />
                  ACTIVE
                </div>
              )}

              {/* Plan Header */}
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 text-white`}
              >
                {plan.icon}
              </div>

              <h3
                className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                {plan.name}
              </h3>

              {/* Amount Range */}
              <div
                className={`mb-4 p-3 rounded-lg border ${
                  isDarkMode
                    ? `bg-gradient-to-br ${plan.bgColor} ${plan.borderColor}`
                    : `${plan.lightBgColor} ${plan.lightBorderColor}`
                }`}
              >
                <p
                  className={`text-xs mb-1 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                >
                  Trading Amount Range
                </p>
                <p
                  className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {plan.minAmount} - {plan.maxAmount}
                </p>
              </div>

              <p
                className={`text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
              >
                {plan.id === "basic" && "Perfect for getting started"}
                {plan.id === "premium" && "Best for active traders"}
                {plan.id === "vip" && "Ultimate trading experience"}
              </p>

              {/* Features List */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          isDarkMode ? "text-emerald-400" : "text-emerald-600"
                        }`}
                      />
                    ) : (
                      <X
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          isDarkMode ? "text-slate-600" : "text-gray-300"
                        }`}
                      />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? isDarkMode
                            ? "text-white"
                            : "text-gray-900"
                          : isDarkMode
                            ? "text-slate-600"
                            : "text-gray-400"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {isCurrentPlan ? (
                <button
                  disabled
                  className={`w-full py-3 rounded-lg font-semibold cursor-not-allowed ${
                    isDarkMode
                      ? "bg-slate-800 text-slate-500"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgradeClick(plan)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-white bg-gradient-to-r ${plan.color} hover:shadow-lg`}
                >
                  Upgrade to {plan.name}
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="max-w-5xl mx-auto mt-12">
        <h2
          className={`text-2xl font-bold text-center mb-8 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Why Upgrade?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className={`rounded-xl p-6 border ${
              isDarkMode
                ? "bg-slate-900/30 border-slate-800/50"
                : "bg-white border-indigo-200 shadow-sm"
            }`}
          >
            <Users
              className={`w-10 h-10 mb-4 ${
                isDarkMode ? "text-blue-400" : "text-blue-600"
              }`}
            />
            <h3
              className={`font-bold text-lg mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              More Trading Capacity
            </h3>
            <p
              className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
            >
              Execute more trades simultaneously and maximize your trading
              opportunities
            </p>
          </div>

          <div
            className={`rounded-xl p-6 border ${
              isDarkMode
                ? "bg-slate-900/30 border-slate-800/50"
                : "bg-white border-indigo-200 shadow-sm"
            }`}
          >
            <TrendingUp
              className={`w-10 h-10 mb-4 ${
                isDarkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <h3
              className={`font-bold text-lg mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Better Fee Structure
            </h3>
            <p
              className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
            >
              Enjoy competitive trading fees that grow with your plan level
            </p>
          </div>

          <div
            className={`rounded-xl p-6 border ${
              isDarkMode
                ? "bg-slate-900/30 border-slate-800/50"
                : "bg-white border-indigo-200 shadow-sm"
            }`}
          >
            <Headphones
              className={`w-10 h-10 mb-4 ${
                isDarkMode ? "text-amber-400" : "text-amber-600"
              }`}
            />
            <h3
              className={`font-bold text-lg mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              Premium Support
            </h3>
            <p
              className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
            >
              Get faster response times and dedicated assistance when you need
              it
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-2xl max-w-md w-full p-6 border ${
              isDarkMode
                ? "bg-slate-900 border-slate-800/50"
                : "bg-white border-indigo-200"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center mx-auto mb-4 text-white`}
            >
              {selectedPlan.icon}
            </div>

            <h3
              className={`text-2xl font-bold text-center mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Upgrade to {selectedPlan.name}?
            </h3>
            <p
              className={`text-center mb-6 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
            >
              Your plan will be updated immediately and you'll get access to all{" "}
              {selectedPlan.name} features.
            </p>

            <div
              className={`rounded-lg p-4 mb-6 ${
                isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={isDarkMode ? "text-slate-400" : "text-gray-600"}
                >
                  Current Plan
                </span>
                <span
                  className={`font-semibold capitalize ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {currentPlan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className={isDarkMode ? "text-slate-400" : "text-gray-600"}
                >
                  New Plan
                </span>
                <span
                  className={`font-semibold ${
                    isDarkMode ? "text-emerald-400" : "text-indigo-600"
                  }`}
                >
                  {selectedPlan.name}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={upgrading}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  isDarkMode
                    ? "bg-slate-800 hover:bg-slate-700 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={upgrading}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 bg-gradient-to-r ${selectedPlan.color} flex items-center justify-center gap-2 text-white`}
              >
                {upgrading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Upgrading...
                  </>
                ) : (
                  "Confirm Upgrade"
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
  );
}