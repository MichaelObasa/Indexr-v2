# Indexr Frontend

Non-custodial crypto baskets with recurring investments. Built with Next.js 14, wagmi, and RainbowKit.

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- Contract addresses (after deployment)
- Supabase credentials (after setup)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── baskets/       # Basket endpoints
│   │   ├── plans/         # EchoPay plan endpoints
│   │   └── cron/          # Scheduler endpoints
│   ├── baskets/           # Basket pages
│   ├── dashboard/         # Portfolio dashboard
│   ├── faucet/            # Test USDC faucet
│   ├── plans/             # EchoPay plans
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── baskets/          # Basket-specific components
│   ├── layout/           # Header, Footer
│   ├── providers/        # Context providers
│   └── ui/               # Reusable UI components
└── lib/                   # Utilities and configs
    ├── contracts.ts      # Contract ABIs & addresses
    ├── supabase.ts       # Database client
    ├── utils.ts          # Helper functions
    └── wagmi.ts          # Wallet configuration
```

## Features

- **Baskets**: Browse and invest in curated crypto baskets
- **Deposit/Withdraw**: Interact with ERC-4626 vault contracts
- **Dashboard**: View portfolio holdings across all baskets
- **EchoPay**: Set up recurring investments
- **Faucet**: Get test USDC on Arbitrum Sepolia

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Wallet**: wagmi v2 + viem + RainbowKit
- **Database**: Supabase (PostgreSQL)
- **Chain**: Arbitrum Sepolia (testnet)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

The cron job for EchoPay execution is configured in `vercel.json`.

### Manual Build

```bash
npm run build
npm start
```

## Development

### Adding a New Basket

1. Deploy a new BasketVault contract
2. Register it in BasketRegistry
3. Add to Supabase `baskets` table
4. Update `CONTRACTS.VAULTS` in `lib/contracts.ts`

### Updating Contract ABIs

ABIs are stored in `lib/contracts.ts`. Update the const arrays when contract interfaces change.

## License

MIT
