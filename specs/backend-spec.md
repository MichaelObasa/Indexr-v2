# Backend Specification

This document describes the Node.js/TypeScript backend services for Indexr, including the REST API, EchoPay scheduler, and database schemas.

## Overview

The backend consists of:
- REST API (`/api`) - Serverless functions or Node service
- EchoPay Scheduler - Cron-based worker for auto-invest plans
- Database - Supabase/Postgres or MongoDB for plan storage
- Notification Service - Email/Telegram notifications

All services are stateless where possible, with database persistence for EchoPay plans and metadata.

## Sections

### TODO: API Endpoints
- [ ] Basket listing and details endpoints
- [ ] EchoPay plan CRUD operations
- [ ] Wallet balance checking utilities
- [ ] Webhook endpoints (if needed)
- [ ] Error handling and validation

### EchoPay Module (internal for now)

- Located under `/backend/echopay` (or similar).
- Responsibilities:
  - CRUD for auto-invest plans (create, list, pause, cancel).
  - Scheduler job that:
    - reads active plans
    - checks USDC balance for each wallet
    - triggers a deposit into the target BasketVault when funds are sufficient
    - records success/failure
  - Notification hooks (e.g. low balance, plan executed).
- It must call a separate on-chain client service, e.g. `IndexrOnchainClient`, instead of talking to contracts directly.
- Phase 1 constraints:
  - No fiat integrations, no Open Banking, no VRP.
  - USDC-only, Arbitrum-only.
- Future requirement:
  - Design the interfaces so this module can be extracted into a standalone EchoPay service in the future.

#### TODO: EchoPay Implementation Details
- [ ] Module structure and organization
- [ ] Plan CRUD API endpoints
- [ ] Scheduler job configuration
- [ ] Balance checking on Arbitrum
- [ ] Integration with IndexrOnchainClient
- [ ] Transaction triggering mechanism
- [ ] USDC approval handling
- [ ] Next run date calculation
- [ ] Error handling and retries
- [ ] Notification hooks implementation

### TODO: Database Schema
- [ ] `baskets` table/collection structure
- [ ] `echo_plans` table/collection structure
- [ ] `notifications` table/collection structure
- [ ] Indexes and query optimization
- [ ] Migration strategy

### TODO: External Integrations
- [ ] Arbitrum RPC connection
- [ ] Wallet balance queries
- [ ] Contract interaction utilities
- [ ] Email service (Resend/EmailJS)
- [ ] Optional Telegram bot

### TODO: Configuration Management
- [ ] Environment variables
- [ ] Chain configuration (testnet/mainnet)
- [ ] Contract addresses
- [ ] API keys and secrets

### TODO: Testing Strategy
- [ ] Unit tests for API endpoints
- [ ] Integration tests for scheduler
- [ ] Database migration tests
- [ ] Mock external services

### TODO: Deployment
- [ ] Serverless function setup (Vercel/Netlify)
- [ ] Cron job deployment (GitHub Actions/server)
- [ ] Database setup and migrations
- [ ] Environment configuration

