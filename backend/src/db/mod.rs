pub mod pool;
pub mod user_connection;

pub use pool::DatabasePools;
pub use user_connection::UserConnection;

use anyhow::Result;
use sqlx::PgPool;
use tracing::info;

/// Run migrations on the live database only
pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await?;
    
    info!("Database migrations completed");
    Ok(())
}