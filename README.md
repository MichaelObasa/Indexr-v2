# Indexr v2

**The Vanguard of Web3** — Non-custodial crypto baskets with recurring investments.

Indexr lets users invest into themed crypto baskets (e.g., "Top 10", "AI Projects", "DeFi") via smart contracts on Arbitrum. Users deposit USDC and receive vault tokens representing proportional ownership of the underlying basket.

**EchoPay** is the recurring investing engine that automates periodic deposits into Indexr baskets. Think "Direct Debits for Crypto."

## Quick Start

### Prerequisites
- Node.js 18+
- Foundry (for contracts)
- A wallet with Arbitrum Sepolia ETH

### 1. Deploy Contracts

```bash
cd contracts
# Copy .env and add your private key
forge script script/DeployAll.s.sol:DeployAll --rpc-url $ARBITRUM_SEPOLIA_RPC --broadcast
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations from `supabase/migrations/`
3. Copy credentials to frontend `.env.local`

### 3. Run Frontend

```bash
cd frontend
npm install
# Copy ENV_TEMPLATE.txt to .env.local and fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Repo Layout

```
├── contracts/          # Smart contracts (Solidity/Foundry)
│   ├── src/           # Contract source code
│   │   ├── vaults/    # BasketVault (ERC-4626)
│   │   ├── registry/  # BasketRegistry
│   │   └── mocks/     # MockUSDC for testing
│   ├── test/          # Foundry tests
│   └── script/        # Deployment scripts
├── frontend/          # Next.js 14 dApp
│   ├── src/app/       # Pages and API routes
│   ├── src/components/# React components
│   └── src/lib/       # Utilities and configs
├── echopay/           # EchoPay recurring investment contracts
├── supabase/          # Database migrations
├── deployments/       # Deployed contract addresses
└── specs/             # Design documentation
```

## Features

| Feature | Status |
|---------|--------|
| Basket Vaults (ERC-4626) | ✅ Built & Tested |
| Basket Registry | ✅ Built & Tested |
| EchoPay Contract | ✅ Built & Tested |
| Frontend Dashboard | ✅ Built |
| Deposit/Withdraw UI | ✅ Built |
| EchoPay Plan UI | ✅ Built |
| API Routes | ✅ Built |
| Scheduler Cron | ✅ Built |
| Testnet Deployment | 🔲 Ready to deploy |

## Tech Stack

- **Contracts**: Solidity 0.8.23, Foundry, OpenZeppelin
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Wallet**: wagmi v2, viem, RainbowKit
- **Database**: Supabase (PostgreSQL)
- **Chain**: Arbitrum Sepolia → Mainnet

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and flows
- [contracts/ENV_SETUP.md](./contracts/ENV_SETUP.md) - Deployment guide
- [frontend/README.md](./frontend/README.md) - Frontend setup
- [supabase/README.md](./supabase/README.md) - Database setup
- [specs/](./specs/) - Detailed specifications

## License

MIT

