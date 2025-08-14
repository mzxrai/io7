use anyhow::Result;
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::time::Duration;
use tracing::info;

/// Holds both test and live database connection pools
#[derive(Clone)]
pub struct DatabasePools {
    pub live: PgPool,
    pub test: PgPool,
}

impl DatabasePools {
    /// Create both database pools
    pub async fn new() -> Result<Self> {
        let live_url = std::env::var("LIVE_DATABASE_URL")
            .expect("LIVE_DATABASE_URL must be set");
        let test_url = std::env::var("TEST_DATABASE_URL")
            .expect("TEST_DATABASE_URL must be set");
        
        info!("Creating live database pool...");
        let live = create_pool(&live_url, 40).await?;
        
        info!("Creating test database pool...");
        let test = create_pool(&test_url, 10).await?;
        
        Ok(Self { live, test })
    }
    
    /// Get the appropriate pool based on API key prefix
    pub fn get_pool(&self, api_key: &str) -> &PgPool {
        if api_key.starts_with("test_io7_") {
            &self.test
        } else if api_key.starts_with("live_io7_") {
            &self.live
        } else {
            // Default to live for auth operations
            &self.live
        }
    }
    
    /// Get the live pool directly (for auth operations)
    pub fn live_pool(&self) -> &PgPool {
        &self.live
    }
}

async fn create_pool(database_url: &str, max_connections: u32) -> Result<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(max_connections)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(30))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .connect(database_url)
        .await?;
    
    info!("Connected to database with {} max connections", max_connections);
    Ok(pool)
}