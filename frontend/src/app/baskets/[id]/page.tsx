"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { ArrowLeft, TrendingUp, Clock, Repeat } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DepositForm } from "@/components/baskets/DepositForm";
import { WithdrawForm } from "@/components/baskets/WithdrawForm";
import { getBasketById, Basket } from "@/lib/supabase";
import { getContracts, BASKET_VAULT_ABI } from "@/lib/contracts";
import {
  formatUSDC,
  formatWeight,
  getCategoryLabel,
  getRiskBadgeColor,
  formatTokenAmount,
} from "@/lib/utils";

export default function BasketDetailPage() {
  const params = useParams();
  const basketId = params.id as string;
  const { address, chainId } = useAccount();
  const [basket, setBasket] = useState<Basket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const contracts = getContracts(chainId);
  const vaultAddress = basket?.vault_address || contracts.VAULTS[basketId as keyof typeof contracts.VAULTS];

  // Read vault data
  const { data: totalAssets, refetch: refetchAssets } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: BASKET_VAULT_ABI,
    functionName: "totalAssets",
    query: { enabled: Boolean(vaultAddress) },
  });

  const { data: userShares, refetch: refetchShares } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: BASKET_VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(vaultAddress && address) },
  });

  const { data: userAssets } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: BASKET_VAULT_ABI,
    functionName: "convertToAssets",
    args: userShares ? [userShares] : undefined,
    query: { enabled: Boolean(userShares && userShares > 0n) },
  });

  const { data: vaultSymbol } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: BASKET_VAULT_ABI,
    functionName: "symbol",
    query: { enabled: Boolean(vaultAddress) },
  });

  useEffect(() => {
    async function fetchBasket() {
      const data = await getBasketById(basketId);
      setBasket(data);
      setLoading(false);
    }
    fetchBasket();
  }, [basketId]);

  const handleSuccess = () => {
    refetchAssets();
    refetchShares();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-64 rounded bg-surface-200 dark:bg-surface-800" />
          <div className="h-64 rounded-xl bg-surface-200 dark:bg-surface-800" />
        </div>
      </div>
    );
  }

  if (!basket) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Basket not found
          </h1>
          <Link href="/baskets">
            <Button variant="outline" className="mt-4">
              Back to Baskets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Link
        href="/baskets"
        className="mb-6 inline-flex items-center text-sm text-surface-500 hover:text-primary-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Baskets
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                {basket.name}
              </h1>
              <Badge className={getRiskBadgeColor(basket.risk_level)}>
                {basket.risk_level || "Medium"} Risk
              </Badge>
            </div>
            <p className="mt-2 text-lg text-surface-600 dark:text-surface-400">
              {basket.description}
            </p>
            <div className="mt-4 flex items-center space-x-4 text-sm text-surface-500">
              <span className="flex items-center">
                <TrendingUp className="mr-1 h-4 w-4" />
                {getCategoryLabel(basket.category)}
              </span>
              <span className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                Monthly Rebalance
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Total Value Locked
                </p>
                <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">
                  {totalAssets !== undefined
                    ? formatUSDC(totalAssets)
                    : basket.tvl_usdc > 0
                    ? formatUSDC(basket.tvl_usdc * 1e6)
                    : "$0.00"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Your Shares
                </p>
                <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">
                  {userShares !== undefined
                    ? formatTokenAmount(userShares, 6)
                    : "0.00"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  Your Value
                </p>
                <p className="mt-1 text-2xl font-bold text-surface-900 dark:text-white">
                  {userAssets !== undefined ? formatUSDC(userAssets) : "$0.00"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Composition */}
          <Card>
            <CardHeader>
              <CardTitle>Basket Composition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {basket.tokens.map((token, index) => {
                  const colors = [
                    "bg-primary-500",
                    "bg-accent-500",
                    "bg-green-500",
                    "bg-yellow-500",
                    "bg-orange-500",
                    "bg-red-500",
                    "bg-indigo-500",
                  ];
                  return (
                    <div key={token.symbol} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              colors[index % colors.length]
                            }`}
                          />
                          <div>
                            <p className="font-medium text-surface-900 dark:text-white">
                              {token.symbol}
                            </p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">
                              {token.name}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-semibold text-surface-900 dark:text-white">
                          {formatWeight(token.weight)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-100 dark:bg-surface-800">
                        <div
                          className={`h-full rounded-full ${
                            colors[index % colors.length]
                          }`}
                          style={{ width: `${token.weight / 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Deposit/Withdraw */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {/* Tab Buttons */}
              <div className="mb-6 flex rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
                <button
                  onClick={() => setActiveTab("deposit")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "deposit"
                      ? "bg-white text-surface-900 shadow dark:bg-surface-700 dark:text-white"
                      : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                  }`}
                >
                  Deposit
                </button>
                <button
                  onClick={() => setActiveTab("withdraw")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "withdraw"
                      ? "bg-white text-surface-900 shadow dark:bg-surface-700 dark:text-white"
                      : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                  }`}
                >
                  Withdraw
                </button>
              </div>

              {activeTab === "deposit" ? (
                <DepositForm
                  basketId={basketId}
                  vaultAddress={vaultAddress}
                  onSuccess={handleSuccess}
                />
              ) : (
                <WithdrawForm
                  basketId={basketId}
                  vaultAddress={vaultAddress}
                  vaultSymbol={vaultSymbol as string}
                  onSuccess={handleSuccess}
                />
              )}
            </CardContent>
          </Card>

          {/* Auto-Invest CTA */}
          <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-accent-50 dark:border-primary-800 dark:from-primary-900/20 dark:to-accent-900/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
                  <Repeat className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">
                    EchoPay Auto-Invest
                  </h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400">
                    Set up recurring investments
                  </p>
                </div>
              </div>
              <Link href={`/plans/new?basket=${basketId}`}>
                <Button variant="accent" className="mt-4 w-full">
                  Set Up Auto-Invest
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

