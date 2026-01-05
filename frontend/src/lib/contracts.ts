// Contract addresses - UPDATE AFTER DEPLOYMENT
export const CONTRACTS = {
  // Arbitrum Sepolia (Chain ID: 421614)
  421614: {
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0000000000000000000000000000000000000000",
    REGISTRY: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x0000000000000000000000000000000000000000",
    ECHOPAY: process.env.NEXT_PUBLIC_ECHOPAY_ADDRESS || "0x0000000000000000000000000000000000000000",
    VAULTS: {
      "INDXR-10": process.env.NEXT_PUBLIC_INDXR10_VAULT || "0x0000000000000000000000000000000000000000",
      "INDXR-AI": process.env.NEXT_PUBLIC_INDXRAI_VAULT || "0x0000000000000000000000000000000000000000",
    },
  },
} as const;

// Default to Arbitrum Sepolia
export const DEFAULT_CHAIN_ID = 421614;

// Get contracts for current chain
export function getContracts(chainId: number = DEFAULT_CHAIN_ID) {
  return CONTRACTS[chainId as keyof typeof CONTRACTS] || CONTRACTS[421614];
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

