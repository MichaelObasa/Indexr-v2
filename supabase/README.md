# Supabase Setup for Indexr

## Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Note your project URL and anon key from Settings > API

### 2. Run Migrations

1. Go to SQL Editor in your Supabase dashboard
2. Run `migrations/001_initial_schema.sql` first
3. Run `migrations/002_seed_baskets.sql` second

### 3. Update Environment Variables

Add these to your frontend `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Update Basket Addresses

After deploying contracts, update the vault addresses in the `baskets` table:

```sql
UPDATE baskets 
SET vault_address = '0xYOUR_INDXR10_VAULT_ADDRESS' 
WHERE id = 'INDXR-10';

UPDATE baskets 
SET vault_address = '0xYOUR_INDXRAI_VAULT_ADDRESS' 
WHERE id = 'INDXR-AI';
```

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `baskets` | Mirror of on-chain basket registry |
| `echo_plans` | User's recurring investment plans |
| `notifications` | User alerts and notifications |
| `transactions` | Transaction history log |

### Row Level Security

RLS is enabled on all tables. Current policies allow:
- Public read access to baskets
- Users can CRUD their own plans/notifications
- Transactions are insertable by anyone (for backend)

For production, you may want to tighten these policies.

## API Endpoints (via Supabase Client)

```typescript
// Get all baskets
const { data: baskets } = await supabase
  .from('baskets')
  .select('*')
  .eq('active', true);

// Get user's plans
const { data: plans } = await supabase
  .from('echo_plans')
  .select('*')
  .eq('wallet_address', walletAddress);

// Create a new plan
const { data: newPlan } = await supabase
  .from('echo_plans')
  .insert({
    wallet_address: walletAddress,
    basket_id: 'INDXR-10',
    amount_usdc: 100,
    frequency: 'monthly',
    next_run_at: new Date().toISOString()
  })
  .select()
  .single();
```

