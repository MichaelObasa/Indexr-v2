import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// This endpoint is called by a cron job (Vercel Cron, GitHub Actions, etc.)
// It finds all EchoPay plans that are due and executes them

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Keeper wallet private key (for executing transactions)
const KEEPER_PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;

// Contract addresses
const ECHOPAY_ADDRESS = process.env.NEXT_PUBLIC_ECHOPAY_ADDRESS;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;

// ABIs
const ECHOPAY_ABI = parseAbi([
  "function execute(uint256 planId) external",
  "function plans(uint256) external view returns (address owner, address token, address vault, uint256 amountPerRun, uint256 monthlyCap, uint64 nextRun, uint32 frequency, bool active)",
]);

const USDC_ABI = parseAbi([
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]);

// Security: Verify the request is from a trusted source
function verifyRequest(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  // Verify the request
  if (!verifyRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  if (!KEEPER_PRIVATE_KEY || !ECHOPAY_ADDRESS) {
    return NextResponse.json({ error: "Keeper not configured" }, { status: 503 });
  }

  try {
    // 1. Find all plans that are due
    const now = new Date().toISOString();
    const { data: duePlans, error: fetchError } = await supabase
      .from("echo_plans")
      .select("*")
      .eq("status", "active")
      .lte("next_run_at", now);

    if (fetchError) {
      console.error("Failed to fetch plans:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!duePlans || duePlans.length === 0) {
      return NextResponse.json({ message: "No plans due", executed: 0 });
    }

    console.log(`Found ${duePlans.length} plans due for execution`);

    // 2. Set up viem clients
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(),
    });

    const account = privateKeyToAccount(KEEPER_PRIVATE_KEY as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(),
    });

    const results: Array<{
      planId: string;
      status: "success" | "failed" | "skipped";
      reason?: string;
      txHash?: string;
    }> = [];

    // 3. Process each plan
    for (const plan of duePlans) {
      try {
        // Skip if no on-chain plan ID
        if (!plan.plan_id_onchain) {
          results.push({
            planId: plan.id,
            status: "skipped",
            reason: "No on-chain plan ID",
          });
          continue;
        }

        // Check user's USDC balance
        const balance = await publicClient.readContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: USDC_ABI,
          functionName: "balanceOf",
          args: [plan.wallet_address as `0x${string}`],
        });

        const amountNeeded = BigInt(Math.floor(plan.amount_usdc * 1e6));

        if (balance < amountNeeded) {
          // Insufficient balance - create notification
          await supabase.from("notifications").insert({
            wallet_address: plan.wallet_address,
            plan_id: plan.id,
            type: "low_balance",
            title: "Low Balance",
            message: `Your ${plan.basket_id} auto-invest couldn't execute. Please top up your USDC.`,
          });

          results.push({
            planId: plan.id,
            status: "skipped",
            reason: "Insufficient balance",
          });
          continue;
        }

        // Check allowance
        const allowance = await publicClient.readContract({
          address: USDC_ADDRESS as `0x${string}`,
          abi: USDC_ABI,
          functionName: "allowance",
          args: [plan.wallet_address as `0x${string}`, ECHOPAY_ADDRESS as `0x${string}`],
        });

        if (allowance < amountNeeded) {
          results.push({
            planId: plan.id,
            status: "skipped",
            reason: "Insufficient allowance",
          });
          continue;
        }

        // Execute the plan
        const txHash = await walletClient.writeContract({
          address: ECHOPAY_ADDRESS as `0x${string}`,
          abi: ECHOPAY_ABI,
          functionName: "execute",
          args: [BigInt(plan.plan_id_onchain)],
        });

        // Wait for confirmation
        await publicClient.waitForTransactionReceipt({ hash: txHash });

        // Update plan in database
        const nextRunAt = calculateNextRun(plan.frequency);
        await supabase
          .from("echo_plans")
          .update({
            next_run_at: nextRunAt.toISOString(),
            last_executed_at: new Date().toISOString(),
            total_invested: plan.total_invested + plan.amount_usdc,
            execution_count: plan.execution_count + 1,
          })
          .eq("id", plan.id);

        // Create success notification
        await supabase.from("notifications").insert({
          wallet_address: plan.wallet_address,
          plan_id: plan.id,
          type: "executed",
          title: "Auto-Invest Executed",
          message: `$${plan.amount_usdc} was invested into ${plan.basket_id}`,
        });

        results.push({
          planId: plan.id,
          status: "success",
          txHash,
        });

      } catch (planError) {
        console.error(`Failed to execute plan ${plan.id}:`, planError);

        // Mark plan as failed after multiple failures
        await supabase
          .from("echo_plans")
          .update({ status: "failed" })
          .eq("id", plan.id);

        // Create failure notification
        await supabase.from("notifications").insert({
          wallet_address: plan.wallet_address,
          plan_id: plan.id,
          type: "failed",
          title: "Auto-Invest Failed",
          message: `Your ${plan.basket_id} auto-invest failed. Please check your plan settings.`,
        });

        results.push({
          planId: plan.id,
          status: "failed",
          reason: String(planError),
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;

    return NextResponse.json({
      message: `Processed ${duePlans.length} plans`,
      executed: successCount,
      failed: failedCount,
      skipped: skippedCount,
      results,
    });

  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function calculateNextRun(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "biweekly":
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case "monthly":
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

// Also support GET for manual testing
export async function GET(request: Request) {
  return POST(request);
}

