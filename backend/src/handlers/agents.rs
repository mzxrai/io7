use axum::{
    extract::{State, Path},
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
    // Query all agents from database (no ORDER BY needed, we sort in Rust)
    let agent_dbs = sqlx::query_as!(
        AgentDb,
        "SELECT id, public_id, name, stats, created_at, updated_at FROM agents"
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
    
    // Define priority agents that should appear first
    let priority_agents = vec![
        "react-code-reviewer",
        "email-pipeline-builder",
        "code-architect",
        "conversion-rate-optimizer"
    ];
    
    // Sort agents: priority agents first (in defined order), then others alphabetically
    agents.sort_by(|a, b| {
        let a_priority = priority_agents.iter().position(|&name| name == a.name);
        let b_priority = priority_agents.iter().position(|&name| name == b.name);
        
        match (a_priority, b_priority) {
            (Some(a_pos), Some(b_pos)) => a_pos.cmp(&b_pos), // Both priority: use defined order
            (Some(_), None) => std::cmp::Ordering::Less,      // a is priority, b is not
            (None, Some(_)) => std::cmp::Ordering::Greater,   // b is priority, a is not
            (None, None) => a.name.cmp(&b.name),              // Neither priority: alphabetical
        }
    });
    
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

/// Request body for voting endpoint
#[derive(Deserialize)]
pub struct VoteRequest {
    pub vote: u8,  // 0 for downvote, 1 for upvote
}

/// POST /api/agents/:public_id/vote - Submit a vote for an agent
pub async fn agent_vote_handler(
    State(state): State<AppState>,
    Path(public_id): Path<String>,
    headers: axum::http::HeaderMap,
    Json(request): Json<VoteRequest>,
) -> impl IntoResponse {
    // Check origin header to ensure request is from our frontend
    let origin = headers.get("origin")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    
    let referer = headers.get("referer")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    
    // In production, only allow votes from our domain
    let is_production = std::env::var("ENVIRONMENT").unwrap_or_default() == "production";
    if is_production {
        let allowed_origins = ["https://io7.dev", "https://www.io7.dev"];
        let origin_allowed = allowed_origins.iter().any(|&allowed| origin == allowed);
        let referer_allowed = allowed_origins.iter().any(|&allowed| referer.starts_with(allowed));
        
        if !origin_allowed && !referer_allowed {
            return (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({
                    "error": "Votes can only be submitted from io7.dev"
                }))
            );
        }
    } else {
        // In development, allow localhost origins
        let allowed_origins = [
            "http://localhost:5173",
            "http://localhost:5174", 
            "http://localhost:5175",
            "http://localhost:3000"
        ];
        let origin_allowed = allowed_origins.iter().any(|&allowed| origin == allowed);
        let referer_allowed = allowed_origins.iter().any(|&allowed| referer.starts_with(allowed));
        
        // If origin/referer exists but doesn't match allowed origins, reject
        // (Allow missing origin for testing with curl in dev)
        if !origin.is_empty() && !referer.is_empty() && !origin_allowed && !referer_allowed {
            return (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({
                    "error": "Invalid origin for vote request"
                }))
            );
        }
    }
    
    // Validate vote value
    if request.vote > 1 {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": "Invalid vote value. Must be 0 (downvote) or 1 (upvote)"
            }))
        );
    }
    
    // Update the vote count in the database
    let query = if request.vote == 0 {
        // Increment downvotes
        r#"
        UPDATE agents 
        SET stats = jsonb_set(
            stats,
            '{downvotes}',
            to_jsonb(COALESCE((stats->>'downvotes')::bigint, 0) + 1)
        ),
        updated_at = NOW()
        WHERE public_id = $1
        RETURNING public_id
        "#
    } else {
        // Increment upvotes
        r#"
        UPDATE agents 
        SET stats = jsonb_set(
            stats,
            '{upvotes}',
            to_jsonb(COALESCE((stats->>'upvotes')::bigint, 0) + 1)
        ),
        updated_at = NOW()
        WHERE public_id = $1
        RETURNING public_id
        "#
    };
    
    let result = sqlx::query(query)
        .bind(&public_id)
        .fetch_optional(&state.pool)
        .await;
    
    match result {
        Ok(Some(_)) => {
            tracing::debug!("Recorded {} for agent: {}", 
                if request.vote == 0 { "downvote" } else { "upvote" }, 
                public_id
            );
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "success": true,
                    "message": format!("Vote recorded successfully")
                }))
            )
        }
        Ok(None) => {
            (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": "Agent not found"
                }))
            )
        }
        Err(e) => {
            tracing::error!("Failed to record vote for agent {}: {}", public_id, e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": "Failed to record vote"
                }))
            )
        }
    }
}
