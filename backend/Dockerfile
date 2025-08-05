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

# Set environment variables for production
ENV DATABASE_URL=sqlite:/data/app.db
ENV RUST_LOG=info
ENV PORT=8080

# Create entrypoint script to ensure /data exists and is writable
RUN echo '#!/bin/sh\nset -e\nmkdir -p /data\nchmod 755 /data\nexec "$@"' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
CMD ["./io7-backend"]