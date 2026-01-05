"use client";

import { useEffect, useState } from "react";
import { Boxes, TrendingUp, Shield } from "lucide-react";
import { BasketCard } from "@/components/baskets/BasketCard";
import { getBaskets, Basket } from "@/lib/supabase";

export default function BasketsPage() {
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchBaskets() {
      const data = await getBaskets();
      setBaskets(data);
      setLoading(false);
    }
    fetchBaskets();
  }, []);

  const filteredBaskets = filter === "all" 
    ? baskets 
    : baskets.filter(b => b.category === filter);

  const categories = [
    { id: "all", label: "All Baskets", icon: Boxes },
    { id: "classic", label: "Classic", icon: Shield },
    { id: "thematic", label: "Thematic", icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
          Crypto Baskets
        </h1>
        <p className="mt-2 text-lg text-surface-600 dark:text-surface-400">
          Diversified crypto portfolios. One-click investing. No guesswork required.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`flex items-center space-x-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === cat.id
                  ? "bg-primary-500 text-white"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Baskets Grid */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-xl bg-surface-200 dark:bg-surface-800"
            />
          ))}
        </div>
      ) : filteredBaskets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50 p-12 text-center dark:border-surface-700 dark:bg-surface-900">
          <Boxes className="mx-auto h-12 w-12 text-surface-400" />
          <h3 className="mt-4 text-lg font-medium text-surface-900 dark:text-white">
            No baskets found
          </h3>
          <p className="mt-2 text-surface-500 dark:text-surface-400">
            {filter !== "all" 
              ? "Try selecting a different category"
              : "Baskets will appear here once deployed"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBaskets.map((basket) => (
            <BasketCard key={basket.id} basket={basket} />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 p-8 dark:from-primary-900/20 dark:to-accent-900/20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
            How Indexr Works
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                1
              </div>
              <h3 className="mt-4 font-semibold text-surface-900 dark:text-white">
                Choose a Basket
              </h3>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
                Pick from curated baskets like Top 10, AI Projects, or DeFi leaders
              </p>
            </div>
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                2
              </div>
              <h3 className="mt-4 font-semibold text-surface-900 dark:text-white">
                Deposit USDC
              </h3>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
                Connect your wallet and deposit any amount of USDC
              </p>
            </div>
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                3
              </div>
              <h3 className="mt-4 font-semibold text-surface-900 dark:text-white">
                Earn Vault Shares
              </h3>
              <p className="mt-2 text-sm text-surface-600 dark:text-surface-400">
                Get vault tokens representing your share of the basket
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

