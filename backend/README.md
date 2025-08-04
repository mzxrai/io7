# io7 Backend

## Setup

```bash
# Install git hooks (required)
./setup-hooks.sh

# Start server (migrations run automatically)
cargo run
```

## Git Hooks

Pre-commit hook runs `cargo sqlx prepare` to keep compile-time SQL checks in sync.