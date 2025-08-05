-- Remove metadata and display_name columns from agents table
ALTER TABLE agents 
    DROP COLUMN metadata,
    DROP COLUMN display_name;