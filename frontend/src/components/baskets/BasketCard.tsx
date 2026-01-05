"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Basket } from "@/lib/supabase";
import { formatUSDC, getCategoryLabel, getRiskBadgeColor, formatWeight } from "@/lib/utils";

interface BasketCardProps {
  basket: Basket;
}

export function BasketCard({ basket }: BasketCardProps) {
  const topTokens = basket.tokens.slice(0, 3);

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800">
      {/* Gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500" />
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
              {basket.name}
            </h3>
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400 line-clamp-2">
              {basket.description}
            </p>
          </div>
          <Badge variant="secondary" className={getRiskBadgeColor(basket.risk_level)}>
            {basket.risk_level || "Medium"} Risk
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Category & TVL */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-500 dark:text-surface-400">
            {getCategoryLabel(basket.category)}
          </span>
          <div className="flex items-center space-x-1 text-surface-600 dark:text-surface-300">
            <TrendingUp className="h-4 w-4" />
            <span>TVL: {formatUSDC(basket.tvl_usdc * 1e6)}</span>
          </div>
        </div>

        {/* Token Composition */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
            Composition
          </p>
          <div className="flex flex-wrap gap-2">
            {topTokens.map((token) => (
              <div
                key={token.symbol}
                className="flex items-center space-x-1 rounded-full bg-surface-100 px-2.5 py-1 text-xs dark:bg-surface-800"
              >
                <span className="font-medium text-surface-700 dark:text-surface-300">
                  {token.symbol}
                </span>
                <span className="text-surface-500 dark:text-surface-400">
                  {formatWeight(token.weight)}
                </span>
              </div>
            ))}
            {basket.tokens.length > 3 && (
              <span className="flex items-center px-2 text-xs text-surface-400">
                +{basket.tokens.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Weight Bar Visualization */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
          <div className="flex h-full">
            {basket.tokens.slice(0, 5).map((token, index) => {
              const colors = [
                "bg-primary-500",
                "bg-accent-500",
                "bg-green-500",
                "bg-yellow-500",
                "bg-orange-500",
              ];
              return (
                <div
                  key={token.symbol}
                  className={colors[index]}
                  style={{ width: `${token.weight / 100}%` }}
                  title={`${token.symbol}: ${formatWeight(token.weight)}`}
                />
              );
            })}
          </div>
        </div>

        {/* Action */}
        <Link href={`/baskets/${basket.id}`}>
          <Button variant="outline" className="w-full group-hover:border-primary-500 group-hover:text-primary-500">
            View Basket
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

