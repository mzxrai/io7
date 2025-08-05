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
# DATABASE_URL will be provided by Railway PostgreSQL
ENV RUST_LOG=info
ENV PORT=8080

EXPOSE 8080

CMD ["/app/io7-backend"]