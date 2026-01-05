import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server-side Supabase client
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Mock data fallback
const mockBaskets = [
  {
    id: "INDXR-10",
    name: "Indexr Top 10",
    description: "Top 10 cryptocurrencies by market capitalization",
    vault_address: process.env.NEXT_PUBLIC_INDXR10_VAULT || "0x0000000000000000000000000000000000000000",
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
    vault_address: process.env.NEXT_PUBLIC_INDXRAI_VAULT || "0x0000000000000000000000000000000000000000",
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

export async function GET() {
  try {
    if (!supabase) {
      // Return mock data if Supabase not configured
      return NextResponse.json({ baskets: mockBaskets });
    }

    const { data, error } = await supabase
      .from("baskets")
      .select("*")
      .eq("active", true)
      .order("id");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ baskets: mockBaskets });
    }

    return NextResponse.json({ baskets: data || mockBaskets });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ baskets: mockBaskets });
  }
}

