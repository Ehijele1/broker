"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

const LAST_ACTIVITY_KEY = "last_activity_time";

export default function InactivityMonitor({ userId }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef(null);
  const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour
  const SESSION_MAX_AGE = 4 * 60 * 60 * 1000; // 4 hours

  // Check if session is expired (on page load/reload)
  const checkSessionExpiry = async () => {
    const now = Date.now();

    // Check last activity - this is the main check
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (lastActivity) {
      const timeSinceActivity = now - parseInt(lastActivity);

      // If user was away for more than 4 hours (closed tab/disconnected)
      if (timeSinceActivity > SESSION_MAX_AGE) {
        console.log(
          "[INACTIVITY] Session expired - last activity was",
          Math.floor(timeSinceActivity / 1000 / 60 / 60),
          "hours ago",
        );
        await handleLogout();
        return false;
      }

      // If user was away for more than 1 hour (inactive)
      if (timeSinceActivity > INACTIVITY_TIMEOUT) {
        console.log(
          "[INACTIVITY] Session expired due to inactivity - last activity was",
          Math.floor(timeSinceActivity / 1000 / 60),
          "minutes ago",
        );
        await handleLogout();
        return false;
      }
    }

    return true;
  };

  // Reset the inactivity timer
  const resetTimer = () => {
    // Update last activity time
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);

    console.log(
      "[INACTIVITY] Timer reset - will logout after 1 hour of inactivity",
    );
  };

  // Handle logout
  const handleLogout = async () => {
    console.log("[INACTIVITY] Logging out user");

    try {
      // Clear session tracking
      localStorage.removeItem(LAST_ACTIVITY_KEY);

      // Mark user as offline
      if (userId) {
        await supabase
          .from("active_sessions")
          .update({ is_online: false })
          .eq("user_id", userId);
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Redirect to signin
      router.push("/signin");
    } catch (error) {
      console.error("[INACTIVITY] Error during logout:", error);
      // Force redirect even if there's an error
      router.push("/signin");
    }
  };

  // Initial session check on mount
  useEffect(() => {
    if (!userId) return;

    console.log("[INACTIVITY] Checking session validity for user:", userId);

    checkSessionExpiry().then((isValid) => {
      if (!isValid) {
        console.log("[INACTIVITY] Session invalid - redirecting to signin");
        return;
      }

      console.log("[INACTIVITY] Session valid - starting monitor");
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    console.log("[INACTIVITY] Monitor started for user:", userId);

    // Events to track for activity
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "mousemove",
    ];

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, true);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer, true);
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      console.log("[INACTIVITY] Monitor stopped");
    };
  }, [userId]);

  // Track route changes as activity
  useEffect(() => {
    if (!userId) return;

    console.log("[INACTIVITY] Route changed - resetting timer");
    resetTimer();
  }, [pathname]);

  // This component doesn't render anything
  return null;
}