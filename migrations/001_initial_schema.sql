CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    rapidapi_plan_id VARCHAR(100) NOT NULL UNIQUE,
    monthly_quota INT NOT NULL,
    rate_limit_per_min INT NOT NULL DEFAULT 60,
    price_usd DECIMAL(10, 2) NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rapidapi_user VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
    name VARCHAR(255),
    company VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cancelled', 'past_due')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS api_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INT NOT NULL,
    latency_ms INT,
    request_id VARCHAR(64) NOT NULL UNIQUE,
    plan_name VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year_month CHAR(7) NOT NULL,
    match_calls INT NOT NULL DEFAULT 0,
    total_calls INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, year_month)
);

CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    match_id VARCHAR(64) NOT NULL UNIQUE,
    overall_score INT CHECK (overall_score BETWEEN 0 AND 100),
    response_payload JSONB NOT NULL,
    processing_time_ms INT,
    plan_name VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_requests_created_at ON api_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_api_requests_user_id ON api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_match_results_user_id ON match_results(user_id);
CREATE INDEX IF NOT EXISTS idx_match_results_created_at ON match_results(created_at);

INSERT INTO plans (name, rapidapi_plan_id, monthly_quota, rate_limit_per_min, price_usd, features)
VALUES
    ('basic', 'BASIC', 100, 10, 0, '{"includeExplanation": false, "customWeights": false, "batch": false}'::jsonb),
    ('pro', 'PRO', 2000, 60, 29, '{"includeExplanation": true, "customWeights": true, "batch": false}'::jsonb),
    ('ultra', 'ULTRA', 15000, 120, 99, '{"includeExplanation": true, "customWeights": true, "batch": true}'::jsonb),
    ('mega', 'MEGA', 100000, 300, 299, '{"includeExplanation": true, "customWeights": true, "batch": true, "prioritySupport": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;
