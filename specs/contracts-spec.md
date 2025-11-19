# Contracts Specification

This document defines the Solidity smart contracts for Indexr Phase 1, deployed on Arbitrum (testnet → mainnet).

## Overview

Phase 1 contracts include:
- `BasketVault` - ERC-4626-style vault for each basket
- `BasketRegistry` - Central registry of all Indexr baskets
- `OracleAdapter` - Price feed adapter for Chainlink/Pyth
- (Optional) Access control / Locker contracts

All contracts are non-custodial, USDC-centric, and designed for rules-based rebalancing.

## Sections

### TODO: BasketVault Contract
- [ ] ERC-4626 compliance
- [ ] USDC deposit/withdraw functions
- [ ] Vault token (ERC-20) minting/burning
- [ ] Rebalancer role and access control
- [ ] DEX integration for swaps
- [ ] Target weights management
- [ ] Rebalance execution logic

### TODO: BasketRegistry Contract
- [ ] Basket metadata storage
- [ ] Registration/update functions
- [ ] Query functions for frontend/backend
- [ ] Status management (active/inactive)

### TODO: OracleAdapter Contract
- [ ] Chainlink price feed integration
- [ ] Pyth price feed integration
- [ ] Unified price interface
- [ ] Fallback mechanisms

### TODO: Access Control
- [ ] Role-based access (rebalancer, admin)
- [ ] Multi-sig integration considerations
- [ ] Upgradeability patterns (if needed)

### TODO: Testing Strategy
- [ ] Unit tests for each contract
- [ ] Integration tests
- [ ] Fork tests on Arbitrum testnet
- [ ] Gas optimization considerations

### TODO: Deployment Plan
- [ ] Testnet deployment scripts
- [ ] Mainnet deployment checklist
- [ ] Verification steps

