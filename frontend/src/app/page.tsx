"use client";

import Link from "next/link";
import { ArrowRight, Shield, Repeat, PieChart, Zap, Lock, Globe } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-primary-500/10 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-accent-500/10 blur-[120px]" />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
            <Zap className="mr-2 h-4 w-4" />
            Now live on Arbitrum
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-6xl lg:text-7xl">
            Invest.{" "}
            <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Don't Guess.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl text-surface-600 dark:text-surface-400">
            Non-custodial crypto baskets with recurring investments. 
            The Vanguard of Web3 — diversified portfolios, one-click investing, 
            no guesswork required.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/baskets">
              <Button size="xl" variant="accent">
                Explore Baskets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {!isConnected && (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button size="xl" variant="outline" onClick={openConnectModal}>
                    Connect Wallet
                  </Button>
                )}
              </ConnectButton.Custom>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-surface-200 pt-8 dark:border-surface-800">
            <div>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">2+</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Curated Baskets
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">100%</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Non-Custodial
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">$0</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">
                Minimum Investment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-surface-200 bg-surface-50 py-24 dark:border-surface-800 dark:bg-surface-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-surface-900 dark:text-white sm:text-4xl">
              Built for the future of finance
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-600 dark:text-surface-400">
              Everything you need to build wealth in crypto, without the complexity.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-surface-200 bg-white p-8 dark:border-surface-800 dark:bg-surface-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <PieChart className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                Diversified Baskets
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Curated portfolios like Top 10, AI Projects, and DeFi leaders. 
                Automatic rebalancing keeps your allocation on track.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-surface-200 bg-white p-8 dark:border-surface-800 dark:bg-surface-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30">
                <Repeat className="h-6 w-6 text-accent-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                EchoPay Auto-Invest
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Set up recurring investments with a few clicks. Direct debit for 
                crypto — your wealth grows while you sleep.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-surface-200 bg-white p-8 dark:border-surface-800 dark:bg-surface-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <Lock className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                Non-Custodial
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Your keys, your crypto. Assets are held in audited smart contracts 
                on Arbitrum — never in our hands.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-surface-200 bg-white p-8 dark:border-surface-800 dark:bg-surface-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <Zap className="h-6 w-6 text-yellow-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                Low Fees, Fast Transactions
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Built on Arbitrum for lightning-fast transactions at a fraction 
                of the cost. More of your money goes to work.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-surface-200 bg-white p-8 dark:border-surface-800 dark:bg-surface-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Shield className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                Rules-Based Rebalancing
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Transparent, programmable rules. Monthly rebalances keep your 
                portfolio aligned with target weights.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-surface-200 bg-white p-8 dark:border-surface-800 dark:bg-surface-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Globe className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                Global Access
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                No KYC, no borders, no minimums. Anyone with a wallet can 
                participate in the future of finance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-surface-900 dark:text-white sm:text-4xl">
              How Indexr Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-surface-600 dark:text-surface-400">
              Start building your crypto portfolio in minutes.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-2xl font-bold text-white">
                1
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                Connect Your Wallet
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Use MetaMask, WalletConnect, or any compatible wallet. 
                No account creation needed.
              </p>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-2xl font-bold text-white">
                2
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                Choose a Basket
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Pick from curated baskets based on your interests and risk 
                tolerance. Each basket has transparent composition.
              </p>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-2xl font-bold text-white">
                3
              </div>
              <h3 className="mt-6 text-xl font-semibold text-surface-900 dark:text-white">
                Deposit & Earn
              </h3>
              <p className="mt-2 text-surface-600 dark:text-surface-400">
                Deposit USDC and receive vault tokens representing your share. 
                Set up auto-invest to grow passively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-surface-200 dark:border-surface-800">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 p-12 text-center lg:p-20">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to start investing smarter?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Join the future of crypto investing. No minimums, no guesswork, 
              no complexity.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/baskets">
                <Button
                  size="xl"
                  className="bg-white text-primary-600 hover:bg-white/90"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/faucet">
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/50 text-white hover:bg-white/10"
                >
                  Get Test USDC
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

