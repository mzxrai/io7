# syntax=docker/dockerfile:1
# Enable BuildKit for cache mount support

# Build stage
FROM lukemathwalker/cargo-chef:latest-rust-1.88.0-alpine AS chef
WORKDIR /app

# Install sccache using pre-built binary instead of compiling
RUN apk add --no-cache openssl-dev && \
    wget -O /tmp/sccache.tar.gz https://github.com/mozilla/sccache/releases/download/v0.10.0/sccache-v0.10.0-aarch64-unknown-linux-musl.tar.gz && \
    tar -xzf /tmp/sccache.tar.gz -C /tmp && \
    mv /tmp/sccache-v0.10.0-aarch64-unknown-linux-musl/sccache /usr/local/bin/ && \
    chmod +x /usr/local/bin/sccache && \
    rm -rf /tmp/sccache*
ENV RUSTC_WRAPPER=sccache
ENV SCCACHE_DIR=/sccache

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json

# Build dependencies with cache mounts - this layer is cached!
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/sccache,sharing=locked \
    cargo chef cook --release --recipe-path recipe.json

# Copy source code and sqlx files
COPY . .
COPY .sqlx .sqlx

# Build application with cache mounts
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/sccache,sharing=locked \
    --mount=type=cache,target=/app/target,sharing=locked \
    cargo build --release && \
    # Move the binary out of the cache directory
    mv /app/target/release/io7-backend /app/io7-backend-binary

# Runtime stage
FROM alpine:3.21 AS runtime
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates

# Copy the built binary
COPY --from=builder /app/io7-backend-binary /app/io7-backend

# Copy migrations
COPY migrations/ /app/migrations/

# Set environment variables for production
ENV RUST_LOG=info
ENV PORT=8080

EXPOSE 8080

CMD ["/app/io7-backend"]