-- Seed initial baskets data
-- Update vault_address values after contract deployment

INSERT INTO baskets (id, name, description, vault_address, category, risk_level, tokens) VALUES
(
    'INDXR-10',
    'Indexr Top 10',
    'Top 10 cryptocurrencies by market capitalization. A classic, diversified approach to crypto investing.',
    '0x0000000000000000000000000000000000000000', -- UPDATE AFTER DEPLOYMENT
    'classic',
    'medium',
    '[
        {"symbol": "WBTC", "name": "Wrapped Bitcoin", "weight": 3500},
        {"symbol": "WETH", "name": "Wrapped Ether", "weight": 3000},
        {"symbol": "ARB", "name": "Arbitrum", "weight": 1500},
        {"symbol": "LINK", "name": "Chainlink", "weight": 1000},
        {"symbol": "UNI", "name": "Uniswap", "weight": 1000}
    ]'::jsonb
),
(
    'INDXR-AI',
    'Indexr AI Projects',
    'Leading AI and machine learning crypto projects. Higher risk, higher potential reward.',
    '0x0000000000000000000000000000000000000000', -- UPDATE AFTER DEPLOYMENT
    'thematic',
    'high',
    '[
        {"symbol": "RENDER", "name": "Render Network", "weight": 2500},
        {"symbol": "FET", "name": "Fetch.ai", "weight": 2500},
        {"symbol": "OCEAN", "name": "Ocean Protocol", "weight": 2000},
        {"symbol": "AGIX", "name": "SingularityNET", "weight": 1500},
        {"symbol": "TAO", "name": "Bittensor", "weight": 1500}
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    tokens = EXCLUDED.tokens,
    risk_level = EXCLUDED.risk_level,
    updated_at = NOW();

