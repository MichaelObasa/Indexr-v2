"use client";

import { useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { Droplets, Wallet } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getContracts, isConfiguredAddress, isSupportedChain, USDC_ABI, ZERO_ADDRESS } from "@/lib/contracts";
import { formatUSDC } from "@/lib/utils";

export default function FaucetPage() {
  const { address, isConnected, chainId } = useAccount();
  const contracts = getContracts(chainId);
  const usdcAddress = isConfiguredAddress(contracts.USDC) ? contracts.USDC : ZERO_ADDRESS;
  const isCorrectChain = isSupportedChain(chainId);
  const hasConfiguredUsdc = isConfiguredAddress(contracts.USDC);

  // Read USDC balance
  const { data: balance, refetch } = useReadContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && isCorrectChain && hasConfiguredUsdc) },
  });

  // Faucet transaction
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleFaucet = () => {
    if (!isCorrectChain || !hasConfiguredUsdc) {
      return;
    }

    writeContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: "faucet",
    });
    toast.success("Faucet request submitted!");
  };

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    toast.success("Received 10,000 USDC!");
    refetch();
  }, [isSuccess, refetch]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Wallet className="h-8 w-8 text-primary-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-surface-900 dark:text-white">
            Connect Your Wallet
          </h1>
          <p className="mt-2 max-w-md text-surface-600 dark:text-surface-400">
            Connect your wallet to use the testnet USDC faucet.
          </p>
          <div className="mt-8">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
            <Droplets className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="mt-4">Testnet USDC Faucet</CardTitle>
          <CardDescription>
            Get test USDC tokens for Arbitrum Sepolia. Each claim gives you 10,000 USDC.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isCorrectChain && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Switch your wallet to Arbitrum Sepolia to mint test USDC.
              </p>
            </div>
          )}

          {!hasConfiguredUsdc && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">
                Faucet is unavailable until `NEXT_PUBLIC_USDC_ADDRESS` points to the deployed MockUSDC contract with `faucet()`.
              </p>
            </div>
          )}

          <div className="rounded-lg bg-surface-100 p-4 dark:bg-surface-800">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              Current Balance
            </p>
            <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">
              {balance !== undefined ? formatUSDC(balance) : "Loading..."}
            </p>
          </div>

          <Button
            onClick={handleFaucet}
            isLoading={isPending || isWaiting}
            disabled={!isCorrectChain || !hasConfiguredUsdc}
            className="w-full"
            size="lg"
            variant="accent"
          >
            {isPending || isWaiting ? "Claiming..." : "Claim 10,000 USDC"}
          </Button>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> This is testnet USDC with no real value. Make sure
              you're connected to Arbitrum Sepolia network.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

