use anyhow::Result;
use sqlx::PgPool;
use serde_json::json;
use tracing::{info, warn};

use crate::models::agent::{AgentCache, AgentDb};


/// Sync agents from files to database
pub async fn sync_agents_to_db(pool: &PgPool, agent_cache: &AgentCache) -> Result<()> {
    info!("Starting agent sync from files to database");

    // Get all agents currently in database
    let db_agents = sqlx::query!("SELECT name FROM agents")
        .fetch_all(pool)
        .await?;
    
    let db_agent_names: Vec<String> = db_agents.iter().map(|a| a.name.clone()).collect();

    // Process each agent from files
    for (name, _definition) in agent_cache.iter() {
        if db_agent_names.contains(name) {
            // Agent exists - we could update it here if needed
            info!("Agent {} already exists in database", name);
        } else {
            // Agent doesn't exist - insert it
            info!("Inserting new agent: {}", name);
            
            let public_id = AgentDb::generate_public_id();
            let stats = json!({
                "downloads": 0,
                "upvotes": 0,
                "downvotes": 0
            });

            sqlx::query!(
                "INSERT INTO agents (public_id, name, stats) VALUES ($1, $2, $3)",
                public_id,
                name,
                stats
            )
            .execute(pool)
            .await?;
        }
    }

    // Optionally: warn about agents in DB but not in files
    for db_name in &db_agent_names {
        if !agent_cache.contains_key(db_name) {
            warn!("Agent {} exists in database but not in files", db_name);
        }
    }

    info!("Agent sync completed");
    Ok(())
}