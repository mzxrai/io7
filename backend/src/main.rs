mod db;
mod handlers;
mod loader;
mod models;

use anyhow::Result;
use axum::{
    routing::get,
    Router,
};
use std::net::SocketAddr;
use std::path::Path;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::handlers::{agents_handler, agents::AppState};

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
    
    // Create app state
    let state = AppState {
        pool,
        agent_cache,
    };
    
    // Build router
    let app = Router::new()
        .route("/api/agents", get(agents_handler))
        .route("/health", get(|| async { "OK" }))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any)
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
