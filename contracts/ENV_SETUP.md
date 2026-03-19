# Environment Setup for Contract Deployment

## Required Environment Variables

Copy `.env.example` from the repo root to `.env` in the repo root. Fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | Yes | Deployer private key, **no 0x prefix** |
| `ARBITRUM_SEPOLIA_RPC` | Yes | RPC URL, e.g. `https://sepolia-rollup.arbitrum.io/rpc` |
| `ETHERSCAN_API_KEY` | No | Arbiscan API key for `--verify` (omit for first deploy) |

## Deployment Commands

Run from repo root. Ensure `.env` is loaded (see below).

### 1. Deploy Indexr Contracts (MockUSDC, Registry, INDXR-10, INDXR-BAE)

```bash
cd contracts
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  -vvvv
```

Omit `--verify` for first deploy if you don't have `ETHERSCAN_API_KEY` set.

### 2. Deploy EchoPay Contract (after Indexr)

```bash
cd echopay
forge script script/DeployEchoPay.s.sol:DeployEchoPay \
  --rpc-url $ARBITRUM_SEPOLIA_RPC \
  --broadcast \
  -vvvv
```

### Loading .env (Unix / Git Bash)

```bash
export $(grep -v '^#' .env | xargs)
```

### Loading .env (Windows PowerShell)

```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^([^#][^=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
  }
}
```

Or set manually before each deploy:

```powershell
$env:PRIVATE_KEY = "your_key_no_0x"
$env:ARBITRUM_SEPOLIA_RPC = "https://sepolia-rollup.arbitrum.io/rpc"
```

## Getting Test ETH

- Arbitrum Sepolia faucet: https://faucet.quicknode.com/arbitrum/sepolia
- Need ~0.01 ETH for deployment gas

## After Deployment

1. Copy deployed addresses from console output
2. Update `deployments/arbitrum-sepolia.json` with `MockUSDC`, `BasketRegistry`, `INDXR10Vault`, and `INDXRBAEVault`
3. Update `frontend/.env.local` with contract addresses (see `frontend/ENV_TEMPLATE.txt`)
