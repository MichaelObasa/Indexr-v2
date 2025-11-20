# EchoPay – Foundry Module (MVP)

This is a standalone Foundry project for the EchoPay "direct debit for crypto" engine.

## Structure

- `contracts/`
  - `EchoPayPuller.sol` – Core contract for recurring USDC investments into an ERC4626 vault.
  - `mocks/`
    - `MockERC20.sol` – Mintable ERC20 token (USDC-like, 6 decimals).
    - `MockVault.sol` – Simple ERC4626 vault for testing.

- `test/`
  - `EchoPayPuller.t.sol` – Foundry test suite for the EchoPayPuller contract.

## Setup

From the `echopay/` directory:

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
```

## Run tests

```bash
forge test -vv
```

This project is intentionally separate from the main Indexr Foundry setup.

---

## Quick Start

From the repo root:

```bash
cd echopay
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std
forge test -vv
```
