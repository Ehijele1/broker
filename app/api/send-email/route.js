import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const FROM = "SecureProTrading <noreply@secureprotrading.com>";

const esc = (s = "") =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(request) {
    try {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: `Bearer ${token}` } } },
        );

        const {
            data: { user },
        } = await supabase.auth.getUser(token);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: me } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
        if (me?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { type, id } = await request.json();
        const table =
            type === "deposit"
                ? "deposits"
                : type === "withdrawal"
                    ? "withdrawals"
                    : null;
        if (!table || !id) {
            return NextResponse.json({ error: "Bad request" }, { status: 400 });
        }

        const { data: row, error } = await supabase
            .from(table)
            .select(
                "amount, currency, status, admin_note, profiles:user_id (full_name, username, email)",
            )
            .eq("id", id)
            .single();

        if (error || !row) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        if (!["approved", "rejected"].includes(row.status)) {
            return NextResponse.json({ error: "Not processed yet" }, { status: 400 });
        }

        const to = row.profiles?.email;
        if (!to) {
            return NextResponse.json({ error: "No email" }, { status: 400 });
        }

        const name = row.profiles?.full_name || row.profiles?.username || "there";
        const amount = `${row.currency} ${Number(row.amount).toFixed(2)}`;
        const label = type === "deposit" ? "Deposit" : "Withdrawal";
        const approved = row.status === "approved";

        let text;
        if (approved) {
            text =
                type === "deposit"
                    ? `Your deposit of ${amount} has been approved and credited to your account.`
                    : `Your withdrawal of ${amount} has been approved and is being sent to your account.`;
        } else {
            text = `Your ${type} of ${amount} was rejected.`;
        }

        const reason =
            !approved && row.admin_note
                ? `<p style="color:#444"><strong>Reason:</strong> ${esc(row.admin_note)}</p>`
                : "";

        const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:${approved ? "#059669" : "#dc2626"};margin-top:0">${label} ${approved ? "Approved" : "Rejected"}</h2>
        <p>Hi ${esc(name)},</p>
        <p>${esc(text)}</p>
        ${reason}
        <p style="color:#888;font-size:12px;margin-top:24px">SecureProTrading</p>
      </div>`;

        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error: sendError } = await resend.emails.send({
            from: FROM,
            to,
            subject: `${label} ${approved ? "Approved" : "Rejected"}`,
            html,
        });

        if (sendError) {
            console.error("Resend error:", sendError);
            return NextResponse.json({ error: "Send failed" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("send-email error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}