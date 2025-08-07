-- Migration to change stats structure from votes to downvotes
-- This updates existing records to use upvotes and downvotes instead of upvotes and votes

-- Update existing stats JSON to replace 'votes' with 'downvotes'
-- Calculate downvotes as (votes - upvotes) for existing records
UPDATE agents
SET stats = jsonb_build_object(
    'downloads', COALESCE((stats->>'downloads')::bigint, 0),
    'upvotes', COALESCE((stats->>'upvotes')::bigint, 0),
    'downvotes', GREATEST(0, COALESCE((stats->>'votes')::bigint, 0) - COALESCE((stats->>'upvotes')::bigint, 0))
)
WHERE stats ? 'votes';

-- For any records that don't have votes field, ensure they have the correct structure
UPDATE agents
SET stats = jsonb_build_object(
    'downloads', COALESCE((stats->>'downloads')::bigint, 0),
    'upvotes', COALESCE((stats->>'upvotes')::bigint, 0),
    'downvotes', COALESCE((stats->>'downvotes')::bigint, 0)
)
WHERE NOT (stats ? 'votes');