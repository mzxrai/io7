-- Add metadata JSON column and display_name to agents table
ALTER TABLE agents 
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{"category": "", "tags": []}',
    ADD COLUMN display_name VARCHAR(255);

-- Update display_name to match name for existing records
UPDATE agents SET display_name = name WHERE display_name IS NULL;

-- Make display_name NOT NULL after setting values
ALTER TABLE agents ALTER COLUMN display_name SET NOT NULL;