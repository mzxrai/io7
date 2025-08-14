mod db;

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
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::db::DatabasePools;

#[derive(Clone)]
pub struct AppState {
    pub pools: DatabasePools,
}

async fn health_check(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> impl IntoResponse {
    // Check both database connections
    let live_status = match sqlx::query("SELECT 1")
        .fetch_one(state.pools.live_pool())
        .await {
        Ok(_) => "connected",
        Err(_) => "disconnected",
    };
    
    let test_status = match sqlx::query("SELECT 1")
        .fetch_one(&state.pools.test)
        .await {
        Ok(_) => "connected",
        Err(_) => "disconnected",
    };
    
    let overall_status = if live_status == "connected" && test_status == "connected" {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };
    
    (overall_status, Json(json!({
        "status": if overall_status == StatusCode::OK { "healthy" } else { "unhealthy" },
        "databases": {
            "live": live_status,
            "test": test_status
        }
    })))
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
    
    info!("Starting io7 KV store backend");
    
    // Create database pools
    let pools = DatabasePools::new().await?;
    
    // Run migrations on live database only
    info!("Running migrations on live database...");
    db::run_migrations(pools.live_pool()).await?;
    
    // Create app state
    let state = AppState { pools };
    
    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        // TODO: Add auth routes
        // TODO: Add KV operation routes
        // TODO: Add transform routes
        .layer(
            CorsLayer::new()
                .allow_origin([
                    "http://localhost:5173".parse::<HeaderValue>().unwrap(),
                    "http://localhost:5174".parse::<HeaderValue>().unwrap(),
                    "http://localhost:5175".parse::<HeaderValue>().unwrap(),
                    "https://io7.dev".parse::<HeaderValue>().unwrap(),
                    "https://io7.sh".parse::<HeaderValue>().unwrap(),
                ])
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
                .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION])
        )
        .with_state(state);
    
    // Get port from environment or use default
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