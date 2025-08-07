use axum::{
    extract::State,
    Json,
    response::IntoResponse,
    http::StatusCode,
};
use serde::Deserialize;
use sqlx::PgPool;
use sqlx::types::time::OffsetDateTime;
use std::sync::Arc;

use crate::models::agent::{AgentCache, AgentDb};

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub agent_cache: Arc<AgentCache>,
    pub agents_combined: Arc<tokio::sync::RwLock<Vec<crate::models::agent::Agent>>>,
    pub last_updated_at: Arc<tokio::sync::RwLock<Option<OffsetDateTime>>>,
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

/// Request body for the CLI agents endpoint
#[derive(Deserialize)]
pub struct CliAgentsRequest {
    pub names: Vec<String>,
}

/// GET /api/agents - Return all agents with their stats
pub async fn agents_handler(
    State(state): State<AppState>,
) -> impl IntoResponse {
    // Check if we need to refresh the cache
    let should_refresh = {
        let last_updated = state.last_updated_at.read().await;
        
        if last_updated.is_none() {
            // Never refreshed before
            true
        } else {
            // Check if any agent has been updated since last refresh
            match sqlx::query!(
                "SELECT MAX(updated_at) as max_updated FROM agents"
            )
            .fetch_one(&state.pool)
            .await
            {
                Ok(result) => {
                    if let (Some(max_updated), Some(last)) = (result.max_updated, *last_updated) {
                        max_updated > last
                    } else {
                        true
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to check for updates: {}", e);
                    false
                }
            }
        }
    };
    
    if should_refresh {
        if let Err(e) = refresh_agents_cache(&state).await {
            tracing::error!("Failed to refresh agents cache: {}", e);
        } else {
            // Update the last refresh timestamp
            *state.last_updated_at.write().await = Some(OffsetDateTime::now_utc());
        }
    }
    
    // Read from the cache
    let agents = state.agents_combined.read().await;
    Json(agents.clone())
}

/// POST /api/agents/cli - Return specific agents by name for CLI download
pub async fn agents_cli_handler(
    State(state): State<AppState>,
    Json(request): Json<CliAgentsRequest>,
) -> impl IntoResponse {
    // Ensure cache is populated first
    let should_refresh = {
        let last_updated = state.last_updated_at.read().await;
        last_updated.is_none()
    };
    
    if should_refresh {
        if let Err(e) = refresh_agents_cache(&state).await {
            tracing::error!("Failed to refresh agents cache: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(Vec::<crate::models::agent::Agent>::new())
            );
        } else {
            *state.last_updated_at.write().await = Some(OffsetDateTime::now_utc());
        }
    }
    
    // Read from the cache and filter by requested names
    let agents = state.agents_combined.read().await;
    let filtered_agents: Vec<_> = agents
        .iter()
        .filter(|agent| request.names.contains(&agent.name))
        .cloned()
        .collect();
    
    // Spawn a background task to increment download stats for matched agents
    // This won't block the HTTP response
    if !filtered_agents.is_empty() {
        let pool = state.pool.clone();
        let agent_names: Vec<String> = filtered_agents.iter().map(|a| a.name.clone()).collect();
        
        tokio::spawn(async move {
            // Update download stats for each agent
            for name in agent_names {
                let result = sqlx::query!(
                    r#"
                    UPDATE agents 
                    SET stats = jsonb_set(
                        stats,
                        '{downloads}',
                        to_jsonb(COALESCE((stats->>'downloads')::bigint, 0) + 1)
                    ),
                    updated_at = NOW()
                    WHERE name = $1
                    "#,
                    name
                )
                .execute(&pool)
                .await;
                
                match result {
                    Ok(_) => {
                        tracing::debug!("Incremented download count for agent: {}", name);
                    }
                    Err(e) => {
                        tracing::error!("Failed to increment download count for agent {}: {}", name, e);
                    }
                }
            }
        });
    }
    
    (StatusCode::OK, Json(filtered_agents))
}