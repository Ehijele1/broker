"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  Award,
  Target,
  Activity,
  DollarSign,
  CheckCircle,
  Star,
  ArrowUpRight,
  BarChart3,
  Clock,
  Shield,
  AlertCircle,
  Info,
  Copy,
  Search,
  X,
} from "lucide-react";

export default function CopyTraderPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [traders, setTraders] = useState([]);
  const [tradersLoading, setTradersLoading] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // Copy form state
  const [copyAmount, setCopyAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchTraders();
    }
  }, [profile]);

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

      setProfile(profileData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTraders = async () => {
    try {
      setTradersLoading(true);

      const { data, error } = await supabase
        .from("copy_traders")
        .select("*")
        .eq("is_active", true)
        .order("roi", { ascending: false });

      if (error) throw error;

      setTraders(data || []);
    } catch (error) {
      console.error("Error fetching traders:", error);
      setTraders([]);
    } finally {
      setTradersLoading(false);
    }
  };

  const handleCopyTrader = async () => {
    if (!copyAmount || !selectedTrader) {
      alert("Please enter copy amount");
      return;
    }

    const amount = parseFloat(copyAmount);

    if (amount < selectedTrader.min_copy_amount) {
      alert(
        `Minimum copy amount is ${profile.currency} ${selectedTrader.min_copy_amount}`,
      );
      return;
    }

    if (amount > parseFloat(profile.balance)) {
      alert("Insufficient balance");
      return;
    }

    try {
      setSubmitting(true);

      // Create copy trade record
      const { data, error } = await supabase
        .from("user_copy_trades")
        .insert([
          {
            user_id: profile.id,
            trader_id: selectedTrader.id,
            copy_amount: amount,
            status: "active",
            currency: profile.currency,
          },
        ])
        .select();

      if (error) throw error;

      // Show success
      setShowSuccess(true);
      setShowCopyModal(false);
      setCopyAmount("");
      setSelectedTrader(null);

      // Hide success after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

      // Refresh traders list
      fetchTraders();
    } catch (error) {
      console.error("Error copying trader:", error);
      alert("Failed to copy trader. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter traders by name only
  const filteredTraders = traders.filter((trader) => {
    if (
      searchQuery &&
      !trader.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

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
            <p className="font-bold">Trader Copied Successfully!</p>
            <p className="text-sm opacity-90">
              You're now copying this trader's trades
            </p>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && selectedTrader && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`rounded-2xl p-6 max-w-md w-full border shadow-2xl ${
              isDarkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-indigo-200"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                Copy {selectedTrader.name}
              </h3>
              <button
                onClick={() => {
                  setShowCopyModal(false);
                  setSelectedTrader(null);
                  setCopyAmount("");
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? "hover:bg-slate-800" : "hover:bg-indigo-50"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Trader Info */}
              <div
                className={`rounded-xl p-4 ${
                  isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={
                      selectedTrader.avatar ||
                      `https://ui-avatars.com/api/?name=${selectedTrader.name}&background=random`
                    }
                    alt={selectedTrader.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h4
                      className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {selectedTrader.name}
                    </h4>
                    <p
                      className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                    >
                      ROI: {selectedTrader.roi}%
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <p
                      className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                    >
                      Win Rate
                    </p>
                    <p
                      className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {selectedTrader.win_rate}%
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                    >
                      Followers
                    </p>
                    <p
                      className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {selectedTrader.followers}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                    >
                      Risk
                    </p>
                    <p
                      className={`font-semibold capitalize ${
                        selectedTrader.risk_level === "low"
                          ? isDarkMode
                            ? "text-emerald-400"
                            : "text-emerald-600"
                          : selectedTrader.risk_level === "medium"
                            ? isDarkMode
                              ? "text-amber-400"
                              : "text-amber-600"
                            : isDarkMode
                              ? "text-rose-400"
                              : "text-rose-600"
                      }`}
                    >
                      {selectedTrader.risk_level}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Copy Amount ({profile.currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={copyAmount}
                    onChange={(e) => setCopyAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={selectedTrader.min_copy_amount}
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      isDarkMode
                        ? "bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500"
                        : "bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500"
                    }`}
                  />
                  <span
                    className={`absolute right-4 top-1/2 -translate-y-1/2 font-semibold ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    {profile.currency}
                  </span>
                </div>
                <p
                  className={`text-xs mt-2 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                >
                  Min: {profile.currency} {selectedTrader.min_copy_amount} •
                  Available: {profile.currency}{" "}
                  {Number(profile.balance).toFixed(2)}
                </p>
              </div>

              {/* Info Box */}
              <div
                className={`rounded-lg p-4 border ${
                  isDarkMode
                    ? "bg-blue-500/10 border-blue-500/30"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Info
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  />
                  <div
                    className={`text-sm ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
                  >
                    <p className="mb-2">By copying this trader:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Your trades will mirror theirs automatically</li>
                      <li>• You can stop copying anytime</li>
                      <li>
                        • Past performance doesn't guarantee future results
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCopyModal(false);
                    setSelectedTrader(null);
                    setCopyAmount("");
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    isDarkMode
                      ? "bg-slate-800 hover:bg-slate-700"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyTrader}
                  disabled={submitting}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed ${
                    isDarkMode
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 text-white"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white"
                  }`}
                >
                  {submitting ? "Processing..." : "Start Copying"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className={`text-3xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            Copy Trading
          </h1>
          <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
            Copy successful traders and earn automatically
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl px-6 py-3 border ${
              isDarkMode
                ? "bg-slate-900/50 backdrop-blur-sm border-slate-800/50"
                : "bg-white border-indigo-200 shadow-sm"
            }`}
          >
            <p
              className={`text-xs mb-1 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
            >
              Available Balance
            </p>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? "text-emerald-400" : "text-indigo-600"
              }`}
            >
              {profile.currency} {Number(profile.balance).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div
        className={`rounded-2xl p-6 border ${
          isDarkMode
            ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30"
            : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl ${
              isDarkMode ? "bg-blue-500/20" : "bg-blue-100"
            }`}
          >
            <Info
              className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
            />
          </div>
          <div>
            <h3
              className={`text-lg font-bold mb-2 ${
                isDarkMode ? "text-blue-400" : "text-blue-700"
              }`}
            >
              How Copy Trading Works
            </h3>
            <ul
              className={`space-y-2 text-sm ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}
            >
              <li className="flex items-start gap-2">
                <Users
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <span>
                  Choose a trader based on their performance and risk level
                </span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <span>Allocate funds to copy their trades automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <span>Your account mirrors their trades in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <span>You maintain full control and can stop anytime</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search */}
      <div
        className={`rounded-2xl p-4 border ${
          isDarkMode
            ? "bg-slate-900/50 backdrop-blur-sm border-slate-800/50"
            : "bg-white border-indigo-200 shadow-sm"
        }`}
      >
        <div className="relative">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? "text-slate-400" : "text-gray-400"
            }`}
          />
          <input
            type="text"
            placeholder="Search traders by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
              isDarkMode
                ? "bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500"
                : "bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                isDarkMode
                  ? "text-slate-400 hover:text-white"
                  : "text-gray-400 hover:text-gray-900"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Traders Grid */}
      {tradersLoading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className={`w-16 h-16 border-4 rounded-full animate-spin ${
              isDarkMode
                ? "border-emerald-500/20 border-t-emerald-500"
                : "border-indigo-200 border-t-indigo-600"
            }`}
          ></div>
        </div>
      ) : filteredTraders.length === 0 ? (
        <div
          className={`rounded-2xl p-12 border text-center ${
            isDarkMode
              ? "bg-slate-900/50 backdrop-blur-sm border-slate-800/50"
              : "bg-white border-indigo-200 shadow-sm"
          }`}
        >
          <Users
            className={`w-16 h-16 mx-auto mb-4 ${
              isDarkMode ? "text-slate-600" : "text-indigo-300"
            }`}
          />
          <h3
            className={`text-xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            No Traders Found
          </h3>
          <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
            {searchQuery
              ? "No traders match your search"
              : "No traders available at the moment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTraders.map((trader) => (
            <TraderCard
              key={trader.id}
              trader={trader}
              currency={profile.currency}
              onCopy={() => {
                setSelectedTrader(trader);
                setShowCopyModal(true);
              }}
              isDarkMode={isDarkMode}
            />
          ))}
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

// Trader Card Component
function TraderCard({ trader, currency, onCopy, isDarkMode }) {
  const isPositiveROI = trader.roi >= 0;
  const riskColor = {
    low: isDarkMode
      ? "text-emerald-400 bg-emerald-500/20"
      : "text-emerald-700 bg-emerald-50",
    medium: isDarkMode
      ? "text-amber-400 bg-amber-500/20"
      : "text-amber-700 bg-amber-50",
    high: isDarkMode
      ? "text-rose-400 bg-rose-500/20"
      : "text-rose-700 bg-rose-50",
  };

  return (
    <div
      className={`rounded-2xl p-6 border transition-all group ${
        isDarkMode
          ? "bg-slate-900/50 backdrop-blur-sm border-slate-800/50 hover:border-slate-700"
          : "bg-white border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-lg"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={
              trader.avatar ||
              `https://ui-avatars.com/api/?name=${trader.name}&background=random`
            }
            alt={trader.name}
            className={`w-14 h-14 rounded-full border-2 ${
              isDarkMode ? "border-slate-700" : "border-indigo-200"
            }`}
          />
          <div>
            <h3
              className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {trader.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {trader.verified && (
                <span
                  className={`flex items-center gap-1 text-xs ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
              <span
                className={`flex items-center gap-1 text-xs ${
                  isDarkMode ? "text-amber-400" : "text-amber-600"
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                {trader.rating || "5.0"}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${riskColor[trader.risk_level]}`}
        >
          {trader.risk_level}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className={`rounded-lg p-3 text-center ${
            isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
          }`}
        >
          <div
            className={`flex items-center justify-center gap-1 mb-1 ${
              isPositiveROI
                ? isDarkMode
                  ? "text-emerald-400"
                  : "text-emerald-600"
                : isDarkMode
                  ? "text-rose-400"
                  : "text-rose-600"
            }`}
          >
            {isPositiveROI ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingUp className="w-4 h-4 rotate-180" />
            )}
            <span className="text-xs font-medium">ROI</span>
          </div>
          <p
            className={`text-xl font-bold ${
              isPositiveROI
                ? isDarkMode
                  ? "text-emerald-400"
                  : "text-emerald-600"
                : isDarkMode
                  ? "text-rose-400"
                  : "text-rose-600"
            }`}
          >
            {isPositiveROI ? "+" : ""}
            {trader.roi}%
          </p>
        </div>
        <div
          className={`rounded-lg p-3 text-center ${
            isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
          }`}
        >
          <p
            className={`text-xs mb-1 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
          >
            Win Rate
          </p>
          <p
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {trader.win_rate}%
          </p>
        </div>
        <div
          className={`rounded-lg p-3 text-center ${
            isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
          }`}
        >
          <p
            className={`text-xs mb-1 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
          >
            Followers
          </p>
          <p
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {trader.followers}
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center justify-between">
          <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
            Total Trades
          </span>
          <span
            className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {trader.total_trades || 0}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
            Experience
          </span>
          <span
            className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {trader.experience || "N/A"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
            Min Copy
          </span>
          <span
            className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {currency} {trader.min_copy_amount}
          </span>
        </div>
      </div>

      {/* Description */}
      {trader.description && (
        <p
          className={`text-sm mb-4 line-clamp-2 ${
            isDarkMode ? "text-slate-400" : "text-gray-600"
          }`}
        >
          {trader.description}
        </p>
      )}

      {/* Copy Button */}
      <button
        onClick={onCopy}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all shadow-lg ${
          isDarkMode
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 group-hover:shadow-emerald-500/20 text-white"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl"
        }`}
      >
        <Copy className="w-5 h-5" />
        Copy Trader
      </button>
    </div>
  );
}