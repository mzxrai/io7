# Build stage
FROM lukemathwalker/cargo-chef:latest-rust-1.88.0-alpine AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json
# Build application
COPY . .
# Copy the .sqlx directory for compile-time query checking
COPY .sqlx .sqlx
RUN cargo build --release

# Runtime stage
FROM alpine:3.21 AS runtime
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

# Copy the built binary
COPY --from=builder /app/target/release/io7-backend /app/io7-backend

# Copy static files (agent definitions)
COPY agent_files/ /app/agent_files/

# Copy migrations
COPY migrations/ /app/migrations/

# Create data directory for volume mount
RUN mkdir -p /data

# Set environment variables for production
ENV DATABASE_URL=sqlite:/data/app.db
ENV RUST_LOG=info
ENV PORT=8080

# Create entrypoint script - migrations are handled by the Rust app
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Checking database directory..."\n\
# Ensure data directory exists and is writable\n\
mkdir -p /data\n\
chmod 755 /data\n\
echo "Starting application (migrations will run automatically)..."\n\
exec ./io7-backend' > /app/entrypoint.sh && \
chmod +x /app/entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]