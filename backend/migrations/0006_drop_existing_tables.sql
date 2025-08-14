-- Drop all existing tables to start fresh for KV store implementation
-- This migration cleans up the previous agent marketplace schema

-- Drop triggers first (dependencies)
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS agents CASCADE;

-- Drop any remaining indexes (should cascade with table drops, but being explicit)
DROP INDEX IF EXISTS idx_agents_name;
DROP INDEX IF EXISTS idx_agents_public_id;
