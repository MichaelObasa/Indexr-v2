import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// GET /api/plans/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const planId = params.id;

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from("echo_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ plan: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/plans/[id] - Update plan (pause/resume/cancel)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const planId = params.id;

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { status, wallet_address } = body;

    // Validate status
    if (status && !["active", "paused", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // First, verify the plan exists and belongs to the wallet
    const { data: existingPlan, error: fetchError } = await supabase
      .from("echo_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Verify ownership if wallet_address provided
    if (wallet_address && existingPlan.wallet_address !== wallet_address.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the plan
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;

    const { data, error } = await supabase
      .from("echo_plans")
      .update(updateData)
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }

    return NextResponse.json({ plan: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/plans/[id] - Cancel plan
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const planId = params.id;

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    // Verify ownership
    if (wallet) {
      const { data: existingPlan } = await supabase
        .from("echo_plans")
        .select("wallet_address")
        .eq("id", planId)
        .single();

      if (existingPlan && existingPlan.wallet_address !== wallet.toLowerCase()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Set status to cancelled instead of deleting
    const { error } = await supabase
      .from("echo_plans")
      .update({ status: "cancelled" })
      .eq("id", planId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to cancel plan" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

