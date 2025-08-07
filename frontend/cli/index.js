#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
function parseArguments() {
  try {
    const { values, positionals } = parseArgs({
      options: {
        install: {
          type: 'string',
          short: 'i',
        },
        local: {
          type: 'boolean',
          short: 'l',
        },
        help: {
          type: 'boolean',
          short: 'h',
        },
      },
      allowPositionals: true,
    });

    if (values.help) {
      showHelp();
      process.exit(0);
    }

    if (!values.install) {
      console.error('Error: --install flag is required');
      showHelp();
      process.exit(1);
    }

    const agentNames = values.install.split(',').map(name => name.trim()).filter(Boolean);
    
    if (agentNames.length === 0) {
      console.error('Error: No agent names provided');
      process.exit(1);
    }

    return {
      agentNames,
      isLocal: !!values.local,
    };
  } catch (error) {
    console.error('Error parsing arguments:', error.message);
    showHelp();
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
io7 CLI - Install Claude Code Subagents

Usage:
  npx io7@latest --install <agent1,agent2,...> [options]

Options:
  --install, -i    Comma-separated list of agent names to install
  --local, -l      Install agents locally in .claude/agents/ (default: ~/.claude/agents/)
  --help, -h       Show this help message

Examples:
  npx io7@latest --install architecture-planning-specialist
  npx io7@latest --install clerk-authentication-specialist,stripe-payment-specialist --local

Browse agents: https://io7.dev
Submit an agent: https://github.com/mzxrai/io7/issues/new?template=agent-submission.yml
`);
}

// Fetch agent data from API
async function fetchAgents(agentNames) {
  // Use environment variable for development, otherwise use production URL
  const apiUrl = process.env.IO7_API_URL || 'https://io7.dev';
  const endpoint = `${apiUrl}/api/agents/cli`;
  
  console.log('→ Fetching agent files from server...');
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ names: agentNames }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from server');
    }

    return data;
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') {
      throw new Error('Could not connect to server. Is the backend running?');
    }
    throw error;
  }
}

// Determine installation directory
function getInstallPath(isLocal) {
  if (isLocal) {
    return join(process.cwd(), '.claude', 'agents');
  }
  
  // Handle different platforms
  const home = homedir();
  return join(home, '.claude', 'agents');
}

// Check if directory exists
async function directoryExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Create directory with user confirmation
async function ensureDirectory(dirPath, isLocal) {
  console.log(`→ Checking for ${isLocal ? 'local' : 'global'} agents directory...`);
  
  if (await directoryExists(dirPath)) {
    console.log(`  ✓ Directory exists: ${dirPath}`);
    return true;
  }

  console.log(`  Directory does not exist: ${dirPath}`);
  console.log('  Would you like to create it? (y/n): ');
  
  // Read user input
  const answer = await new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim().toLowerCase());
      process.stdin.pause(); // Stop reading from stdin
    });
  });

  if (answer !== 'y' && answer !== 'yes') {
    console.log('  Installation cancelled.');
    return false;
  }

  try {
    await mkdir(dirPath, { recursive: true });
    console.log(`  ✓ Created directory: ${dirPath}`);
    return true;
  } catch (error) {
    console.error(`  ✗ Failed to create directory: ${error.message}`);
    return false;
  }
}

// Write agent file
async function writeAgentFile(dirPath, agent) {
  const filePath = join(dirPath, `${agent.name}.md`);
  
  try {
    await writeFile(filePath, agent.content, 'utf8');
    return { success: true, name: agent.name, path: filePath };
  } catch (error) {
    return { success: false, name: agent.name, error: error.message };
  }
}

// Install agents
async function installAgents(agents, isLocal) {
  const installPath = getInstallPath(isLocal);
  
  // Ensure directory exists
  const dirReady = await ensureDirectory(installPath, isLocal);
  if (!dirReady) {
    return false;
  }

  console.log('\n→ Installing agent files...');
  
  const results = await Promise.all(
    agents.map(agent => writeAgentFile(installPath, agent))
  );

  // Display results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  successful.forEach(result => {
    console.log(`  ✓ Installed: ${result.name}`);
  });

  failed.forEach(result => {
    console.log(`  ✗ Failed to install ${result.name}: ${result.error}`);
  });

  return failed.length === 0;
}

// Main function
async function main() {
  console.log('io7 Agent Installer\n');
  
  try {
    // Parse arguments
    const { agentNames, isLocal } = parseArguments();
    
    console.log(`Requesting ${agentNames.length} agent${agentNames.length > 1 ? 's' : ''}:`);
    agentNames.forEach(name => console.log(`  • ${name}`));
    console.log('');

    // Fetch agents
    const agents = await fetchAgents(agentNames);
    
    if (agents.length === 0) {
      console.log('✗ No matching agents found on server.');
      console.log('  Please check the agent names and try again.');
      process.exit(1);
    }

    console.log(`✓ Found ${agents.length} agent${agents.length > 1 ? 's' : ''} on server\n`);

    // Check for missing agents
    const foundNames = agents.map(a => a.name);
    const missingNames = agentNames.filter(name => !foundNames.includes(name));
    
    if (missingNames.length > 0) {
      console.log('⚠ Warning: The following agents were not found:');
      missingNames.forEach(name => console.log(`  • ${name}`));
      console.log('');
    }

    // Install agents
    const success = await installAgents(agents, isLocal);

    // Final message
    console.log('');
    if (success) {
      console.log('✓ Installation complete!');
      console.log(`  Your agents are ready to use in Claude Code.`);
      console.log(`  Location: ${getInstallPath(isLocal)}`);
    } else {
      console.log('⚠ Installation completed with errors.');
      console.log('  Some agents may not have been installed correctly.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n✗ Installation failed:', error.message);
    
    if (error.stack && process.env.DEBUG) {
      console.error('\nDebug information:');
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});