use axum::{
    extract::State,
    http::StatusCode,
    Json,
    response::IntoResponse,
};
use serde_json::json;
use sqlx::PgPool;
use std::sync::Arc;
use tracing::error;

use crate::models::agent::{AgentCache, AgentDb};

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub agent_cache: Arc<AgentCache>,
}

/// GET /api/agents - Return all agents with their stats
pub async fn agents_handler(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    // Query all agents from database
    let agents_result = sqlx::query_as!(
        AgentDb,
        "SELECT id, public_id, name, stats, created_at, updated_at FROM agents ORDER BY name"
    )
    .fetch_all(&state.pool)
    .await;
    
    match agents_result {
        Ok(agent_dbs) => {
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
            
            Ok(Json(agents))
        }
        Err(e) => {
            error!("Failed to fetch agents: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "Failed to fetch agents"
                }))
            ))
        }
    }
}