-- Create agents table with stats stored as JSON
CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    public_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    stats JSON NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);

-- Create index on public_id for API lookups
CREATE INDEX IF NOT EXISTS idx_agents_public_id ON agents(public_id);

-- Create trigger to update updated_at on changes
DROP TRIGGER IF EXISTS update_agents_updated_at;
CREATE TRIGGER update_agents_updated_at
    AFTER UPDATE ON agents
    FOR EACH ROW
BEGIN
    UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;