"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { Wallet, TrendingUp, PieChart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getBaskets, Basket } from "@/lib/supabase";
import { getContracts, BASKET_VAULT_ABI } from "@/lib/contracts";
import { formatUSDC, formatTokenAmount, formatAddress } from "@/lib/utils";

interface Position {
  basket: Basket;
  shares: bigint;
  value: bigint;
}

export default function DashboardPage() {
  const { address, isConnected, chainId } = useAccount();
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);

  const contracts = getContracts(chainId);

  useEffect(() => {
    async function fetchBaskets() {
      const data = await getBaskets();
      setBaskets(data);
      setLoading(false);
    }
    fetchBaskets();
  }, []);

  // Read balances from all vaults
  const vaultAddresses = baskets.map(
    (b) => b.vault_address || contracts.VAULTS[b.id as keyof typeof contracts.VAULTS]
  ).filter(Boolean);

  const { data: balanceResults } = useReadContracts({
    contracts: vaultAddresses.flatMap((vault) => [
      {
        address: vault as `0x${string}`,
        abi: BASKET_VAULT_ABI,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: vault as `0x${string}`,
        abi: BASKET_VAULT_ABI,
        functionName: "convertToAssets",
        args: [1000000n], // 1 share to get price
      },
    ]),
    query: { enabled: Boolean(address && vaultAddresses.length > 0) },
  });

  // Calculate positions
  const positions: Position[] = baskets
    .map((basket, index) => {
      const balanceIndex = index * 2;
      const priceIndex = index * 2 + 1;
      const shares = balanceResults?.[balanceIndex]?.result as bigint | undefined;
      const pricePerShare = balanceResults?.[priceIndex]?.result as bigint | undefined;

      if (!shares || shares === 0n) return null;

      const value = pricePerShare ? (shares * pricePerShare) / 1000000n : shares;

      return {
        basket,
        shares,
        value,
      };
    })
    .filter((p): p is Position => p !== null);

  const totalValue = positions.reduce((sum, p) => sum + p.value, 0n);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Wallet className="h-8 w-8 text-primary-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-surface-900 dark:text-white">
            Connect Your Wallet
          </h1>
          <p className="mt-2 max-w-md text-surface-600 dark:text-surface-400">
            Connect your wallet to view your portfolio, track your holdings, and manage
            your investments.
          </p>
          <div className="mt-8">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            {formatAddress(address || "")}
          </p>
        </div>
        <Link href="/baskets">
          <Button>
            Explore Baskets
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Portfolio Summary */}
      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  Total Portfolio Value
                </p>
                <p className="mt-2 text-4xl font-bold text-surface-900 dark:text-white">
                  {formatUSDC(totalValue)}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  Active Positions
                </p>
                <p className="mt-2 text-4xl font-bold text-surface-900 dark:text-white">
                  {positions.length}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30">
                <PieChart className="h-7 w-7 text-accent-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-surface-100 dark:bg-surface-800"
                />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="py-12 text-center">
              <PieChart className="mx-auto h-12 w-12 text-surface-300 dark:text-surface-600" />
              <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
                No positions yet
              </h3>
              <p className="mt-2 text-surface-500 dark:text-surface-400">
                Deposit into a basket to start building your portfolio
              </p>
              <Link href="/baskets">
                <Button className="mt-6">Browse Baskets</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {positions.map((position) => (
                <Link
                  key={position.basket.id}
                  href={`/baskets/${position.basket.id}`}
                  className="flex items-center justify-between py-4 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800/50 -mx-2 px-2 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                      <span className="text-sm font-bold text-white">
                        {position.basket.id.split("-")[1]?.slice(0, 2) || "IX"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-surface-900 dark:text-white">
                        {position.basket.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {formatTokenAmount(position.shares, 6)} shares
                        </Badge>
                        <span className="text-sm text-surface-500 dark:text-surface-400">
                          {position.basket.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-surface-900 dark:text-white">
                      {formatUSDC(position.value)}
                    </p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {totalValue > 0n
                        ? `${((Number(position.value) / Number(totalValue)) * 100).toFixed(1)}%`
                        : "0%"}{" "}
                      of portfolio
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 dark:border-primary-800 dark:from-primary-900/20 dark:to-primary-900/10">
          <CardContent className="p-6">
            <h3 className="font-semibold text-surface-900 dark:text-white">
              Set Up Auto-Invest
            </h3>
            <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
              Automate your investments with EchoPay recurring deposits
            </p>
            <Link href="/plans">
              <Button variant="outline" className="mt-4">
                View Plans
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-accent-200 bg-gradient-to-br from-accent-50 to-accent-100 dark:border-accent-800 dark:from-accent-900/20 dark:to-accent-900/10">
          <CardContent className="p-6">
            <h3 className="font-semibold text-surface-900 dark:text-white">
              Get Test USDC
            </h3>
            <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
              Use the faucet to get test USDC on Arbitrum Sepolia
            </p>
            <Link href="/faucet">
              <Button variant="outline" className="mt-4">
                Go to Faucet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

