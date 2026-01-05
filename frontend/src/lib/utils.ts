import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format address for display (0x1234...5678)
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Format USDC amount (6 decimals)
export function formatUSDC(amount: bigint | number, decimals = 2): string {
  const value = typeof amount === "bigint" ? Number(amount) / 1e6 : amount / 1e6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Parse USDC input to bigint (6 decimals)
export function parseUSDC(amount: string | number): bigint {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.floor(value * 1e6));
}

// Format token amount with decimals
export function formatTokenAmount(
  amount: bigint | number,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  const divisor = 10 ** decimals;
  const value = typeof amount === "bigint" ? Number(amount) / divisor : amount / divisor;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  });
}

// Format percentage from basis points (100 = 1%)
export function formatBasisPoints(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

// Format weight for display
export function formatWeight(weight: number): string {
  return `${(weight / 100).toFixed(0)}%`;
}

// Get category display name
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    classic: "Classic",
    thematic: "Thematic",
    specialty: "Specialty",
  };
  return labels[category] || category;
}

// Get risk level color
export function getRiskColor(risk: string | null): string {
  const colors: Record<string, string> = {
    low: "text-green-500",
    medium: "text-yellow-500",
    high: "text-red-500",
  };
  return colors[risk || "medium"] || "text-gray-500";
}

// Get risk level badge color
export function getRiskBadgeColor(risk: string | null): string {
  const colors: Record<string, string> = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };
  return colors[risk || "medium"] || "bg-gray-100 text-gray-800";
}

// Calculate next run date based on frequency
export function getNextRunDate(frequency: "weekly" | "biweekly" | "monthly"): Date {
  const now = new Date();
  switch (frequency) {
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "biweekly":
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case "monthly":
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    default:
      return now;
  }
}

// Get frequency in seconds
export function getFrequencySeconds(frequency: "weekly" | "biweekly" | "monthly"): number {
  switch (frequency) {
    case "weekly":
      return 7 * 24 * 60 * 60;
    case "biweekly":
      return 14 * 24 * 60 * 60;
    case "monthly":
      return 30 * 24 * 60 * 60;
    default:
      return 30 * 24 * 60 * 60;
  }
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
  const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));

  if (diff > 0) {
    // Future
    if (days > 0) return `in ${days} day${days > 1 ? "s" : ""}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? "s" : ""}`;
    return "soon";
  } else {
    // Past
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return "just now";
  }
}

