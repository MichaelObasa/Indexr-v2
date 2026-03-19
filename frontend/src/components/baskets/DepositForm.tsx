"use client";

import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  BASKET_VAULT_ABI,
  getContracts,
  getRequiredVaultEnvVar,
  isConfiguredAddress,
  isSupportedBasketId,
  isSupportedChain,
  USDC_ABI,
  ZERO_ADDRESS,
} from "@/lib/contracts";
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
  const isCorrectChain = isSupportedChain(chainId);
  const hasConfiguredUsdc = isConfiguredAddress(contracts.USDC);
  const hasConfiguredVault = isConfiguredAddress(vaultAddress);
  const usdcAddress = hasConfiguredUsdc ? contracts.USDC : ZERO_ADDRESS;
  const safeVaultAddress = hasConfiguredVault ? vaultAddress : ZERO_ADDRESS;
  const missingVaultEnvVar = isSupportedBasketId(basketId)
    ? getRequiredVaultEnvVar(basketId)
    : "NEXT_PUBLIC_INDXR10_VAULT";

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && isCorrectChain && hasConfiguredUsdc) },
  });

  // Read USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, safeVaultAddress] : undefined,
    query: { enabled: Boolean(address && isCorrectChain && hasConfiguredUsdc && hasConfiguredVault) },
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
    if (!amountBigInt || !isCorrectChain || !hasConfiguredUsdc || !hasConfiguredVault) return;
    
    try {
      setStep("approve");
      approve({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: "approve",
        args: [safeVaultAddress, amountBigInt],
      });
      toast.success("Approval submitted!");
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve");
      setStep("input");
    }
  };

  const handleDeposit = async () => {
    if (!amountBigInt || !address || !isCorrectChain || !hasConfiguredUsdc || !hasConfiguredVault) return;

    try {
      setStep("deposit");
      deposit({
        address: safeVaultAddress,
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

  useEffect(() => {
    if (!depositSuccess) {
      return;
    }

    toast.success(`Successfully deposited ${amount} USDC into ${basketId}!`);
    setAmount("");
    setStep("input");
    onSuccess?.();
  }, [amount, basketId, depositSuccess, onSuccess]);

  useEffect(() => {
    if (!approveHash || isWaitingApprove || step !== "approve") {
      return;
    }

    refetchAllowance();
    setStep("input");
  }, [approveHash, isWaitingApprove, refetchAllowance, step]);

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6 text-center dark:border-surface-700 dark:bg-surface-800/50">
        <p className="text-surface-600 dark:text-surface-400">
          Connect your wallet to deposit
        </p>
      </div>
    );
  }

  if (!isCorrectChain) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Switch your wallet to Arbitrum Sepolia to deposit into this vault.
        </p>
      </div>
    );
  }

  if (!hasConfiguredUsdc || !hasConfiguredVault) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
        <p className="text-sm text-red-800 dark:text-red-200">
          Deposits are disabled until Sepolia contract addresses are configured. Set `NEXT_PUBLIC_USDC_ADDRESS` and `{missingVaultEnvVar}`.
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

