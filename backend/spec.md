# MVP Rust Backend Requirements

## Implementation Status

### ✅ Completed
- Database architecture (dual database setup)
- Users table with test/live API keys
- Connection pooling (DatabasePools struct)
- UserConnection wrapper for schema isolation
- Health check endpoint
- Migration system

### 🚧 To Implement
- GitHub OAuth flow
- API key generation and validation
- KV operations (PUT, GET, DELETE, pattern queries)
- Transform endpoints with SSE
- Schema provisioning on user signup

## Auth
- `GET /auth/github` - GitHub OAuth flow
- `GET /auth/github/callback` - Create user, provision schemas (test & live)
- `GET /dashboard` - Show API keys (test & live) after auth
- API key validation middleware (detects test/live mode from key prefix)
- Schema isolation per user (separate test/live schemas)
- Test keys: `test_io7_...` prefix (12 char prefix stored)
- Live keys: `live_io7_...` prefix (12 char prefix stored)

## Core KV Operations
- `PUT /kv/:key` - Store JSON value
- `GET /kv/:key` - Retrieve value
- `DELETE /kv/:key` - Delete value
- `GET /kv?pattern=user:*` - Pattern query

## Transform
- `POST /kv/:key/transform` - Single transform (streaming SSE)
- `POST /kv/transform/batch` - Batch transform (array of keys)

## Database Architecture (Implemented)
- PostgreSQL with separate databases for test/live isolation
- Two databases: `io7_test` and `io7_live` (same PG instance)
- Users table in `io7_live` only (single source of truth for auth)
- Schema-per-user within each database
- Auto-provision user schema in both databases on signup
- Two connection pools: test (10 connections), live (40 connections)
- Dynamic pool selection based on API key prefix
- 5-second statement timeout
- Schema naming: `user_{uuid}` (e.g., `user_550e8400e29b41d4a716446655440000`)
- Same schema names across both databases (cleaner isolation)

### Users Table Schema (Implemented)
```sql
users (
    id UUID PRIMARY KEY,
    github_id BIGINT UNIQUE,
    github_username TEXT,
    github_email TEXT,
    github_avatar_url TEXT,
    test_api_key_hash TEXT UNIQUE,
    test_api_key_prefix TEXT,
    live_api_key_hash TEXT UNIQUE,
    live_api_key_prefix TEXT,
    schema_name TEXT UNIQUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    test_request_count BIGINT,
    test_storage_bytes BIGINT,
    live_request_count BIGINT,
    live_storage_bytes BIGINT
)
```

### KV Table Schema (Per User Schema)
```sql
kv_store (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Query Safety (Partially Implemented)
- ✅ `UserConnection` wrapper type that enforces schema setting
- ✅ All operations wrapped in transactions (schema auto-resets)
- ✅ Schema name validation with regex: `^[a-z_][a-z0-9_]{0,62}$`
- 🚧 No raw pool access in handlers (to be enforced)

## Project Structure (Implemented)
```
src/
├── main.rs           # Entry point with health check
├── db/
│   ├── mod.rs       # Database module exports
│   ├── pool.rs      # DatabasePools for dual connections
│   └── user_connection.rs  # UserConnection wrapper
```

## Architecture Details
- **io7_live database**:
  - Contains `users` table (authentication source of truth)
  - Contains production user schemas (`user_{uuid}`)
  - Accessed with `live_io7_` prefixed API keys
  - Runs all migrations
- **io7_test database**:
  - No users table (auth always checks io7_live)
  - Contains test user schemas (`user_{uuid}`)
  - Accessed with `test_io7_` prefixed API keys
  - Can be wiped/reset without affecting production
  - No migrations run on this database

## Security
- All queries use SQLx parameterized queries (except schema names)
- Schema names validated with regex: `^[a-z_][a-z0-9_]{0,62}$`
- Keys allow any characters except control chars (max 256 chars)
- Pattern queries sanitize SQL LIKE special characters
- JSON values handled safely by SQLx/serde_json
- No string concatenation for queries
- Database-level isolation between test and live environments
- API keys stored as hashes (never plaintext)

## API Endpoints

### Implemented
- `GET /health` - Health check with database status

### To Implement
- `GET /auth/github` - Initiate GitHub OAuth
- `GET /auth/github/callback` - Handle OAuth callback
- `GET /dashboard` - User dashboard with API keys
- `PUT /kv/:key` - Store value
- `GET /kv/:key` - Retrieve value
- `DELETE /kv/:key` - Delete value
- `GET /kv` - Pattern query
- `POST /kv/:key/transform` - Transform with SSE
- `POST /kv/transform/batch` - Batch transform