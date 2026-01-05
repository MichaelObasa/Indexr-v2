"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { ArrowLeft, Repeat, Check } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import toast from "react-hot-toast";
import { parseUnits } from "viem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getBaskets, Basket } from "@/lib/supabase";
import { getContracts, USDC_ABI, ECHOPAY_ABI } from "@/lib/contracts";
import { formatUSDC, getNextRunDate, getFrequencySeconds } from "@/lib/utils";

type Frequency = "weekly" | "biweekly" | "monthly";

export default function NewPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBasket = searchParams.get("basket");
  
  const { address, isConnected, chainId } = useAccount();
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [selectedBasket, setSelectedBasket] = useState(preselectedBasket || "");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [step, setStep] = useState<"form" | "approve" | "create" | "success">("form");

  const contracts = getContracts(chainId);
  const amountBigInt = amount ? parseUnits(amount, 6) : 0n;

  useEffect(() => {
    async function fetchBaskets() {
      const data = await getBaskets();
      setBaskets(data);
      if (!selectedBasket && data.length > 0) {
        setSelectedBasket(data[0].id);
      }
    }
    fetchBaskets();
  }, [selectedBasket]);

  // Read USDC allowance for EchoPay
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, contracts.ECHOPAY as `0x${string}`] : undefined,
    query: { enabled: Boolean(address) },
  });

  // Read USDC balance
  const { data: balance } = useReadContract({
    address: contracts.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  // Approve USDC
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  const { isLoading: isWaitingApprove, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Create plan on-chain
  const { writeContract: createPlan, data: createHash, isPending: isCreating } = useWriteContract();
  const { isLoading: isWaitingCreate, isSuccess: createSuccess } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  // Get vault address for selected basket
  const selectedBasketData = baskets.find((b) => b.id === selectedBasket);
  const vaultAddress = selectedBasketData?.vault_address || 
    contracts.VAULTS[selectedBasket as keyof typeof contracts.VAULTS];

  const needsApproval = allowance !== undefined && amountBigInt > allowance;

  // Handle approval success
  useEffect(() => {
    if (approveSuccess) {
      toast.success("USDC approved!");
      refetchAllowance();
      setStep("form");
    }
  }, [approveSuccess, refetchAllowance]);

  // Handle create success
  useEffect(() => {
    if (createSuccess) {
      // Save to database
      savePlanToDatabase();
    }
  }, [createSuccess]);

  const handleApprove = async () => {
    // Approve a large amount so user doesn't need to re-approve often
    const approveAmount = amountBigInt * 100n; // Approve 100x the amount

    try {
      setStep("approve");
      approve({
        address: contracts.USDC as `0x${string}`,
        abi: USDC_ABI,
        functionName: "approve",
        args: [contracts.ECHOPAY as `0x${string}`, approveAmount],
      });
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve");
      setStep("form");
    }
  };

  const handleCreatePlan = async () => {
    if (!vaultAddress || !amountBigInt) return;

    const nextRunDate = getNextRunDate(frequency);
    const frequencySeconds = getFrequencySeconds(frequency);

    try {
      setStep("create");
      createPlan({
        address: contracts.ECHOPAY as `0x${string}`,
        abi: ECHOPAY_ABI,
        functionName: "createPlan",
        args: [
          contracts.USDC as `0x${string}`,
          vaultAddress as `0x${string}`,
          amountBigInt,
          amountBigInt * 12n, // Monthly cap = 12x per-run amount
          BigInt(Math.floor(nextRunDate.getTime() / 1000)),
          frequencySeconds,
        ],
      });
    } catch (error) {
      console.error("Create plan error:", error);
      toast.error("Failed to create plan");
      setStep("form");
    }
  };

  const savePlanToDatabase = async () => {
    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet_address: address,
          basket_id: selectedBasket,
          amount_usdc: parseFloat(amount),
          frequency,
          next_run_at: getNextRunDate(frequency).toISOString(),
        }),
      });

      if (response.ok) {
        setStep("success");
        toast.success("Auto-invest plan created!");
      }
    } catch (error) {
      console.error("Save plan error:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Connect Your Wallet
          </h1>
          <p className="mt-2 text-surface-600 dark:text-surface-400">
            Connect your wallet to create an auto-invest plan
          </p>
          <div className="mt-8">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-surface-900 dark:text-white">
              Plan Created!
            </h2>
            <p className="mt-2 text-surface-600 dark:text-surface-400">
              Your auto-invest plan for {selectedBasket} has been set up.
              <br />
              {formatUSDC(amountBigInt)} will be invested {frequency}.
            </p>
            <div className="mt-8 flex justify-center space-x-4">
              <Link href="/plans">
                <Button>View My Plans</Button>
              </Link>
              <Link href="/baskets">
                <Button variant="outline">Browse Baskets</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/plans"
        className="mb-6 inline-flex items-center text-sm text-surface-500 hover:text-primary-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Plans
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
              <Repeat className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Create Auto-Invest Plan</CardTitle>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Set up recurring investments with EchoPay
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basket Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
              Select Basket
            </label>
            <div className="grid grid-cols-2 gap-3">
              {baskets.map((basket) => (
                <button
                  key={basket.id}
                  onClick={() => setSelectedBasket(basket.id)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selectedBasket === basket.id
                      ? "border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20"
                      : "border-surface-200 hover:border-surface-300 dark:border-surface-700 dark:hover:border-surface-600"
                  }`}
                >
                  <p className="font-medium text-surface-900 dark:text-white">
                    {basket.id}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {basket.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <Input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              label="Amount (USDC)"
              hint={`Balance: ${balance !== undefined ? formatUSDC(balance) : "Loading..."}`}
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="mb-2 block text-sm font-medium text-surface-700 dark:text-surface-300">
              Frequency
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["weekly", "biweekly", "monthly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    frequency === freq
                      ? "border-primary-500 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-400"
                      : "border-surface-200 text-surface-600 hover:border-surface-300 dark:border-surface-700 dark:text-surface-400"
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {amount && selectedBasket && (
            <div className="rounded-lg bg-surface-100 p-4 dark:bg-surface-800">
              <h4 className="font-medium text-surface-900 dark:text-white">
                Plan Summary
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-surface-600 dark:text-surface-400">
                <li>
                  Basket: <strong>{selectedBasket}</strong>
                </li>
                <li>
                  Amount: <strong>{formatUSDC(amountBigInt)}</strong> per {frequency.replace("ly", "")}
                </li>
                <li>
                  First execution:{" "}
                  <strong>{getNextRunDate(frequency).toLocaleDateString()}</strong>
                </li>
              </ul>
            </div>
          )}

          {/* Actions */}
          {needsApproval ? (
            <Button
              onClick={handleApprove}
              isLoading={isApproving || isWaitingApprove}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full"
              size="lg"
            >
              {isApproving || isWaitingApprove ? "Approving..." : "Approve USDC"}
            </Button>
          ) : (
            <Button
              onClick={handleCreatePlan}
              isLoading={isCreating || isWaitingCreate}
              disabled={!amount || parseFloat(amount) <= 0 || !selectedBasket}
              className="w-full"
              size="lg"
              variant="accent"
            >
              {isCreating || isWaitingCreate ? "Creating..." : "Create Plan"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

