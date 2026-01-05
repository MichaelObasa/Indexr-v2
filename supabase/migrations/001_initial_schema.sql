-- Indexr Database Schema
-- Run this in Supabase SQL Editor or via migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- BASKETS TABLE
-- Mirror of on-chain BasketRegistry for fast reads
-- ==============================================
CREATE TABLE IF NOT EXISTS baskets (
    id TEXT PRIMARY KEY,                    -- e.g., "INDXR-10"
    name TEXT NOT NULL,                      -- e.g., "Indexr Top 10"
    description TEXT,
    vault_address TEXT NOT NULL,             -- Contract address
    category TEXT NOT NULL CHECK (category IN ('classic', 'thematic', 'specialty')),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    tokens JSONB NOT NULL DEFAULT '[]',      -- Array of {symbol, name, address, weight}
    active BOOLEAN NOT NULL DEFAULT true,
    tvl_usdc NUMERIC DEFAULT 0,              -- Cached TVL (updated periodically)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_baskets_active ON baskets(active);
CREATE INDEX IF NOT EXISTS idx_baskets_category ON baskets(category);

-- ==============================================
-- ECHO_PLANS TABLE
-- EchoPay recurring investment plans
-- ==============================================
CREATE TABLE IF NOT EXISTS echo_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,            -- User's wallet (checksummed)
    basket_id TEXT NOT NULL REFERENCES baskets(id),
    amount_usdc NUMERIC NOT NULL CHECK (amount_usdc > 0),
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    next_run_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'failed')),
    plan_id_onchain INTEGER,                 -- EchoPayPuller contract plan ID
    total_invested NUMERIC DEFAULT 0,        -- Running total of invested amount
    execution_count INTEGER DEFAULT 0,       -- Number of successful executions
    last_executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for scheduler queries
CREATE INDEX IF NOT EXISTS idx_echo_plans_wallet ON echo_plans(wallet_address);
CREATE INDEX IF NOT EXISTS idx_echo_plans_status ON echo_plans(status);
CREATE INDEX IF NOT EXISTS idx_echo_plans_next_run ON echo_plans(next_run_at) WHERE status = 'active';

-- ==============================================
-- NOTIFICATIONS TABLE
-- Alerts and notifications for users
-- ==============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    plan_id UUID REFERENCES echo_plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('low_balance', 'executed', 'failed', 'paused', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(wallet_address, read) WHERE read = false;

-- ==============================================
-- TRANSACTIONS TABLE (Optional)
-- Log of all deposit/withdraw transactions
-- ==============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL,
    basket_id TEXT NOT NULL REFERENCES baskets(id),
    tx_hash TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'echopay')),
    amount_usdc NUMERIC NOT NULL,
    shares_amount NUMERIC,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    block_number BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_basket ON transactions(basket_id);

-- ==============================================
-- UPDATED_AT TRIGGER
-- Automatically update updated_at on row changes
-- ==============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_baskets_updated_at
    BEFORE UPDATE ON baskets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_echo_plans_updated_at
    BEFORE UPDATE ON echo_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable for production security
-- ==============================================
ALTER TABLE baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE echo_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Public read access for baskets
CREATE POLICY "Baskets are publicly readable"
    ON baskets FOR SELECT
    USING (true);

-- Users can only see their own plans
CREATE POLICY "Users can view own plans"
    ON echo_plans FOR SELECT
    USING (true);  -- We'll filter by wallet in the app

CREATE POLICY "Users can insert own plans"
    ON echo_plans FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own plans"
    ON echo_plans FOR UPDATE
    USING (true);

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (true);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (true);

-- Users can see their own transactions
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert transactions"
    ON transactions FOR INSERT
    WITH CHECK (true);

