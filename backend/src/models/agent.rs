use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use sqlx::types::time::OffsetDateTime;
use std::collections::HashMap;
use uuid::Uuid;

/// Agent definition loaded from markdown files
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDefinition {
    pub name: String,
    pub description: String,
    pub model: Option<String>,
    pub tools: Option<Vec<String>>,
    pub content: String, // The markdown content after frontmatter
}

/// Agent stats stored in the database
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AgentStats {
    pub downloads: u64,
    pub upvotes: u64,
    pub votes: u64,
}

/// Database model for agents
#[derive(Debug, FromRow)]
pub struct AgentDb {
    #[allow(dead_code)]
    pub id: Option<i64>, // Internal ID, not exposed (can be NULL during insert)
    pub public_id: String,
    pub name: String,
    pub stats: JsonValue,
    #[allow(dead_code)]
    pub created_at: Option<OffsetDateTime>,
    #[allow(dead_code)]
    pub updated_at: Option<OffsetDateTime>,
}

/// API response model for agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String, // This will be the public_id
    pub name: String,
    pub description: String,
    pub model: Option<String>,
    pub tools: Option<Vec<String>>,
    pub stats: AgentStats,
    pub content: String, // The markdown content from the agent definition file
    pub last_updated: Option<String>, // ISO 8601 timestamp from database updated_at
}

impl AgentDb {
    /// Generate a new public ID
    pub fn generate_public_id() -> String {
        Uuid::new_v4().to_string()
    }

    /// Convert database model to API response model
    pub fn to_api_model(self, definition: &AgentDefinition) -> Agent {
        let stats: AgentStats = serde_json::from_value(self.stats)
            .unwrap_or_default();

        // Format updated_at as ISO 8601 string if present
        let last_updated = self.updated_at.map(|dt| dt.to_string());

        Agent {
            id: self.public_id,
            name: self.name,
            description: definition.description.clone(),
            model: definition.model.clone(),
            tools: definition.tools.clone(),
            stats,
            content: definition.content.clone(),
            last_updated,
        }
    }
}

/// In-memory cache for agent definitions
pub type AgentCache = HashMap<String, AgentDefinition>;