use anyhow::{Context, Result};
use serde::Deserialize;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tracing::info;
use yaml_front_matter::YamlFrontMatter;

use crate::models::agent::{AgentDefinition, AgentCache};

#[derive(Deserialize)]
struct FrontMatter {
    name: String,
    description: String,
    model: Option<String>,
    tools: Option<Vec<String>>,
}

/// Load all agent definitions from the agent_files directory
pub fn load_agent_definitions(dir: &Path) -> Result<AgentCache> {
    let mut cache = HashMap::new();
    
    // Read all .md files in the directory
    let entries = fs::read_dir(dir)
        .with_context(|| format!("Failed to read agent_files directory: {:?}", dir))?;
    
    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        
        // Skip non-markdown files
        if path.extension().and_then(|s| s.to_str()) != Some("md") {
            continue;
        }
        
        // Read file content
        let content = fs::read_to_string(&path)
            .with_context(|| format!("Failed to read agent file: {:?}", path))?;
        
        // Parse frontmatter and content
        match YamlFrontMatter::parse::<FrontMatter>(&content) {
            Ok(document) => {
                let definition = AgentDefinition {
                    name: document.metadata.name.clone(),
                    description: document.metadata.description,
                    model: document.metadata.model,
                    tools: document.metadata.tools,
                    content: document.content,
                };
                
                info!("Loaded agent definition: {}", document.metadata.name);
                cache.insert(document.metadata.name, definition);
            }
            Err(e) => {
                tracing::warn!("Failed to parse agent file {:?}: {}", path, e);
            }
        }
    }
    
    info!("Loaded {} agent definitions", cache.len());
    Ok(cache)
}