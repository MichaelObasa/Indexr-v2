import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Indexr",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [arbitrumSepolia],
  ssr: true,
});

// Chain configuration
export const SUPPORTED_CHAINS = {
  [arbitrumSepolia.id]: {
    name: "Arbitrum Sepolia",
    shortName: "Arb Sepolia",
    isTestnet: true,
    blockExplorer: "https://sepolia.arbiscan.io",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
  },
} as const;

export function getBlockExplorerUrl(chainId: number, type: "tx" | "address", hash: string) {
  const chain = SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];
  if (!chain) return "";
  return `${chain.blockExplorer}/${type}/${hash}`;
}

