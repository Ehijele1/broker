"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export default function MyTrades() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    totalProfit: 0,
    totalLoss: 0,
  });

  // Load theme preference and listen for changes
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }

    // Listen for theme changes
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
      await fetchTrades(user.id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTrades(data || []);

      // Calculate stats
      const active = data.filter((t) => t.status === "active").length;
      const completed = data.filter((t) => t.status === "completed").length;
      const totalProfit = data
        .filter((t) => t.outcome === "profit")
        .reduce((sum, t) => sum + Number(t.profit_loss_amount || 0), 0);
      const totalLoss = data
        .filter((t) => t.outcome === "loss")
        .reduce((sum, t) => sum + Number(t.profit_loss_amount || 0), 0);

      setStats({
        active,
        completed,
        totalProfit,
        totalLoss: Math.abs(totalLoss),
      });
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    if (filterStatus === "all") return true;
    return trade.status === filterStatus;
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
      {/* Header */}
      <div>
        <h1
          className={`text-3xl font-bold mb-2 ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          My Trades
        </h1>
        <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
          View your trading history and performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Trades"
          value={stats.active}
          icon={<Clock />}
          color="yellow"
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={<CheckCircle />}
          color="blue"
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Total Profit"
          value={`${profile.currency} ${stats.totalProfit.toFixed(2)}`}
          icon={<TrendingUp />}
          color="green"
          isDarkMode={isDarkMode}
        />
        <StatCard
          label="Total Loss"
          value={`${profile.currency} ${stats.totalLoss.toFixed(2)}`}
          icon={<TrendingDown />}
          color="red"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Filter */}
      <div
        className={`rounded-2xl p-4 border ${
          isDarkMode
            ? "bg-slate-900/50 backdrop-blur-sm border-slate-800/50"
            : "bg-white border-indigo-200 shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              isDarkMode
                ? "bg-slate-800/50 border-slate-700 text-white focus:ring-emerald-500"
                : "bg-white border-indigo-200 text-gray-900 focus:ring-indigo-500"
            }`}
          >
            <option value="all">All Trades</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span
            className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
          >
            Showing {filteredTrades.length} of {trades.length} trades
          </span>
        </div>
      </div>

      {/* Trades List */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isDarkMode
            ? "bg-slate-900/50 backdrop-blur-sm border-slate-800/50"
            : "bg-white border-indigo-200 shadow-sm"
        }`}
      >
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12">
            <Activity
              className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? "text-slate-600" : "text-indigo-300"
              }`}
            />
            <p
              className={`text-lg ${isDarkMode ? "text-slate-400" : "text-gray-700"}`}
            >
              No trades found
            </p>
            <p
              className={`text-sm mt-1 ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
            >
              Your trades will appear here
            </p>
            <button
              onClick={() => router.push("/user/trade")}
              className={`mt-4 px-6 py-2 rounded-lg font-semibold transition-all ${
                isDarkMode
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
              }`}
            >
              Start Trading
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead
                className={isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"}
              >
                <tr>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    Asset
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    Type
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    Amount
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    Leverage
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    Entry Price
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    P/L
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-medium uppercase ${
                      isDarkMode ? "text-slate-400" : "text-gray-600"
                    }`}
                  >
                    Date
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${isDarkMode ? "divide-slate-800/50" : "divide-indigo-100"}`}
              >
                {filteredTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    className={
                      isDarkMode
                        ? "hover:bg-slate-800/30"
                        : "hover:bg-indigo-50/50"
                    }
                  >
                    <td className="px-6 py-4">
                      <div
                        className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {trade.asset}
                      </div>
                      <div
                        className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                      >
                        {trade.timeframe}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {trade.trade_type === "buy" ? (
                          <ArrowUpRight
                            className={`w-4 h-4 ${
                              isDarkMode ? "text-green-400" : "text-green-600"
                            }`}
                          />
                        ) : (
                          <ArrowDownLeft
                            className={`w-4 h-4 ${
                              isDarkMode ? "text-rose-400" : "text-rose-600"
                            }`}
                          />
                        )}
                        <span
                          className={`font-medium uppercase ${
                            trade.trade_type === "buy"
                              ? isDarkMode
                                ? "text-green-400"
                                : "text-green-600"
                              : isDarkMode
                                ? "text-rose-400"
                                : "text-rose-600"
                          }`}
                        >
                          {trade.trade_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {profile.currency} {Number(trade.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          isDarkMode
                            ? "bg-slate-800 text-white"
                            : "bg-indigo-100 text-indigo-700"
                        }`}
                      >
                        {trade.leverage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        ${Number(trade.entry_price).toFixed(2)}
                      </div>
                      {trade.exit_price && (
                        <div
                          className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                        >
                          Exit: ${Number(trade.exit_price).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {trade.outcome ? (
                        <div
                          className={`font-bold ${
                            trade.outcome === "profit"
                              ? isDarkMode
                                ? "text-green-400"
                                : "text-green-600"
                              : isDarkMode
                                ? "text-rose-400"
                                : "text-rose-600"
                          }`}
                        >
                          {trade.outcome === "profit" ? "+" : "-"}
                          {profile.currency}{" "}
                          {(
                            Number(trade.amount) +
                            Number(trade.profit_loss_amount || 0)
                          ).toFixed(2)}
                        </div>
                      ) : (
                        <span
                          className={`text-sm ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
                        >
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          trade.status === "active"
                            ? isDarkMode
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-300"
                            : trade.status === "completed"
                              ? isDarkMode
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-green-50 text-green-700 border border-green-300"
                              : isDarkMode
                                ? "bg-slate-700 text-slate-400"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {trade.status}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                    >
                      {new Date(trade.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, isDarkMode }) {
  const colorClasses = {
    yellow: isDarkMode
      ? "from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
      : "bg-white border-indigo-200 shadow-sm",
    blue: isDarkMode
      ? "from-blue-500/20 to-cyan-500/20 border-blue-500/30"
      : "bg-white border-indigo-200 shadow-sm",
    green: isDarkMode
      ? "from-green-500/20 to-emerald-500/20 border-green-500/30"
      : "bg-white border-indigo-200 shadow-sm",
    red: isDarkMode
      ? "from-red-500/20 to-rose-500/20 border-red-500/30"
      : "bg-white border-indigo-200 shadow-sm",
  };

  const iconColor = {
    yellow: isDarkMode ? "text-yellow-400" : "text-indigo-600",
    blue: isDarkMode ? "text-blue-400" : "text-indigo-600",
    green: isDarkMode ? "text-green-400" : "text-indigo-600",
    red: isDarkMode ? "text-rose-400" : "text-indigo-600",
  };

  const bgClass = isDarkMode ? "bg-gradient-to-br" : "";

  return (
    <div className={`${bgClass} ${colorClasses[color]} rounded-xl p-4 border`}>
      <div className="flex items-center justify-between mb-2">
        <p
          className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
        >
          {label}
        </p>
        <div
          className={`p-2 rounded-lg ${isDarkMode ? "bg-white/5" : "bg-indigo-50"}`}
        >
          <span className={iconColor[color]}>{icon}</span>
        </div>
      </div>
      <p
        className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
      >
        {value}
      </p>
    </div>
  );
}