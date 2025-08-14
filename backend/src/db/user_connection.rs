use anyhow::{Result, anyhow};
use sqlx::{PgPool, Postgres, Transaction};
use regex::Regex;
use once_cell::sync::Lazy;

static SCHEMA_NAME_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[a-z_][a-z0-9_]{0,62}$").unwrap()
});

/// A wrapper around a database transaction that enforces schema isolation
/// All queries must go through this wrapper to ensure proper schema context
#[allow(dead_code)]
pub struct UserConnection<'a> {
    tx: Transaction<'a, Postgres>,
    schema_name: String,
}

impl<'a> UserConnection<'a> {
    /// Create a new user connection with schema isolation
    /// This sets the search_path for all queries in this transaction
    pub async fn new(pool: &'a PgPool, schema_name: String) -> Result<Self> {
        // Validate schema name to prevent SQL injection
        if !SCHEMA_NAME_REGEX.is_match(&schema_name) {
            return Err(anyhow!("Invalid schema name format"));
        }
        
        let mut tx = pool.begin().await?;
        
        // Set the search path for this transaction
        // We can't use parameterized queries for schema names, but we've validated above
        let query = format!("SET search_path TO {}, public", schema_name);
        sqlx::query(&query)
            .execute(&mut *tx)
            .await?;
        
        Ok(Self { tx, schema_name })
    }
    
    /// Get a reference to the transaction for executing queries
    pub fn tx(&mut self) -> &mut Transaction<'a, Postgres> {
        &mut self.tx
    }
    
    /// Get the schema name for this connection
    pub fn schema_name(&self) -> &str {
        &self.schema_name
    }
    
    /// Commit the transaction
    pub async fn commit(self) -> Result<()> {
        self.tx.commit().await?;
        Ok(())
    }
    
    /// Rollback the transaction (happens automatically on drop if not committed)
    pub async fn rollback(self) -> Result<()> {
        self.tx.rollback().await?;
        Ok(())
    }
}