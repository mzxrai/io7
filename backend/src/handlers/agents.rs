use axum::{
    extract::State,
    Json,
    response::IntoResponse,
};
use sqlx::PgPool;
use std::sync::Arc;

use crate::models::agent::{AgentCache, AgentDb};

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub agent_cache: Arc<AgentCache>,
    pub agents_combined: Arc<tokio::sync::RwLock<Vec<crate::models::agent::Agent>>>,
}

/// Refresh the combined agents cache
pub async fn refresh_agents_cache(state: &AppState) -> Result<(), anyhow::Error> {
    // Query all agents from database
    let agent_dbs = sqlx::query_as!(
        AgentDb,
        "SELECT id, public_id, name, stats, created_at, updated_at FROM agents ORDER BY name"
    )
    .fetch_all(&state.pool)
    .await?;
    
    let mut agents = Vec::new();
    
    for agent_db in agent_dbs {
        // Get the definition from cache
        if let Some(definition) = state.agent_cache.get(&agent_db.name) {
            agents.push(agent_db.to_api_model(definition));
        } else {
            // Log warning but continue - agent in DB but not in files
            tracing::warn!("Agent {} in database but not in agent_files", agent_db.name);
        }
    }
    
    // Update the cache
    *state.agents_combined.write().await = agents;
    
    tracing::debug!("Refreshed agents cache");
    Ok(())
}

/// GET /api/agents - Return all agents with their stats
pub async fn agents_handler(
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Just read from the cache
    let agents = state.agents_combined.read().await;
    Json(agents.clone())
}