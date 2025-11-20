# Indexr & EchoPay – Architecture

> Phase 1 scope:  

> - Single chain: **Arbitrum** (testnet → mainnet)  
> - Single base asset: **USDC**  
> - Non-custodial, permissionless, no KYC  
> - Simple, rules-based baskets (Core)  

> - EchoPay v1: **crypto-only recurring investing from wallet**, no fiat pulls

## 1. High-Level Overview

Indexr is a **non-custodial, on-chain basket protocol** that lets users invest into themed crypto baskets (e.g. "Top 10", "AI", "DeFi") via smart contracts.

EchoPay is the **recurring investing engine** that sits behind Indexr. It:

- Stores user auto-invest plans (amount, frequency, target basket)

- Periodically checks wallet balances

- Triggers deposits into Indexr baskets when funds are available

- Sends reminders when funds are missing

Everything in Phase 1 is:

- **On-chain first**: deposits, withdrawals, and rebalancing are handled via smart contracts on Arbitrum.
- **Non-custodial**: users always interact from their own wallets.
- **USDC-centric**: all deposits into baskets are in USDC to keep logic simple and predictable.
- **Oracles + DEX**: on-chain price feeds (Pyth / Chainlink) + DEX routes (e.g. Uniswap on Arbitrum) are used for rebalancing.

## 2. Core Principles

1. **Non-custodial**
   - Indexr and EchoPay never hold user funds or private keys.
   - All assets sit in **basket vault contracts** on Arbitrum.
   - Users always transact from their own wallets (MetaMask, WalletConnect).

2. **Baskets, not "funds"**
   - We call them **"baskets"** or **"vaults"**, not regulated "funds".
   - Each basket is a smart-contract vault that holds a curated list of ERC-20 tokens.

3. **USDC in, vault token out**
   - Users deposit **USDC** and receive **vault shares** (ERC-20 receipt token).
   - Vault token represents proportional ownership of the underlying basket.

4. **Rules-based, transparent logic**
   - Core baskets rebalance on a **schedule** and/or **deviation triggers** (e.g. if weight deviates by >5%).
   - All rules are codified in contracts + off-chain rebalancer bot; no manual intervention.

5. **EchoPay as a pure automation layer**
   - EchoPay only:
     - Stores plans
     - Checks balances
     - Triggers contract calls
     - Sends notifications
   - It never takes custody or acts as an exchange.

6. **Phase 1: no fiat, no VRP/Open Banking**
   - EchoPay v1 assumes users already hold USDC in their wallet.
   - Fiat onramps / Open Banking / VRP are Phase 2/3, out of scope for this architecture.

## 3. System Components

### 3.1 On-Chain Contracts (Solidity)

_All contracts deployed to **Arbitrum** (testnet then mainnet)._

#### 3.1.1 `BasketVault` (ERC-4626-style vault)

One instance per basket (e.g. `INDXR10Vault`, `INDXRAIVault`).

Responsibilities:

- Accept **USDC deposits**
- Mint **vault tokens** (ERC-20) to depositor
- Hold underlying basket tokens (e.g. WBTC, WETH, OP, ARB, etc.)
- Provide `deposit`, `withdraw`, `totalAssets`, `convertToShares`, `convertToAssets`
- Allow **rebalancer** to:
  - Sell/buy underlying tokens via a DEX router
  - Update target weights

Key functions (conceptual):

```solidity

function deposit(uint256 assets, address receiver) external returns (uint256 shares);
function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
// Admin / Rebalancer
function setTargetWeights(TokenWeight[] calldata newWeights) external onlyRebalancer;
function executeRebalance(RebalanceAction[] calldata actions) external onlyRebalancer;
```

Notes:
- Under the hood, `executeRebalance` will use a DEX router (e.g. Uniswap V3) to swap tokens.
- Access is controlled via a rebalancer role (EIP-173 owner or AccessControl role).

#### 3.1.2 `BasketRegistry`

Central registry of all Indexr baskets.

Responsibilities:

- Store metadata for each basket:
  - Basket ID (e.g. `INDXR-10`, `INDXR-AI`)
  - Vault contract address
  - Status (active/inactive)
  - Target weights
- Provide read functions for frontend / backend:

```solidity
struct BasketInfo {
  string basketId;
  address vault;
  address[] tokens;
  uint256[] targetWeightsBps; // basis points
  bool active;
}

function getBasketById(string calldata basketId) external view returns (BasketInfo memory);
function listBaskets() external view returns (BasketInfo[] memory);
```

#### 3.1.3 `OracleAdapter`

Thin adapter over Chainlink/Pyth price feeds.

Responsibilities:

- Expose `getPrice(token)` in a consistent format
- Internally read from:
  - Chainlink for large caps where available
  - Pyth for broader coverage and long-tail tokens

Conceptually:

```solidity
function getPrice(address token) external view returns (uint256 priceUsd, uint8 decimals);
```

This is used by:
- The rebalancer bot for off-chain calculations (can also be called off-chain via RPC)
- Potential on-chain sanity checks in `BasketVault` (optional)

#### 3.1.4 (Optional) Locker / Access Control Contract

If you want a "locker architecture" to separate protocol control from dev keys, you can have a:

- `ProtocolController` or `Locker` contract that owns:
  - `BasketRegistry`
  - `BasketVaults` (or their upgrade proxies)

- Uses:
  - Multi-sig
  - Timelock

For Phase 1, this can be simplified to:
- Owner = EOAs or a multi-sig with a simple upgrade plan.

### 3.2 Off-Chain Services

Implemented in TypeScript/Node.js, deployed as serverless functions (e.g. Vercel / Netlify) or a small Node service.

#### 3.2.1 Backend API (`/api`)

Responsibilities:
- Provide REST endpoints for:
  - Listing baskets (proxying on-chain data)
  - Fetching basket details (tokens, weights, performance)
  - Creating EchoPay plans
  - Listing / editing / pausing EchoPay plans
  - Webhook endpoints for notifications (if needed)

Example routes:
- `GET /api/baskets` → list of all baskets
- `GET /api/baskets/:id` → details for a specific basket
- `POST /api/echopay/plans` → create plan
- `GET /api/echopay/plans/:wallet` → all plans for wallet
- `PATCH /api/echopay/plans/:id` → pause/update

Backend is stateless except for DB access.

#### 3.2.2 Database (Supabase/Postgres or MongoDB)

Stores only non-sensitive metadata, never private keys.

Tables/collections:

**`baskets`** (optional mirror of on-chain registry)

- `id` (e.g. "INDXR-10")
- `vaultAddress`
- `tokens[]`
- `targetWeightsBps[]`
- `riskLabel` ("low" | "medium" | "high")
- `category` ("classic" | "thematic" | "specialty")

**`echo_plans`**

- `id` (UUID)
- `walletAddress` (string)
- `basketId` (e.g. "INDXR-BAE")
- `token` (e.g. "USDC")
- `amount` (number, in smallest units or decimals)
- `frequency` ("weekly" | "monthly" | "custom")
- `nextRunAt` (timestamp)
- `status` ("active" | "paused" | "cancelled" | "failed")
- `createdAt`, `updatedAt`

**`notifications`** (optional)

- `planId`
- `type` ("low_balance" | "executed" | "failed")
- `createdAt`

#### 3.2.3 EchoPay Scheduler (Cron / Gelato / Custom Worker)

A small worker service responsible for:

- Running periodically (e.g. every day at 08:00 UTC).
- Finding all EchoPay plans with `nextRunAt <= now` and `status = 'active'`.
- For each plan:
  - Check USDC balance of `walletAddress` on Arbitrum.
  - If `balance ≥ amount`:
    - Trigger deposit into the target `BasketVault` via a transaction.
    - Update `nextRunAt` using frequency logic.
    - Log success; optionally create a "success" notification.

  - If `balance < amount`:
    - Create a "low_balance" notification.
    - Optionally send email via Resend/EmailJS.
    - Optionally keep `nextRunAt` or bump with "grace rules".

Pseudo-code:

```ts
for each plan where nextRunAt <= now and status = 'active':
  const balance = getUsdcBalance(plan.walletAddress)
  if (balance >= plan.amount) {
    // Call basket vault deposit via backend signer or user-signed meta-tx
    await triggerDeposit(plan)
    plan.nextRunAt = computeNextRun(plan.frequency, plan.nextRunAt)
    save(plan)
  } else {
    enqueueNotification(plan, 'low_balance')
  }
```

Note: In Phase 1, we keep this simple. User signs an initial approval for USDC once; the executor can then use that approval to call the deposit on their behalf, or we use a "user-signed intent" pattern with relayers in v2.

#### 3.2.4 Notification Service

Basic email or Telegram notifications.

Tools:
- Resend or EmailJS for email
- Optional Telegram bot for power users

Use cases:
- Plan executed successfully
- Low balance → "Top up USDC to stay on track"
- Plan failed X times → suggest pausing/updating

#### 3.2.5 EchoPay (Phase 1)

EchoPay is an internal module that automates recurring crypto investments into Indexr baskets.

- It is implemented as a separate backend module that:
  - stores user plans (wallet, basket, amount, frequency)
  - runs a scheduler to execute plans when funds are available
  - calls the Indexr vault contracts via a small on-chain client
- Phase 1 is crypto-only:
  - No bank pulls, no Open Banking, no VRP.
  - Users must already hold USDC in their wallet.
- The code should be structured so EchoPay can later be split into its own service/product without rewriting core logic.

### 3.3 Frontend / Client

Built with:

- Next.js (App Router, TypeScript)
- React
- Tailwind CSS
- Wagmi + Viem + RainbowKit for wallet connections
- Optional: Framer for design / marketing pages

Main pages:

**Landing Page**
- Hero: "Invest. Don't Guess."
- CTA: "Explore Baskets" / "Connect Wallet"

**Baskets List**
- Lists all baskets from `BasketRegistry` / `/api/baskets`
- Shows:
  - Name / ID
  - Short description
  - Category (Classic / Thematic / Specialty)
  - Risk label
  - Fee (Core vs Prime)

**Basket Detail Page**

- Displays:
  - Basket composition (tokens + weights)
  - High-level stats (TVL, price per share if computed)
  - Rebalance frequency & rules

- Actions:
  - Connect wallet
  - Deposit USDC → call `deposit` on vault
  - Redeem → call `redeem` on vault

- Reliant on:
  - On-chain data for TVL/allocations
  - CoinGecko API for display-only prices (frontend only, not used by contracts)

**Dashboard (My Portfolio)**

- Shows:
  - Total value across all baskets
  - Per-basket holdings (vault tokens)
  - Execution history (optional)
- Uses on-chain queries via wagmi/viem + backend for history.

**EchoPay Plan Setup UI**
- Accessed from Basket detail ("Auto-Invest" button).
- Form fields:
  - Amount in USDC
  - Frequency (Weekly, Monthly, Custom)
  - Start date

- On submit:
  - Save plan via `POST /api/echopay/plans`
  - Prompt user to approve USDC spend if needed
  - Confirm plan set-up

**EchoPay Plans List**

- "My Auto-Invest Plans"
- Lists all plans for the connected wallet
- Options:
  - Pause / resume
  - Edit amount / frequency
  - Cancel

Frontend does not handle any fiat logic in Phase 1.

## 4. Key Flows

### 4.1 Deposit Flow (USDC → Basket Vault)

1. User connects wallet via RainbowKit.
2. Frontend fetches basket info from `BasketRegistry` / API.
3. User enters deposit amount (e.g. 100 USDC).
4. If no prior approval:
   - Frontend requests `approve( BasketVault, amount )` on USDC.
5. After approval:
   - Frontend calls `deposit(assets, receiver)` on `BasketVault`.
   - `BasketVault` mints vault tokens to user.
   - Frontend updates UI portfolio state.

No swaps needed at deposit time if vault keeps USDC and rebalances later, or vault can swap immediately depending on strategy. For Phase 1, simplest is: deposit USDC → vault holds USDC → rebalancer converts USDC into basket tokens during the next rebalance cycle.

### 4.2 Withdraw Flow (Vault Token → USDC)

1. User chooses basket and clicks "Withdraw".
2. Frontend shows:
   - Max withdrawable
   - Estimate of USDC out
3. Frontend calls `redeem(shares, receiver, owner)` on `BasketVault`.
4. Vault:
   - Sells proportional underlying tokens for USDC (via DEX) or uses USDC liquidity it maintains.
   - Sends USDC back to user.

(Implementation can choose between maintaining a USDC buffer vs. fully invested; Phase 1 can use a "swap-on-withdraw" pattern.)

### 4.3 Core Rebalance Flow (Rules-Based)

Triggered by an off-chain rebalancer bot (Node script / Gelato task).

Bot periodically:

1. Reads current vault holdings via on-chain calls.
2. Fetches target weights from `BasketRegistry`.
3. Fetches token prices via `OracleAdapter` (Chainlink/Pyth) OR off-chain via CoinGecko as a sanity check.
4. Bot calculates:
   - Current weights vs. target weights.
   - Whether any token deviates by more than threshold (e.g. 5%).
5. If yes → builds a list of swap actions (sell over-weight token → buy under-weight token).
6. Bot submits `executeRebalance` to `BasketVault` with a set of actions (paths, min amounts).
7. Vault executes swaps via DEX and updates internal accounting.

Note: Phase 1 can be as simple as "monthly rebalance" without deviation triggers; those can be added later.

### 4.4 EchoPay Plan Creation Flow

1. User goes to a basket page and clicks "Auto-Invest".
2. Frontend shows a modal:
   - Amount in USDC
   - Frequency (Weekly/Monthly)
   - Start date

3. On submit:
   - Frontend calls `POST /api/echopay/plans` with:
     - `walletAddress`
     - `basketId`
     - `amount`
     - `token = "USDC"`
     - `frequency`
     - `startDate`

4. Backend:
   - Validates fields.
   - Sets `nextRunAt = startDate`.
   - Stores record in `echo_plans`.

5. Optionally prompt user for a one-time USDC approval now to reduce friction later.
6. Show confirmation:
   - "You're all set. We'll auto-invest 100 USDC into INDXR-10 every month starting 1st Jan."

### 4.5 EchoPay Plan Execution Flow
Handled entirely by the scheduler:

1. Cron/worker runs daily.
2. Finds all plans with `nextRunAt <= now` and `status = 'active'`.
3. For each plan:
   - Check USDC balance for wallet (via RPC).
   - If `balance ≥ amount`:
     - Trigger deposit flow:
       - Use pre-approved USDC allowance (Phase 1 may use a simple pattern).
       - Call `deposit(amount, walletAddress)` on the vault.
       - Update `nextRunAt` based on frequency.
       - Log success.

   - If `balance < amount`:

     - Create a "low_balance" notification.
     - (Optional) send email with "Top Up" link to an onramp or Bridge.
4. User doesn't need to be online.
5. The plan continues until paused or cancelled.

## 5. External Dependencies & Integrations

**Blockchain**

- Arbitrum (testnet / mainnet)

**Wallets**
- MetaMask
- WalletConnect
- RainbowKit / Wagmi for integration

**DEX**
- Uniswap (or another Arbitrum DEX) for token swaps inside rebalancer / vault

**Oracles**
- Pyth for broad price feeds
- Chainlink for large caps where available

**Price Display (Frontend Only)**
- CoinGecko API (never used in critical on-chain logic)

**Backend Infra**
- Node.js, TypeScript
- Vercel Functions / Netlify / simple Node server
- Supabase or MongoDB for storage

**Notifications**
- Resend / EmailJS

**Scheduler**
- Cron (GitHub Actions, Vercel cron, server cron)
- Or Gelato Network for fully on-chain scheduling in later versions

## 6. Security & Compliance Notes (Phase 1)

- Protocol is non-custodial:
  - No user private keys are ever stored.
  - No fiat is ever touched in Phase 1.
- Baskets are described as:
  - "Themed on-chain baskets" or "vaults"
  - Avoid regulated language like "mutual fund", "ETF", "managed fund"
- KYC/AML:
  - Not implemented in Phase 1.
  - Comparable to Uniswap / Aave / Curve in terms of user access.

## 7. Out of Scope for Phase 1

Explicitly NOT being built now:
- No fiat on-ramps inside EchoPay (users top up USDC manually or via external onramp UI).
- No Open Banking / VRP direct debits.
- No cross-chain baskets.
- No AI Signals Engine logic (only simple, rules-based rebalancing).
- No institutional dashboards.
- No privacy layer (zk/Kilt/etc.) yet – that's Phase 2+.
- No fully general EchoPay SDK for external protocols (Indexr-only integration for now).

## 8. Future Extensions (Notes for Later)
Not needed for Phase 1 implementation, but useful context:

**Phase 2**
- Add on-ramp integration (Coinbase Pay, Transak, etc.) in the UI.
- Add AI-assisted rebalancing for "Prime" baskets.
- Add minimal privacy options (e.g. zk-proof based aliases).
- EchoPay 1.5/2.0: richer plan dashboard, analytics, protocol-agnostic SDK.

**Phase 3**
- VRP/Open Banking integration via regulated partners.
- Multi-chain deployments (Base, Hedera institutional version).
- EchoPay as standalone SaaS/API for other dApps.
- Full privacy + identity stack (zk-KYC, DID, gated products).