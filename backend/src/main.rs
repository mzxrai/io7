mod db;
mod handlers;
mod loader;
mod models;
mod rate_limit;

use anyhow::Result;
use axum::{
    routing::{get, post},
    Router,
    http::{header, HeaderValue, Method, StatusCode},
    response::IntoResponse,
    middleware,
    Json,
};
use serde_json::json;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::handlers::{agents_handler, agents_cli_handler, agent_vote_handler, agents::AppState};
use crate::rate_limit::{RateLimitState, vote_rate_limit_middleware, cleanup_old_limiters};

async fn health_check(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> impl IntoResponse {
    // Check database connectivity
    match sqlx::query("SELECT 1").fetch_one(&state.pool).await {
        Ok(_) => (StatusCode::OK, Json(json!({
            "status": "healthy",
            "database": "connected"
        }))),
        Err(_) => (StatusCode::SERVICE_UNAVAILABLE, Json(json!({
            "status": "unhealthy", 
            "database": "disconnected"
        }))),
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables
    dotenvy::dotenv().ok();
    
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
    
    info!("Starting io7 backend");
    
    // Create empty agent cache (no longer loading from files)
    let agent_cache = Arc::new(std::collections::HashMap::new());
    
    // Connect to database
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    
    info!("Creating database pool...");
    let start = std::time::Instant::now();
    let pool = db::create_pool(&database_url).await?;
    info!("Database pool created in {:?}", start.elapsed());
    
    // Run migrations
    info!("Running migrations...");
    let start = std::time::Instant::now();
    db::run_migrations(&pool).await?;
    info!("Migrations completed in {:?}", start.elapsed());
    
    // Initialize sample data if needed
    info!("Initializing sample data...");
    let start = std::time::Instant::now();
    db::init_sample_data(&pool).await?;
    info!("Sample data initialized in {:?}", start.elapsed());
    
    // Sync agents from files to database
    info!("Syncing agents to database...");
    let start = std::time::Instant::now();
    db::sync_agents_to_db(&pool, &agent_cache).await?;
    info!("Agent sync completed in {:?}", start.elapsed());
    
    // Create app state with empty cache
    let state = AppState {
        pool,
        agent_cache,
        agents_combined: Arc::new(tokio::sync::RwLock::new(Vec::new())),
        last_updated_at: Arc::new(tokio::sync::RwLock::new(None)),
    };
    
    // Create rate limit state
    let rate_limit_state = Arc::new(RateLimitState::new());
    
    // Start background task to clean up old rate limiters
    let cleanup_state = Arc::clone(&rate_limit_state);
    tokio::spawn(cleanup_old_limiters(cleanup_state));
    
    // Skip initial cache population and background task for Cloud Run
    // The cache will be populated on first request instead
    
    // Build router
    let app = Router::new()
        .route("/api/agents", get(agents_handler))
        .route("/api/agents/cli", post(agents_cli_handler))
        .route("/api/agents/{public_id}/vote", 
            post(agent_vote_handler)
                .layer(middleware::from_fn_with_state(
                    Arc::clone(&rate_limit_state),
                    vote_rate_limit_middleware
                ))
        )
        .route("/health", get(health_check))
        .layer(
            CorsLayer::new()
                .allow_origin([
                    "http://localhost:5173".parse::<HeaderValue>().unwrap(),
                    "http://localhost:5174".parse::<HeaderValue>().unwrap(),
                    "http://localhost:5175".parse::<HeaderValue>().unwrap(),
                    "https://io7.dev".parse::<HeaderValue>().unwrap(),
                    "https://io7.sh".parse::<HeaderValue>().unwrap(),
                ])
                .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
                .allow_headers([header::CONTENT_TYPE])
        )
        .with_state(state);
    
    // Get port from environment or use default (3000 for dev, PORT env var for production)
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()?;
    
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("Server listening on http://{}", addr);
    
    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
