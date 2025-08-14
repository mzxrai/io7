-- Create users table for authentication and API key management
-- This table only exists in io7_live database

CREATE TABLE users (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- GitHub OAuth fields
    github_id BIGINT NOT NULL UNIQUE,
    github_username TEXT NOT NULL,
    github_email TEXT,
    github_avatar_url TEXT,
    
    -- Test Mode API key
    test_api_key_hash TEXT NOT NULL UNIQUE,
    test_api_key_prefix TEXT NOT NULL,  -- "test_io7_xxxx" (first 12 chars)
    
    -- Live Mode API key  
    live_api_key_hash TEXT NOT NULL UNIQUE,
    live_api_key_prefix TEXT NOT NULL,  -- "live_io7_xxxx" (first 12 chars)
    
    -- Schema name (same for both test and live databases)
    schema_name TEXT NOT NULL UNIQUE,  -- "user_{uuid}" format
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Usage tracking (separate for test/live)
    test_request_count BIGINT DEFAULT 0,
    test_storage_bytes BIGINT DEFAULT 0,
    live_request_count BIGINT DEFAULT 0,
    live_storage_bytes BIGINT DEFAULT 0
);

-- Indexes for fast API key lookups
CREATE INDEX idx_users_test_api_key_hash ON users(test_api_key_hash);
CREATE INDEX idx_users_live_api_key_hash ON users(live_api_key_hash);
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_schema_name ON users(schema_name);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at timestamp
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();