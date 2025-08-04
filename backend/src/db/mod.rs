use anyhow::Result;
use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use std::time::Duration;
use tracing::info;

pub async fn create_pool(database_url: &str) -> Result<SqlitePool> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(database_url)
        .await?;
    
    info!("Connected to database: {}", database_url);
    Ok(pool)
}

pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    // Read and execute migration files
    let migration = include_str!("../../migrations/001_create_agents_table.sql");
    
    sqlx::raw_sql(migration)
        .execute(pool)
        .await?;
    
    info!("Database migrations completed");
    Ok(())
}

/// Initialize database with sample data if empty
pub async fn init_sample_data(pool: &SqlitePool) -> Result<()> {
    use crate::models::agent::AgentDb;
    use serde_json::json;
    
    // Check if we have any agents
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM agents")
        .fetch_one(pool)
        .await?;
    
    if count.0 == 0 {
        info!("Initializing sample agent data");
        
        // Insert sample agents
        let agents = vec![
            ("security-advisor", json!({
                "downloads": 12500,
                "upvotes": 92,
                "votes": 234,
                "last_updated": "2d ago"
            })),
            ("code-optimizer", json!({
                "downloads": 8700,
                "upvotes": 88,
                "votes": 189,
                "last_updated": "1w ago"
            })),
        ];
        
        for (name, stats) in agents {
            let public_id = AgentDb::generate_public_id();
            
            sqlx::query(
                "INSERT INTO agents (public_id, name, stats) VALUES (?, ?, ?)"
            )
            .bind(&public_id)
            .bind(name)
            .bind(stats)
            .execute(pool)
            .await?;
            
            info!("Created sample agent: {} with public_id: {}", name, public_id);
        }
    }
    
    Ok(())
}