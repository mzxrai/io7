# MVP Rust Backend Requirements

## Auth
- `GET /auth/github` - GitHub OAuth flow
- `GET /auth/github/callback` - Create user, provision schema
- `GET /dashboard` - Show API key after auth
- API key validation middleware
- Schema isolation per user

## Core KV Operations
- `PUT /kv/:key` - Store JSON value
- `GET /kv/:key` - Retrieve value
- `DELETE /kv/:key` - Delete value
- `GET /kv?pattern=user:*` - Pattern query

## Transform
- `POST /kv/:key/transform` - Single transform (streaming SSE)
- `POST /kv/transform/batch` - Batch transform (array of keys)

## Database
- PostgreSQL with schema-per-user
- Users table for auth/API keys
- Auto-provision schema on signup
- Single connection pool (50 connections)
- Dynamic schema switching per request
- 5-second statement timeout
- Schema naming: `user_{uuid}` (e.g., `user_550e8400e29b41d4a716446655440000`)

## Query Safety
- `UserConnection` wrapper type that enforces schema setting
- All operations wrapped in transactions (schema auto-resets)
- Schema name validation (alphanumeric + underscore only)
- No raw pool access in handlers

## Security
- All queries use SQLx parameterized queries (except schema names)
- Schema names validated with regex: `^[a-z_][a-z0-9_]{0,62}$`
- Keys allow any characters except control chars (max 256 chars)
- Pattern queries sanitize SQL LIKE special characters
- JSON values handled safely by SQLx/serde_json
- No string concatenation for queries