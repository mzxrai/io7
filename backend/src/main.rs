mod db;
mod handlers;
mod loader;
mod models;

use anyhow::Result;
use axum::{
    routing::get,
    Router,
    http::{header, HeaderValue, Method, StatusCode},
    response::IntoResponse,
    Json,
};
use serde_json::json;
use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::handlers::{agents_handler, agents::AppState};

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
    
    // Load agent definitions from markdown files
    let agent_files_dir = Path::new("agent_files");
    let agent_cache = Arc::new(loader::load_agent_definitions(agent_files_dir)?);
    
    // Connect to database
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let pool = db::create_pool(&database_url).await?;
    
    // Run migrations
    db::run_migrations(&pool).await?;
    
    // Initialize sample data if needed
    db::init_sample_data(&pool).await?;
    
    // Sync agents from files to database
    db::sync_agents_to_db(&pool, &agent_cache).await?;
    
    // Create app state with empty cache
    let state = AppState {
        pool,
        agent_cache,
        agents_combined: Arc::new(tokio::sync::RwLock::new(Vec::new())),
    };
    
    // Initial cache population
    handlers::agents::refresh_agents_cache(&state).await?;
    
    // Spawn background task to refresh cache every 60 seconds
    let state_clone = state.clone();
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(60));
        loop {
            interval.tick().await;
            if let Err(e) = handlers::agents::refresh_agents_cache(&state_clone).await {
                tracing::error!("Failed to refresh agents cache: {}", e);
            }
        }
    });
    
    // Build router
    let app = Router::new()
        .route("/api/agents", get(agents_handler))
        .route("/health", get(health_check))
        .layer(
            CorsLayer::new()
                .allow_origin([
                    "http://localhost:5173".parse::<HeaderValue>().unwrap(),
                    "http://localhost:5174".parse::<HeaderValue>().unwrap(),
                    "http://localhost:5175".parse::<HeaderValue>().unwrap(),
                    "https://io7.dev".parse::<HeaderValue>().unwrap(),
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
