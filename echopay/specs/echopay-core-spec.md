# EchoPay Core Specification (Smart Contract Layer)

Version: v1  
Author: Michael Obasa  
Scope: Pure on-chain USDC → Indexr auto-invest engine (no fiat)

## 1. Purpose

EchoPay's core contract ("EchoPayPuller") allows crypto-native recurring investments into Indexr funds without custodial risk.

Users approve USDC once, define a rule ("invest 400 USDC every month"), and EchoPay executes that rule automatically on schedule.

This document describes:
- Storage structures
- Contract responsibilities
- Required functions
- Events
- Constraints & safety rules
- Integration points with Indexr vaults

## 2. High-Level Responsibilities

The Puller contract must:
- Store user auto-invest plans
- Enforce frequency & time rules
- Enforce spending caps
- Pull USDC via transferFrom
- Deposit into the correct Indexr vault
- Update state (spentThisPeriod, nextRun)
- Emit events for the UI and backend
- Protect user funds with strict limits

The contract does NOT:
- Handle GBP/fiat
- Perform token swaps
- Custody user funds (other than momentarily during a pull)
- Run itself — off-chain executor triggers execution

## 3. Data Model

### 3.1 Plan Struct

```solidity
struct Plan {
    address owner; // User wallet
    address token; // USDC address
    address vault; // Indexr vault address
    uint256 amountPerRun; // E.g. 400 USDC
    uint256 monthlyCap; // Max monthly spend
    uint256 spentThisPeriod; // Accumulator
    uint64 nextRun; // Unix timestamp
    uint64 periodId; // Month identifier
    uint32 frequency; // Seconds between runs
    uint64 expiresAt; // Optional expiry
    bool active;
}
```

### 3.2 Storage

```solidity
mapping(uint256 => Plan) public plans;
uint256 public nextPlanId;
```

## 4. Required Functions

### 4.1 createPlan()

Requirements:

- Only plan owner can create
- Values must pass sanity checks:
  - amountPerRun > 0
  - monthlyCap ≥ amountPerRun
  - frequency within allowed range (1 day → 365 days)
- nextRun must be in the future
- Set spentThisPeriod = 0
- Set periodId = currentMonth(block.timestamp)
- Emit PlanCreated

### 4.2 updatePlan()

Editable fields:
- amountPerRun
- monthlyCap
- frequency
- expiresAt

Rules:
- Only owner
- Same sanity checks as createPlan
- Cannot reduce monthlyCap below spentThisPeriod
- Emit PlanUpdated

### 4.3 pausePlan() / cancelPlan()

- Only owner
- pausePlan → active = false but resumable
- cancelPlan → permanently disabled
- Emit PlanPaused / PlanCancelled

### 4.4 execute(planId)

This is the most important function.

Execution flow:
1. Load plan
2. Require active == true
3. Require block.timestamp ≥ nextRun
4. Determine currentMonth()
5. If new month → reset spentThisPeriod, update periodId
6. Require spentThisPeriod + amountPerRun ≤ monthlyCap
7. Pull USDC:
   - IERC20(plan.token).transferFrom(plan.owner, address(this), amountPerRun)
8. Deposit into Indexr vault:
   - IERC4626(plan.vault).deposit(amountPerRun, plan.owner)
9. Update:
   - spentThisPeriod += amountPerRun
   - nextRun += frequency
10. Emit PlanExecuted

### 4.5 Helpers

#### currentMonth(uint256 timestamp)

Simple version:

```solidity
return timestamp / 30 days;
```

### 4.6 Events

```solidity
event PlanCreated(uint256 indexed id, address indexed owner);
event PlanUpdated(uint256 indexed id);
event PlanPaused(uint256 indexed id);
event PlanCancelled(uint256 indexed id);
event PlanExecuted(uint256 indexed id, uint256 amount, uint256 timestamp);
```

## 5. Safety Constraints

- Max amountPerRun (e.g. $10k)
- Max monthlyCap (e.g. $20k)
- frequency ∈ [1 day, 365 days]
- expiresAt optional; if set and timestamp >= expiresAt → block execution
- ReentrancyGuard on execute()
- No delegatecall anywhere
- No external calls except:
  - transferFrom(token)
  - vault.deposit()

## 6. Integration with Indexr

EchoPayPuller interacts with Indexr via the ERC-4626 interface:

```solidity
IERC4626(plan.vault).deposit(amount, receiver);
```

Shares minted go directly to the user.

The vault address can be:

- passed directly into createPlan(), OR
- resolved dynamically via the Registry (optional but slower)

We will store vault addresses directly for simplicity.

