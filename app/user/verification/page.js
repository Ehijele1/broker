"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Shield,
  ArrowLeft,
  Mail,
  Send,
  Clock,
  Award,
  AlertCircle,
} from "lucide-react";

export default function VerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

  const checkUser = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/signin");
        return;
      }

      setUser(user);

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

  const handleSendVerificationEmail = async () => {
    try {
      setSending(true);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) throw error;

      setEmailSent(true);
      alert("Verification email sent! Please check your inbox.");
    } catch (error) {
      console.error("Error sending verification email:", error);
      alert("Failed to send verification email. Please try again.");
    } finally {
      setSending(false);
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

  // Check if email is verified
  const isEmailVerified = user?.email_confirmed_at !== null;

  // Verified Email Screen
  if (isEmailVerified) {
    return (
      <div
        className={`min-h-screen p-4 lg:p-8 ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
        }`}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/user/dashboard")}
            className={`flex items-center gap-2 mb-6 transition-colors ${
              isDarkMode
                ? "text-slate-400 hover:text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div
            className={`rounded-2xl p-8 text-center border ${
              isDarkMode
                ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30"
                : "bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-200 shadow-lg"
            }`}
          >
            <div
              className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                isDarkMode
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-green-500 to-emerald-600"
              }`}
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h1
              className={`text-3xl font-bold mb-3 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              You Are Verified! ✓
            </h1>
            <p
              className={`mb-6 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
            >
              Your email address has been successfully verified. You now have
              full access to all platform features.
            </p>

            <div
              className={`rounded-xl p-6 space-y-4 ${
                isDarkMode
                  ? "bg-slate-900/50"
                  : "bg-white border border-indigo-200 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={isDarkMode ? "text-slate-400" : "text-gray-600"}
                >
                  Status
                </span>
                <span
                  className={`px-4 py-1 rounded-full text-sm font-semibold border ${
                    isDarkMode
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-emerald-50 text-emerald-700 border-emerald-300"
                  }`}
                >
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={isDarkMode ? "text-slate-400" : "text-gray-600"}
                >
                  Email Address
                </span>
                <span
                  className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {user.email}
                </span>
              </div>

              {user.email_confirmed_at && (
                <div className="flex items-center justify-between">
                  <span
                    className={isDarkMode ? "text-slate-400" : "text-gray-600"}
                  >
                    Verified On
                  </span>
                  <span
                    className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    {new Date(user.email_confirmed_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span
                  className={isDarkMode ? "text-slate-400" : "text-gray-600"}
                >
                  Account Name
                </span>
                <span
                  className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  {profile?.full_name || "User"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div
                className={`rounded-lg p-4 ${
                  isDarkMode
                    ? "bg-slate-900/30"
                    : "bg-white border border-indigo-200"
                }`}
              >
                <Award
                  className={`w-8 h-8 mx-auto mb-2 ${
                    isDarkMode ? "text-emerald-400" : "text-emerald-600"
                  }`}
                />
                <p
                  className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                >
                  Enhanced Security
                </p>
              </div>
              <div
                className={`rounded-lg p-4 ${
                  isDarkMode
                    ? "bg-slate-900/30"
                    : "bg-white border border-indigo-200"
                }`}
              >
                <Shield
                  className={`w-8 h-8 mx-auto mb-2 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <p
                  className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                >
                  Full Access
                </p>
              </div>
              <div
                className={`rounded-lg p-4 ${
                  isDarkMode
                    ? "bg-slate-900/30"
                    : "bg-white border border-indigo-200"
                }`}
              >
                <CheckCircle
                  className={`w-8 h-8 mx-auto mb-2 ${
                    isDarkMode ? "text-teal-400" : "text-teal-600"
                  }`}
                />
                <p
                  className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
                >
                  Trusted Account
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/user/dashboard")}
              className={`mt-6 px-8 py-3 rounded-lg font-semibold transition-all ${
                isDarkMode
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              }`}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unverified Email Screen
  return (
    <div
      className={`min-h-screen p-4 lg:p-8 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/user/dashboard")}
          className={`flex items-center gap-2 mb-6 transition-colors ${
            isDarkMode
              ? "text-slate-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div
          className={`rounded-2xl p-8 border text-center ${
            isDarkMode
              ? "bg-slate-900/50 backdrop-blur-sm border-slate-800/50"
              : "bg-white border-indigo-200 shadow-lg"
          }`}
        >
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
              isDarkMode
                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                : "bg-gradient-to-br from-amber-500 to-orange-500"
            }`}
          >
            <Mail className="w-10 h-10 text-white" />
          </div>

          <h1
            className={`text-3xl font-bold mb-3 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Verify Your Email
          </h1>
          <p
            className={`mb-2 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
          >
            Please verify your email address to unlock all features and secure
            your account.
          </p>
          <p
            className={`text-sm mb-8 ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
          >
            We'll send a verification link to{" "}
            <strong className={isDarkMode ? "text-white" : "text-gray-900"}>
              {user?.email}
            </strong>
          </p>

          {emailSent && (
            <div
              className={`rounded-lg p-4 mb-6 border ${
                isDarkMode
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div
                className={`flex items-center justify-center gap-2 mb-2 ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                <Clock className="w-5 h-5" />
                <p className="font-semibold">Verification Email Sent!</p>
              </div>
              <p
                className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
              >
                Please check your inbox and spam folder. Click the verification
                link in the email to complete the process.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div
              className={`rounded-xl p-4 ${
                isDarkMode
                  ? "bg-slate-800/30"
                  : "bg-indigo-50 border border-indigo-200"
              }`}
            >
              <CheckCircle
                className={`w-8 h-8 mx-auto mb-2 ${
                  isDarkMode ? "text-emerald-400" : "text-emerald-600"
                }`}
              />
              <h3
                className={`font-semibold mb-1 text-sm ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Secure Access
              </h3>
              <p
                className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
              >
                Protect your account from unauthorized access
              </p>
            </div>

            <div
              className={`rounded-xl p-4 ${
                isDarkMode
                  ? "bg-slate-800/30"
                  : "bg-indigo-50 border border-indigo-200"
              }`}
            >
              <Shield
                className={`w-8 h-8 mx-auto mb-2 ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}
              />
              <h3
                className={`font-semibold mb-1 text-sm ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Full Features
              </h3>
              <p
                className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
              >
                Unlock all platform features and capabilities
              </p>
            </div>

            <div
              className={`rounded-xl p-4 ${
                isDarkMode
                  ? "bg-slate-800/30"
                  : "bg-indigo-50 border border-indigo-200"
              }`}
            >
              <AlertCircle
                className={`w-8 h-8 mx-auto mb-2 ${
                  isDarkMode ? "text-amber-400" : "text-amber-600"
                }`}
              />
              <h3
                className={`font-semibold mb-1 text-sm ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Quick Process
              </h3>
              <p
                className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
              >
                Verification takes just a few clicks
              </p>
            </div>
          </div>

          <button
            onClick={handleSendVerificationEmail}
            disabled={sending}
            className={`w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDarkMode
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-700 hover:shadow-emerald-500/20 text-white"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 text-white hover:shadow-xl"
            }`}
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

          <p
            className={`text-xs mt-4 ${isDarkMode ? "text-slate-500" : "text-gray-500"}`}
          >
            Didn't receive the email? Check your spam folder or click "Verify
            Now" to resend.
          </p>

          <div
            className={`mt-6 pt-6 border-t ${
              isDarkMode ? "border-slate-800" : "border-indigo-200"
            }`}
          >
            <p
              className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
            >
              <strong className={isDarkMode ? "text-white" : "text-gray-900"}>
                Need help?
              </strong>{" "}
              Contact our support team if you're having trouble verifying your
              email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}