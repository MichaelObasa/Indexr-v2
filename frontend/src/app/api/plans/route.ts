import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// GET /api/plans?wallet=0x...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Wallet address required" }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ plans: [] });
  }

  try {
    const { data, error } = await supabase
      .from("echo_plans")
      .select("*")
      .eq("wallet_address", wallet.toLowerCase())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ plans: data || [] });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/plans - Create a new plan
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { wallet_address, basket_id, amount_usdc, frequency, next_run_at, plan_id_onchain } = body;

    // Validate required fields
    if (!wallet_address || !basket_id || !amount_usdc || !frequency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate frequency
    if (!["weekly", "biweekly", "monthly"].includes(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }

    // Validate amount
    if (amount_usdc <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("echo_plans")
      .insert({
        wallet_address: wallet_address.toLowerCase(),
        basket_id,
        amount_usdc,
        frequency,
        next_run_at: next_run_at || new Date().toISOString(),
        plan_id_onchain: plan_id_onchain || null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
    }

    return NextResponse.json({ plan: data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

