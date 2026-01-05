import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Mock data
const mockBaskets: Record<string, object> = {
  "INDXR-10": {
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
  },
  "INDXR-AI": {
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
  },
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const basketId = params.id;

  try {
    if (!supabase) {
      const basket = mockBaskets[basketId];
      if (!basket) {
        return NextResponse.json({ error: "Basket not found" }, { status: 404 });
      }
      return NextResponse.json({ basket });
    }

    const { data, error } = await supabase
      .from("baskets")
      .select("*")
      .eq("id", basketId)
      .single();

    if (error || !data) {
      const mockBasket = mockBaskets[basketId];
      if (mockBasket) {
        return NextResponse.json({ basket: mockBasket });
      }
      return NextResponse.json({ error: "Basket not found" }, { status: 404 });
    }

    return NextResponse.json({ basket: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

