export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
export const SUPPORTED_CHAIN_ID = 421614;
export const SUPPORTED_BASKET_IDS = ["INDXR-10", "INDXR-BAE"] as const;

export type SupportedBasketId = (typeof SUPPORTED_BASKET_IDS)[number];

// Contract addresses - UPDATE AFTER DEPLOYMENT
export const CONTRACTS = {
  // Arbitrum Sepolia (Chain ID: 421614)
  [SUPPORTED_CHAIN_ID]: {
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || ZERO_ADDRESS,
    REGISTRY: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || ZERO_ADDRESS,
    ECHOPAY: process.env.NEXT_PUBLIC_ECHOPAY_ADDRESS || ZERO_ADDRESS,
    VAULTS: {
      "INDXR-10": process.env.NEXT_PUBLIC_INDXR10_VAULT || ZERO_ADDRESS,
      "INDXR-BAE": process.env.NEXT_PUBLIC_INDXRBAE_VAULT || ZERO_ADDRESS,
    },
  },
} as const;

// Default to Arbitrum Sepolia
export const DEFAULT_CHAIN_ID = SUPPORTED_CHAIN_ID;

// Get contracts for current chain
export function getContracts(chainId: number = DEFAULT_CHAIN_ID) {
  return CONTRACTS[chainId as keyof typeof CONTRACTS] || CONTRACTS[SUPPORTED_CHAIN_ID];
}

export function isSupportedChain(chainId?: number): chainId is typeof SUPPORTED_CHAIN_ID {
  return chainId === SUPPORTED_CHAIN_ID;
}

export function isSupportedBasketId(basketId: string): basketId is SupportedBasketId {
  return (SUPPORTED_BASKET_IDS as readonly string[]).includes(basketId);
}

export function isZeroAddress(address?: string | null) {
  return !address || address.toLowerCase() === ZERO_ADDRESS;
}

export function isConfiguredAddress(address?: string | null): address is `0x${string}` {
  if (!address) {
    return false;
  }

  return /^0x[a-fA-F0-9]{40}$/.test(address) && !isZeroAddress(address);
}

export function getConfiguredVaultAddress(
  basketId: SupportedBasketId,
  chainId: number = DEFAULT_CHAIN_ID
) {
  const vaultAddress = getContracts(chainId).VAULTS[basketId];
  return isConfiguredAddress(vaultAddress) ? vaultAddress : null;
}

export function getRequiredVaultEnvVar(basketId: SupportedBasketId) {
  return basketId === "INDXR-10"
    ? "NEXT_PUBLIC_INDXR10_VAULT"
    : "NEXT_PUBLIC_INDXRBAE_VAULT";
}

// ABI Fragments for contract interactions
export const USDC_ABI = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const BASKET_VAULT_ABI = [
  {
    inputs: [{ name: "assets", type: "uint256" }, { name: "receiver", type: "address" }],
    name: "deposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "shares", type: "uint256" }, { name: "receiver", type: "address" }, { name: "owner", type: "address" }],
    name: "redeem",
    outputs: [{ name: "assets", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "assets", type: "uint256" }, { name: "receiver", type: "address" }, { name: "owner", type: "address" }],
    name: "withdraw",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "assets", type: "uint256" }],
    name: "convertToShares",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "shares", type: "uint256" }],
    name: "convertToAssets",
    outputs: [{ name: "assets", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "asset",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBasketId",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isPaused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ECHOPAY_ABI = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "vault", type: "address" },
      { name: "amountPerRun", type: "uint256" },
      { name: "monthlyCap", type: "uint256" },
      { name: "firstRun", type: "uint64" },
      { name: "frequency", type: "uint32" },
    ],
    name: "createPlan",
    outputs: [{ name: "planId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "planId", type: "uint256" }],
    name: "pausePlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "planId", type: "uint256" }],
    name: "cancelPlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "planId", type: "uint256" }],
    name: "execute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "plans",
    outputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "vault", type: "address" },
      { name: "amountPerRun", type: "uint256" },
      { name: "monthlyCap", type: "uint256" },
      { name: "nextRun", type: "uint64" },
      { name: "frequency", type: "uint32" },
      { name: "active", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextPlanId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const BASKET_REGISTRY_ABI = [
  {
    inputs: [{ name: "basketId", type: "string" }],
    name: "getBasketById",
    outputs: [
      {
        components: [
          { name: "basketId", type: "string" },
          { name: "vault", type: "address" },
          { name: "tokens", type: "address[]" },
          { name: "targetWeightsBps", type: "uint256[]" },
          { name: "active", type: "bool" },
          { name: "category", type: "uint8" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBasketCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getBasketAtIndex",
    outputs: [
      {
        components: [
          { name: "basketId", type: "string" },
          { name: "vault", type: "address" },
          { name: "tokens", type: "address[]" },
          { name: "targetWeightsBps", type: "uint256[]" },
          { name: "active", type: "bool" },
          { name: "category", type: "uint8" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "basketId", type: "string" }],
    name: "getVault",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "basketId", type: "string" }],
    name: "isBasketActive",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

