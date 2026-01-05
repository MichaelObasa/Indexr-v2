"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import toast from "react-hot-toast";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BASKET_VAULT_ABI } from "@/lib/contracts";
import { formatTokenAmount, formatUSDC } from "@/lib/utils";

interface WithdrawFormProps {
  basketId: string;
  vaultAddress: string;
  vaultSymbol?: string;
  onSuccess?: () => void;
}

export function WithdrawForm({ basketId, vaultAddress, vaultSymbol = "SHARES", onSuccess }: WithdrawFormProps) {
  const { address, isConnected } = useAccount();
  const [shares, setShares] = useState("");

  // Read vault share balance
  const { data: shareBalance, refetch: refetchShares } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: BASKET_VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  // Read vault decimals
  const { data: decimals } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: BASKET_VAULT_ABI,
    functionName: "decimals",
  });

  // Convert shares to assets (preview)
  const sharesBigInt = shares && decimals ? parseUnits(shares, decimals as number) : 0n;
  
  const { data: assetsPreview } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: BASKET_VAULT_ABI,
    functionName: "convertToAssets",
    args: sharesBigInt ? [sharesBigInt] : undefined,
    query: { enabled: Boolean(sharesBigInt) },
  });

  // Redeem
  const { writeContract: redeem, data: redeemHash, isPending: isRedeeming } = useWriteContract();

  const { isLoading: isWaitingRedeem, isSuccess: redeemSuccess } = useWaitForTransactionReceipt({
    hash: redeemHash,
  });

  const hasShares = shareBalance !== undefined && sharesBigInt > 0n && sharesBigInt <= shareBalance;

  const handleRedeem = async () => {
    if (!sharesBigInt || !address) return;

    try {
      redeem({
        address: vaultAddress as `0x${string}`,
        abi: BASKET_VAULT_ABI,
        functionName: "redeem",
        args: [sharesBigInt, address, address],
      });
      toast.success("Withdrawal submitted!");
    } catch (error) {
      console.error("Redeem error:", error);
      toast.error("Failed to withdraw");
    }
  };

  // Handle successful redeem
  if (redeemSuccess) {
    toast.success(`Successfully withdrew from ${basketId}!`);
    setShares("");
    refetchShares();
    onSuccess?.();
  }

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-50 p-6 text-center dark:border-surface-700 dark:bg-surface-800/50">
        <p className="text-surface-600 dark:text-surface-400">
          Connect your wallet to withdraw
        </p>
      </div>
    );
  }

  const vaultDecimals = (decimals as number) || 6;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-surface-500 dark:text-surface-400">Your Shares</span>
        <span className="font-medium text-surface-700 dark:text-surface-300">
          {shareBalance !== undefined
            ? `${formatTokenAmount(shareBalance, vaultDecimals)} ${vaultSymbol}`
            : "Loading..."}
        </span>
      </div>

      <Input
        type="number"
        placeholder="0.00"
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        label={`Shares (${vaultSymbol})`}
        hint="Enter the number of shares to redeem"
        error={shares && !hasShares ? "Insufficient shares" : undefined}
      />

      <div className="flex gap-2">
        <button
          onClick={() =>
            setShares(shareBalance ? formatUnits(shareBalance / 4n, vaultDecimals) : "0")
          }
          className="rounded-lg bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          25%
        </button>
        <button
          onClick={() =>
            setShares(shareBalance ? formatUnits(shareBalance / 2n, vaultDecimals) : "0")
          }
          className="rounded-lg bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          50%
        </button>
        <button
          onClick={() =>
            setShares(shareBalance ? formatUnits(shareBalance, vaultDecimals) : "0")
          }
          className="rounded-lg bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
        >
          Max
        </button>
      </div>

      {assetsPreview !== undefined && sharesBigInt > 0n && (
        <div className="rounded-lg bg-surface-100 p-3 dark:bg-surface-800">
          <p className="text-sm text-surface-600 dark:text-surface-400">
            You will receive approximately{" "}
            <span className="font-semibold text-surface-900 dark:text-white">
              {formatUSDC(assetsPreview)}
            </span>
          </p>
        </div>
      )}

      <Button
        onClick={handleRedeem}
        isLoading={isRedeeming || isWaitingRedeem}
        disabled={!shares || !hasShares}
        className="w-full"
        variant="secondary"
      >
        {isRedeeming || isWaitingRedeem ? "Withdrawing..." : "Withdraw"}
      </Button>
    </div>
  );
}

