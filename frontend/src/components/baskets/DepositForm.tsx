"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getContracts, USDC_ABI, BASKET_VAULT_ABI } from "@/lib/contracts";
import { formatUSDC } from "@/lib/utils";

interface DepositFormProps {
  basketId: string;
  vaultAddress: string;
  onSuccess?: () => void;
}

export function DepositForm({ basketId, vaultAddress, onSuccess }: DepositFormProps) {
  const { address, isConnected, chainId } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "approve" | "deposit">("input");
  
  const contracts = getContracts(chainId);

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: contracts.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  // Read USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: contracts.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, vaultAddress as `0x${string}`] : undefined,
    query: { enabled: Boolean(address && vaultAddress) },
  });

  // Approve USDC
  const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
  
  // Deposit
  const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();

  // Wait for transactions
  const { isLoading: isWaitingApprove } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isWaitingDeposit, isSuccess: depositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const amountBigInt = amount ? parseUnits(amount, 6) : 0n;
  const needsApproval = allowance !== undefined && amountBigInt > allowance;
  const hasBalance = usdcBalance !== undefined && amountBigInt <= usdcBalance;

  const handleApprove = async () => {
    if (!amountBigInt) return;
    
    try {
      setStep("approve");
      approve({
        address: contracts.USDC as `0x${string}`,
        abi: USDC_ABI,
        functionName: "approve",
        args: [vaultAddress as `0x${string}`, amountBigInt],
      });
      toast.success("Approval submitted!");
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve");
      setStep("input");
    }
  };

  const handleDeposit = async () => {
    if (!amountBigInt || !address) return;

    try {
      setStep("deposit");
      deposit({
        address: vaultAddress as `0x${string}`,
        abi: BASKET_VAULT_ABI,
        functionName: "deposit",
        args: [amountBigInt, address],
      });
      toast.success("Deposit submitted!");
    } catch (error) {
      console.error("Deposit error:", error);
      toast.error("Failed to deposit");
      setStep("input");
    }
  };

  // Handle successful deposit
  if (depositSuccess) {
    toast.success(`Successfully deposited ${amount} USDC into ${basketId}!`);
    setAmount("");
    setStep("input");
    onSuccess?.();
  }

  // Refetch allowance after approval
  if (approveHash && !isWaitingApprove && step === "approve") {
    refetchAllowance();
    setStep("input");
  }

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6 text-center dark:border-surface-700 dark:bg-surface-800/50">
        <p className="text-surface-600 dark:text-surface-400">
          Connect your wallet to deposit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-surface-500 dark:text-surface-400">Balance</span>
        <span className="font-medium text-surface-700 dark:text-surface-300">
          {usdcBalance !== undefined ? formatUSDC(usdcBalance) : "Loading..."}
        </span>
      </div>

      <Input
        type="number"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        label="Amount (USDC)"
        hint="Enter the amount of USDC to deposit"
        error={amount && !hasBalance ? "Insufficient balance" : undefined}
      />

      <div className="flex gap-2">
        <button
          onClick={() => setAmount(usdcBalance ? formatUnits(usdcBalance / 4n, 6) : "0")}
          className="rounded-lg bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          25%
        </button>
        <button
          onClick={() => setAmount(usdcBalance ? formatUnits(usdcBalance / 2n, 6) : "0")}
          className="rounded-lg bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          50%
        </button>
        <button
          onClick={() => setAmount(usdcBalance ? formatUnits(usdcBalance, 6) : "0")}
          className="rounded-lg bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          Max
        </button>
      </div>

      {needsApproval ? (
        <Button
          onClick={handleApprove}
          isLoading={isApproving || isWaitingApprove}
          disabled={!amount || !hasBalance}
          className="w-full"
        >
          {isApproving || isWaitingApprove ? "Approving..." : "Approve USDC"}
        </Button>
      ) : (
        <Button
          onClick={handleDeposit}
          isLoading={isDepositing || isWaitingDeposit}
          disabled={!amount || !hasBalance}
          className="w-full"
          variant="accent"
        >
          {isDepositing || isWaitingDeposit ? "Depositing..." : "Deposit"}
        </Button>
      )}
    </div>
  );
}

