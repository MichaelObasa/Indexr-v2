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

### TODO: EchoPay Scheduler
- [ ] Cron job configuration
- [ ] Plan execution logic
- [ ] Balance checking on Arbitrum
- [ ] Transaction triggering mechanism
- [ ] USDC approval handling
- [ ] Next run date calculation
- [ ] Error handling and retries

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

