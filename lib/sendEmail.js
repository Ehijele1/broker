import { supabase } from "@/lib/supabase";

export async function sendStatusEmail(type, id) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ type, id }),
    });
  } catch (error) {
    console.error("Email failed:", error);
  }
}