"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Repeat, Plus, Wallet, Play, Pause, XCircle } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getContracts, ECHOPAY_ABI } from "@/lib/contracts";
import { formatUSDC, formatDate, formatRelativeTime } from "@/lib/utils";

interface Plan {
  id: string;
  wallet_address: string;
  basket_id: string;
  amount_usdc: number;
  frequency: string;
  next_run_at: string;
  status: string;
  plan_id_onchain: number | null;
  total_invested: number;
  execution_count: number;
  created_at: string;
}

export default function PlansPage() {
  const { address, isConnected, chainId } = useAccount();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const contracts = getContracts(chainId);

  const fetchPlans = useCallback(async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/plans?wallet=${address}`);
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchPlans();
    } else {
      setLoading(false);
    }
  }, [address, fetchPlans]);

  // Contract interactions for pause/cancel
  const { writeContract: pausePlan, data: pauseHash, isPending: isPausing } = useWriteContract();
  const { writeContract: cancelPlan, data: cancelHash, isPending: isCancelling } = useWriteContract();

  const { isSuccess: pauseSuccess } = useWaitForTransactionReceipt({ hash: pauseHash });
  const { isSuccess: cancelSuccess } = useWaitForTransactionReceipt({ hash: cancelHash });

  useEffect(() => {
    if (pauseSuccess || cancelSuccess) {
      toast.success("Plan updated successfully!");
      fetchPlans();
    }
  }, [pauseSuccess, cancelSuccess, fetchPlans]);

  const handlePause = async (plan: Plan) => {
    if (!plan.plan_id_onchain) {
      toast.error("Plan not yet on-chain");
      return;
    }

    try {
      pausePlan({
        address: contracts.ECHOPAY as `0x${string}`,
        abi: ECHOPAY_ABI,
        functionName: "pausePlan",
        args: [BigInt(plan.plan_id_onchain)],
      });

      // Also update in database
      await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paused", wallet_address: address }),
      });
    } catch (error) {
      console.error("Pause error:", error);
      toast.error("Failed to pause plan");
    }
  };

  const handleCancel = async (plan: Plan) => {
    if (!plan.plan_id_onchain) {
      // Just update database if not on-chain
      await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Plan cancelled");
      fetchPlans();
      return;
    }

    try {
      cancelPlan({
        address: contracts.ECHOPAY as `0x${string}`,
        abi: ECHOPAY_ABI,
        functionName: "cancelPlan",
        args: [BigInt(plan.plan_id_onchain)],
      });

      await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel plan");
    }
  };

  const handleResume = async (plan: Plan) => {
    try {
      await fetch(`/api/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active", wallet_address: address }),
      });
      toast.success("Plan resumed!");
      fetchPlans();
    } catch (error) {
      console.error("Resume error:", error);
      toast.error("Failed to resume plan");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "warning" | "danger" | "secondary"> = {
      active: "success",
      paused: "warning",
      cancelled: "danger",
      failed: "danger",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Wallet className="h-8 w-8 text-primary-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-surface-900 dark:text-white">
            Connect Your Wallet
          </h1>
          <p className="mt-2 max-w-md text-surface-600 dark:text-surface-400">
            Connect your wallet to view and manage your auto-invest plans.
          </p>
          <div className="mt-8">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
            My Auto-Invest Plans
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            Manage your EchoPay recurring investments
          </p>
        </div>
        <Link href="/plans/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </Link>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-800"
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Repeat className="h-7 w-7 text-primary-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
              No auto-invest plans yet
            </h3>
            <p className="mt-2 text-surface-500 dark:text-surface-400">
              Set up recurring investments to build your portfolio automatically
            </p>
            <Link href="/plans/new">
              <Button className="mt-6">Create Your First Plan</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                      <Repeat className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-surface-900 dark:text-white">
                          {plan.basket_id}
                        </h3>
                        {getStatusBadge(plan.status)}
                      </div>
                      <p className="text-sm text-surface-500 dark:text-surface-400">
                        {formatUSDC(plan.amount_usdc * 1e6)} / {plan.frequency}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      Next run: {formatRelativeTime(plan.next_run_at)}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {formatDate(plan.next_run_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-4 dark:border-surface-800">
                  <div className="text-sm text-surface-500 dark:text-surface-400">
                    <span className="font-medium text-surface-700 dark:text-surface-300">
                      {plan.execution_count}
                    </span>{" "}
                    executions •{" "}
                    <span className="font-medium text-surface-700 dark:text-surface-300">
                      {formatUSDC(plan.total_invested * 1e6)}
                    </span>{" "}
                    total invested
                  </div>

                  <div className="flex items-center space-x-2">
                    {plan.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePause(plan)}
                        isLoading={isPausing}
                      >
                        <Pause className="mr-1 h-4 w-4" />
                        Pause
                      </Button>
                    ) : plan.status === "paused" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResume(plan)}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Resume
                      </Button>
                    ) : null}
                    {plan.status !== "cancelled" && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(plan)}
                        isLoading={isCancelling}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="mt-8 border-primary-200 bg-gradient-to-br from-primary-50 to-accent-50 dark:border-primary-800 dark:from-primary-900/20 dark:to-accent-900/20">
        <CardContent className="p-6">
          <h3 className="font-semibold text-surface-900 dark:text-white">
            How EchoPay Works
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-400">
            <li>• Set up a plan with your desired basket, amount, and frequency</li>
            <li>• Approve USDC spending for the EchoPay contract</li>
            <li>• Our keeper bot automatically executes your plan on schedule</li>
            <li>• You can pause or cancel anytime</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

