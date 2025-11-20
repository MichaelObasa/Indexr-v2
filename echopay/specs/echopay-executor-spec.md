# EchoPay Executor Bot Specification

Version: v1  
Purpose: Off-chain scheduler that calls execute(planId) at the right time.

## 1. Overview

EchoPayPuller does not run itself. We need a safe, minimal off-chain process that:

- Identifies due plans
- Verifies eligibility (timestamps + caps)
- Executes eligible plans
- Logs results
- Never holds user funds
- Uses a relayer wallet with ARB for gas

Options:

- Custom Node.js bot (recommended for control)
- Gelato Automation (zero infra)
- Chainlink Automation (robust but more complex)

We will describe the Node.js version.

## 2. Architecture

### Components:

- Node.js runtime
- ethers.js or viem
- RPC provider (Arbitrum)
- .env with:
  - RPC_URL
  - RELAYER_KEY
- Local SQLite or Postgres (optional) to track known planIds
- Cron loop: runs every X minutes

## 3. Bot Flow (Loop)

1. Fetch candidate planIds  
   Options:
   - Scan events PlanCreated / PlanUpdated
   - Query contract for total plans then filter active ones
   - Store planIds locally when created

2. For each candidate planId:

   - Call a view helper (or manually read struct)
   - Check:
     - active?
     - block.timestamp ≥ nextRun?
     - amountPerRun + spentThisPeriod ≤ monthlyCap?
     - expiresAt == 0 OR block.timestamp < expiresAt?

3. If eligible:

   - Send tx: puller.execute(planId)
   - Wait for receipt
   - Log success/failure

4. Sleep 60 seconds and repeat.

## 4. Recommended Helpers

Inside Puller contract, create:

```solidity
function isDue(uint256 planId) external view returns (bool);
```

So bot can cheaply filter.

## 5. Gas Strategy

Bot uses a relayer wallet with small ARB balance.

User does NOT pay gas.  
This is a differentiator and improves UX.

You can optionally:

- track gas spent per user
- charge them later via an "execution fee" field (future version)

## 6. Logging

Log locally:

- timestamp
- planId
- tx hash
- status
- amount invested

This becomes the "Activity" tab in the EchoPay UI.

