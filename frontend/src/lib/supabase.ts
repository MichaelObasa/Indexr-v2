import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database types
export interface Basket {
  id: string;
  name: string;
  description: string | null;
  vault_address: string;
  category: "classic" | "thematic" | "specialty";
  risk_level: "low" | "medium" | "high" | null;
  tokens: Array<{
    symbol: string;
    name: string;
    weight: number;
    address?: string;
  }>;
  active: boolean;
  tvl_usdc: number;
  created_at: string;
  updated_at: string;
}

export interface EchoPlan {
  id: string;
  wallet_address: string;
  basket_id: string;
  amount_usdc: number;
  frequency: "weekly" | "biweekly" | "monthly";
  next_run_at: string;
  status: "active" | "paused" | "cancelled" | "failed";
  plan_id_onchain: number | null;
  total_invested: number;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  wallet_address: string;
  plan_id: string | null;
  type: "low_balance" | "executed" | "failed" | "paused" | "info";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// API functions
export async function getBaskets(): Promise<Basket[]> {
  if (!supabase) {
    console.warn("Supabase not configured, returning mock data");
    return getMockBaskets();
  }

  const { data, error } = await supabase
    .from("baskets")
    .select("*")
    .eq("active", true)
    .order("id");

  if (error) {
    console.error("Error fetching baskets:", error);
    return getMockBaskets();
  }

  return data || [];
}

export async function getBasketById(id: string): Promise<Basket | null> {
  if (!supabase) {
    return getMockBaskets().find((b) => b.id === id) || null;
  }

  const { data, error } = await supabase
    .from("baskets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching basket:", error);
    return null;
  }

  return data;
}

export async function getPlansForWallet(walletAddress: string): Promise<EchoPlan[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("echo_plans")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }

  return data || [];
}

export async function createPlan(plan: {
  wallet_address: string;
  basket_id: string;
  amount_usdc: number;
  frequency: EchoPlan["frequency"];
  next_run_at: string;
  plan_id_onchain: number;
}): Promise<EchoPlan | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("echo_plans")
    .insert({
      ...plan,
      wallet_address: plan.wallet_address.toLowerCase(),
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating plan:", error);
    return null;
  }

  return data;
}

export async function updatePlanStatus(
  planId: string,
  status: EchoPlan["status"]
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from("echo_plans")
    .update({ status })
    .eq("id", planId);

  if (error) {
    console.error("Error updating plan:", error);
    return false;
  }

  return true;
}

export async function getNotifications(walletAddress: string): Promise<Notification[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("wallet_address", walletAddress.toLowerCase())
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

export async function markNotificationRead(notificationId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  return !error;
}

// Mock data for development without Supabase
function getMockBaskets(): Basket[] {
  return [
    {
      id: "INDXR-10",
      name: "Indexr Top 10",
      description: "Top 10 cryptocurrencies by market capitalization",
      vault_address: "0x0000000000000000000000000000000000000000",
      category: "classic",
      risk_level: "medium",
      tokens: [
        { symbol: "WBTC", name: "Wrapped Bitcoin", weight: 3500 },
        { symbol: "WETH", name: "Wrapped Ether", weight: 3000 },
        { symbol: "ARB", name: "Arbitrum", weight: 1500 },
        { symbol: "LINK", name: "Chainlink", weight: 1000 },
        { symbol: "UNI", name: "Uniswap", weight: 1000 },
      ],
      active: true,
      tvl_usdc: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "INDXR-AI",
      name: "Indexr AI Projects",
      description: "Leading AI and machine learning crypto projects",
      vault_address: "0x0000000000000000000000000000000000000000",
      category: "thematic",
      risk_level: "high",
      tokens: [
        { symbol: "RENDER", name: "Render Network", weight: 2500 },
        { symbol: "FET", name: "Fetch.ai", weight: 2500 },
        { symbol: "OCEAN", name: "Ocean Protocol", weight: 2000 },
        { symbol: "AGIX", name: "SingularityNET", weight: 1500 },
        { symbol: "TAO", name: "Bittensor", weight: 1500 },
      ],
      active: true,
      tvl_usdc: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

