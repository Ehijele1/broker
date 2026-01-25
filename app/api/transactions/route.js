// app/api/transactions/route.js
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return unauthorized('Missing or invalid Authorization header')
    }

    const accessToken = authHeader.split(' ')[1]

    // Use service role key ONLY if you have strong reason to bypass RLS
    // Recommended: use the user's token → RLS will protect the data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // ← change this in most cases
      // Best practice (RLS enforced):
      // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )

    // Verify token & get user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorized(authError?.message || 'Invalid or expired token')
    }

    // Optional: you can add role/permission check here if needed
    // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

    // ────────────────────────────────────────────────
    //  Option A: Union-like query (recommended - clean & efficient)
    // ────────────────────────────────────────────────
    const { data, error } = await supabase
      .from('transactions_view')           // ← see below how to create this
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      // .limit(500)                        // ← strongly recommended
      // .range(0, 499)

    if (error) {
      console.error('[API] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions', details: error.message },
        { status: 500 }
      )
    }

    // If you don't want to create a view, use this union version (PostgreSQL 16+):
    /*
    const { data, error } = await supabase.rpc('get_user_transactions', {
      p_user_id: user.id
    })
    */

    const transactions = (data || []).map(item => ({
      id: item.id,
      type: item.type,
      amount: Number(item.amount) || 0,
      profit: item.type === 'trade' ? Number(item.profit || 0) : undefined,
      status: item.status,
      date: item.date || item.created_at,
      payment_method: item.payment_method || item.method || null,
      // Add any other fields you want in CSV: description, fee, reference, etc.
    }))

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length
    })

  } catch (err) {
    console.error('[API] Critical error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}