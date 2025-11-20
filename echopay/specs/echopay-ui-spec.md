# EchoPay UI Specification

Version: v1  
Purpose: Define frontend flows for creating and managing auto-invest plans.

## 1. Placement in Indexr

EchoPay shows up in:

### A) Fund Page (INDXR-10, INDXR-20, etc.)

Add a button:

"Auto-invest with EchoPay"

Opens modal to create a plan.

### B) User Dashboard

New tab:

"My Auto-Invest Plans"

Shows all plans and their statuses.

### C) Activity Tab

Shows past executions:

- date
- amount
- tx hash
- status

## 2. Create Plan Flow (Modal)

### Step 1 — User Input

Fields:

- amountPerRun (USDC)
- frequency (weekly, monthly)
- firstRunDate
- monthlyCap (default 1.25 × amountPerRun)
- expiry (optional)

### Step 2 — Approval

If user has not approved USDC allowance:

- Prompt wallet to approve EchoPayPuller
- Use Permit2 to skip approve tx if possible

### Step 3 — Create Plan

Call:

```solidity
puller.createPlan(vaultAddress, amountPerRun, monthlyCap, frequency, firstRun, expiry)
```

### Step 4 — Confirmation UI

Show:

- summary
- nextRun date
- "Manage this plan in your dashboard"

## 3. Manage Plan UI

List of all plans with:

- Fund (e.g. INDXR-10)
- Next run
- Monthly cap usage bar
- amountPerRun
- frequency
- active/paused state

Actions:

- Edit (updatePlan)
- Pause (pausePlan)
- Cancel (cancelPlan)
- Link to revoke.cash for allowance removal

## 4. Activity UI

Fetch from your backend:

- txHash
- timestamp
- amount
- planId

Display in reverse chronological order.

