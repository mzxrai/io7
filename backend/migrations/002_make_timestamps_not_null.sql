-- Make timestamps NOT NULL
ALTER TABLE agents 
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;