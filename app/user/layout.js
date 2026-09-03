"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import UserChat from "@/components/userchat";
import InactivityMonitor from "@/components/InactivityMonitor";
import {
  BarChart3,
  Activity,
  ChartCandlestick,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  History,
  Boxes,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  CalendarDays,
  Vault,
  UserRound,
  Moon,
  Sun,
  Globe,
} from "lucide-react";

export default function UserLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage) {
      setSelectedLanguage(savedLanguage);
    }
  }, []);

  // Add this useEffect after the one from Step 2
  useEffect(() => {
    // Read Google Translate cookie to sync selector
    const checkGoogleTranslateCookie = () => {
      const cookies = document.cookie.split(";");
      const googTransCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("googtrans="),
      );

      if (googTransCookie) {
        const value = googTransCookie.split("=")[1];
        // Cookie format is /en/es (from/to languages)
        const targetLang = value.split("/")[2];

        if (targetLang && targetLang !== selectedLanguage) {
          setSelectedLanguage(targetLang);
          localStorage.setItem("selectedLanguage", targetLang);
        }
      }
    };

    // Check on mount and after a short delay (Google Translate needs time to set cookie)
    setTimeout(checkGoogleTranslateCookie, 500);
  }, []);

  // Load theme preference and mount check
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    setIsDarkMode(savedTheme === "dark");
    setMounted(true);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    window.dispatchEvent(new Event("themeChange"));
  };

  useEffect(() => {
    checkUser();
  }, []);

  // Handle Google Translate bar appearance
  useEffect(() => {
    // Add styles to adjust layout when Google Translate bar appears
    const style = document.createElement("style");
    style.innerHTML = `
      /* Hide our hidden translate element */
      #google_translate_element_hidden {
        display: none !important;
      }
      
      /* HIDE the Google Translate banner completely */
      .goog-te-banner-frame.skiptranslate {
        display: none !important;
      }
      
      /* Remove the top margin that Google Translate adds to body */
      body {
        top: 0 !important;
      }
      
      /* Hide the Google Translate toolbar */
      .skiptranslate {
        display: none !important;
      }
      
      /* Hide the "Show original" button/tooltip */
      #goog-gt-tt, .goog-te-balloon-frame {
        display: none !important;
      }
      
      /* Additional: Hide any Google Translate gadget */
      .goog-te-gadget {
        display: none !important;
      }
      
      /* Ensure body doesn't get pushed down */
      body.translated-ltr {
        top: 0 !important;
        margin-top: 0 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);

  // Load Google Translate script
  useEffect(() => {
    const addScript = () => {
      if (document.querySelector('script[src*="translate.google.com"]')) return;

      window.googleTranslateElementInit = function () {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages:
              "en,es,fr,de,it,pt,ru,ja,ko,zh-CN,zh-TW,ar,hi,bn,pa,te,mr,ta,tr,vi,pl,uk,ro,nl,el,cs,sv,hu,fi,da,no",
            autoDisplay: false,
          },
          "google_translate_element_hidden",
        );
      };

      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    };

    setTimeout(addScript, 100);

    return () => {
      const scripts = document.querySelectorAll(
        'script[src*="translate.google.com"]',
      );
      scripts.forEach((script) => script.remove());
    };
  }, []);

  const changeLanguage = (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem("selectedLanguage", langCode); // ADD THIS LINE

    if (langCode === "en") {
      // Reset to original language
      const iframe = document.querySelector(".goog-te-menu-frame");
      if (iframe) {
        const innerDoc =
          iframe.contentDocument || iframe.contentWindow.document;
        const restoreEl = innerDoc.querySelector(
          '.goog-te-menu2-item span.text:contains("English")',
        );
        if (restoreEl) {
          restoreEl.click();
        }
      }

      // Alternative method - directly manipulate cookies
      document.cookie = "googtrans=/en/en; path=/";

      // Reload to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Set the Google Translate cookie directly
      document.cookie = `googtrans=/en/${langCode}; path=/`;

      // Trigger Google Translate
      setTimeout(() => {
        const selectElement = document.querySelector(".goog-te-combo");
        if (selectElement) {
          selectElement.value = langCode;
          selectElement.dispatchEvent(new Event("change"));
        } else {
          // If select element not found, reload to apply cookie
          window.location.reload();
        }
      }, 100);
    }
  };

  const languages = [
    { code: "en", name: "English", flag: "🇬🇧", code3: "ENG" },
    { code: "es", name: "Spanish", flag: "🇪🇸", code3: "ESP" },
    { code: "fr", name: "French", flag: "🇫🇷", code3: "FRA" },
    { code: "de", name: "German", flag: "🇩🇪", code3: "DEU" },
    { code: "it", name: "Italian", flag: "🇮🇹", code3: "ITA" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹", code3: "POR" },
    { code: "ru", name: "Russian", flag: "🇷🇺", code3: "RUS" },
    { code: "ja", name: "Japanese", flag: "🇯🇵", code3: "JPN" },
    { code: "ko", name: "Korean", flag: "🇰🇷", code3: "KOR" },
    { code: "zh-CN", name: "Chinese (S)", flag: "🇨🇳", code3: "ZHS" },
    { code: "zh-TW", name: "Chinese (T)", flag: "🇹🇼", code3: "ZHT" },
    { code: "ar", name: "Arabic", flag: "🇸🇦", code3: "ARA" },
    { code: "hi", name: "Hindi", flag: "🇮🇳", code3: "HIN" },
    { code: "bn", name: "Bengali", flag: "🇧🇩", code3: "BEN" },
    { code: "pa", name: "Punjabi", flag: "🇮🇳", code3: "PAN" },
    { code: "te", name: "Telugu", flag: "🇮🇳", code3: "TEL" },
    { code: "mr", name: "Marathi", flag: "🇮🇳", code3: "MAR" },
    { code: "ta", name: "Tamil", flag: "🇮🇳", code3: "TAM" },
    { code: "tr", name: "Turkish", flag: "🇹🇷", code3: "TUR" },
    { code: "vi", name: "Vietnamese", flag: "🇻🇳", code3: "VIE" },
    { code: "pl", name: "Polish", flag: "🇵🇱", code3: "POL" },
    { code: "uk", name: "Ukrainian", flag: "🇺🇦", code3: "UKR" },
    { code: "ro", name: "Romanian", flag: "🇷🇴", code3: "RON" },
    { code: "nl", name: "Dutch", flag: "🇳🇱", code3: "NLD" },
    { code: "el", name: "Greek", flag: "🇬🇷", code3: "ELL" },
    { code: "cs", name: "Czech", flag: "🇨🇿", code3: "CES" },
    { code: "sv", name: "Swedish", flag: "🇸🇪", code3: "SWE" },
    { code: "hu", name: "Hungarian", flag: "🇭🇺", code3: "HUN" },
    { code: "fi", name: "Finnish", flag: "🇫🇮", code3: "FIN" },
    { code: "da", name: "Danish", flag: "🇩🇰", code3: "DAN" },
    { code: "no", name: "Norwegian", flag: "🇳🇴", code3: "NOR" },
  ];

  const checkUser = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setLoading(false);
        return;
      }

      if (profileData.role === "admin") {
        router.push("/admin/dashboard");
        return;
      }

      setProfile(profileData);

      // Update session on load using your RPC function
      await supabase.rpc("update_user_session", {
        p_user_id: user.id,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update user session periodically using your RPC function
  useEffect(() => {
    if (!user) return;

    // Update every 2 minutes to keep user active
    const interval = setInterval(
      async () => {
        try {
          await supabase.rpc("update_user_session", {
            p_user_id: user.id,
          });
        } catch (error) {
          console.error("Error updating session:", error);
        }
      },
      2 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    // Mark user as offline before signing out
    if (user) {
      try {
        await supabase
          .from("active_sessions")
          .update({ is_online: false })
          .eq("user_id", user.id);
      } catch (error) {
        console.error("Error updating session on signout:", error);
      }
    }

    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (!mounted) {
    return null;
  }

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
              className={`w-48 h-48 rounded-2xl flex items-center justify-center shadow-2xl ${
                isDarkMode
                  ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                  : "bg-gradient-to-br from-blue-600 to-indigo-600"
              }`}
            >
              <svg
                className="w-32 h-32 text-white"
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
                className={`w-60 h-60 border-8 rounded-full animate-spin ${
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

  if (!user) {
    router.push("/signin");
    return null;
  }

  if (!profile) {
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
              className={`w-48 h-48 rounded-2xl flex items-center justify-center shadow-2xl ${
                isDarkMode
                  ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                  : "bg-gradient-to-br from-blue-600 to-indigo-600"
              }`}
            >
              <svg
                className="w-32 h-32 text-white"
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
                className={`w-60 h-60 border-8 rounded-full animate-spin ${
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
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white" : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900"}`}
    >
      {/* Hidden Google Translate Element */}
      <div
        id="google_translate_element_hidden"
        style={{ display: "none" }}
      ></div>

      {/* Inactivity Monitor - Logs out user after 1 hour of inactivity */}
      <InactivityMonitor userId={user?.id} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 backdrop-blur-xl border-r z-50 transform transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDarkMode
            ? "bg-slate-900/95 border-slate-800/50"
            : "bg-white border-indigo-200 shadow-xl"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={`p-6 border-b ${isDarkMode ? "border-slate-800/50" : "border-indigo-200"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg
                  className={`w-10 h-10 ${isDarkMode ? "text-white" : "text-indigo-600"}`}
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
                <div>
                  <h1
                    className={`text-lg font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    SecureProTrading
                  </h1>
                  <p
                    className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                  >
                    Premium Trading
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              <NavItem
                icon={BarChart3}
                label="Dashboard"
                href="/user/dashboard"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={Activity}
                label="Trade"
                href="/user/trade"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={ChartCandlestick}
                label="My Trades"
                href="/user/my-trades"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={Vault}
                label="Deposit"
                href="/user/deposit"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={UserRound}
                label="Copy Trader"
                href="/user/copy-trader"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={Boxes}
                label="Upgrade Plan"
                href="/user/upgrade"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={Wallet}
                label="Withdrawal"
                href="/user/withdrawal"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={CalendarDays}
                label="All Transactions"
                href="/user/transactions"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={ShieldCheck}
                label="Verification"
                href="/user/verification"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
              <NavItem
                icon={Settings}
                label="Settings"
                href="/user/settings"
                currentPath={pathname}
                isDarkMode={isDarkMode}
              />
            </div>
          </nav>

          {/* User Profile */}
          <div
            className={`p-4 border-t ${isDarkMode ? "border-slate-800/50" : "border-indigo-200"}`}
          >
            <div className="flex items-center gap-3 mb-3">
              {/* Profile Photo Button */}
              <button
                onClick={() => router.push("/user/settings")}
                className="group relative"
                title="Go to Settings"
              >
                {profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.full_name}
                    className={`w-10 h-10 rounded-full object-cover border-2 transition-colors ${
                      isDarkMode
                        ? "border-emerald-500/30 group-hover:border-emerald-500"
                        : "border-indigo-500/30 group-hover:border-indigo-500"
                    }`}
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                      isDarkMode
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 border-emerald-500/30 group-hover:border-emerald-500"
                        : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-indigo-500/30 group-hover:border-indigo-500"
                    }`}
                  >
                    {profile.full_name?.charAt(0) || "U"}
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {profile.full_name}
                </p>
                <p
                  className={`text-xs truncate ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                >
                  @{profile.username}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
                isDarkMode
                  ? "bg-slate-800/50 hover:bg-slate-800 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:shadow-indigo-200/50"
              }`}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-72 min-h-screen">
        {/* Top Bar */}
        <header
          className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
            isDarkMode
              ? "bg-slate-900/80 border-slate-800/50"
              : "bg-white/90 border-indigo-200 shadow-sm"
          }`}
        >
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`lg:hidden p-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "hover:bg-slate-800 text-white"
                      : "hover:bg-indigo-50 text-gray-900"
                  }`}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h2
                    className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    Welcome back, {profile.full_name}!
                  </h2>
                  <p
                    className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                  >
                    Track and manage your investments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Language Selector with Globe Icon */}
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                      : "bg-white border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-md"
                  }`}
                >
                  <Globe
                    className={`w-4 h-4 ${isDarkMode ? "text-emerald-400" : "text-indigo-600"}`}
                  />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className={`bg-transparent text-sm cursor-pointer focus:outline-none font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                    style={{ minWidth: "80px" }}
                  >
                    {languages.map((lang) => (
                      <option
                        key={lang.code}
                        value={lang.code}
                        className={isDarkMode ? "bg-slate-800" : "bg-white"}
                      >
                        {lang.flag} {lang.code3}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-lg border transition-all ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
                      : "bg-white border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-md"
                  }`}
                  title={
                    isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                  }
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-600" />
                  )}
                </button>

                {/* Use your existing NotificationBell component */}
                <NotificationBell userId={user.id} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div
          className={`${
            isDarkMode
              ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
              : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
          }`}
        >
          {children}
        </div>
      </main>

      {/* User Chat Component - Floating chat for all user pages */}
      <UserChat />
    </div>
  );
}

// Navigation Item Component
function NavItem({ icon: Icon, label, href, currentPath, isDarkMode }) {
  const router = useRouter();
  const isActive = currentPath === href;

  return (
    <button
      onClick={() => router.push(href)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive
          ? isDarkMode
            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
          : isDarkMode
            ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
            : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}