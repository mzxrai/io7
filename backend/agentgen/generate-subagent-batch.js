#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

async function readStdinJSON() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    
    process.stdin.on('end', () => {
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (error) {
        reject(new Error(`Invalid JSON input: ${error.message}`));
      }
    });
    
    process.stdin.on('error', reject);
  });
}

async function generateSubagent(description) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['generate-subagent-cli.js', description], {
      env: process.env,
      cwd: __dirname
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    
    child.stderr.on('data', (data) => {
      stderr += data;
      process.stderr.write(data); // Pass through stderr for progress
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
    
    child.on('error', reject);
  });
}

async function main() {
  try {
    console.error('Reading JSON from STDIN...');
    const subagents = await readStdinJSON();
    
    if (!Array.isArray(subagents)) {
      throw new Error('Input must be a JSON array of subagent objects');
    }
    
    const outputDir = path.join(__dirname, 'generated-subagents', new Date().toISOString().split('T')[0]);
    await fs.mkdir(outputDir, { recursive: true });
    console.error(`Output directory: ${outputDir}`);
    
    const results = [];
    
    for (const [index, subagent] of subagents.entries()) {
      if (!subagent.description) {
        console.error(`Skipping entry ${index + 1}: missing description`);
        continue;
      }
      
      const name = subagent.name || `subagent-${index + 1}`;
      console.error(`\n${'='.repeat(60)}`);
      console.error(`Generating subagent ${index + 1}/${subagents.length}: ${name}`);
      console.error(`${'='.repeat(60)}`);
      
      try {
        const output = await generateSubagent(subagent.description);
        
        // Extract the filename from the output (first line should be ---)
        const lines = output.split('\n');
        if (lines[0].startsWith('---')) {
          // Find the name field in the YAML frontmatter
          let yamlName = null;
          for (let i = 1; i < lines.length && lines[i] !== '---'; i++) {
            if (lines[i].startsWith('name:')) {
              yamlName = lines[i].substring(5).trim();
              break;
            }
          }
          
          const filename = `${yamlName || name.toLowerCase().replace(/\s+/g, '-')}.md`;
          const filepath = path.join(outputDir, filename);
          
          await fs.writeFile(filepath, output, 'utf-8');
          console.error(`✓ Saved to ${filename}`);
          
          results.push({
            name: name,
            filename: filename,
            success: true
          });
        } else {
          console.error(`✗ Invalid output format for ${name}`);
          results.push({
            name: name,
            success: false,
            error: 'Invalid output format'
          });
        }
      } catch (error) {
        console.error(`✗ Error generating ${name}: ${error.message}`);
        results.push({
          name: name,
          success: false,
          error: error.message
        });
      }
    }
    
    // Print summary
    console.error(`\n${'='.repeat(60)}`);
    console.error('SUMMARY');
    console.error(`${'='.repeat(60)}`);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.error(`✓ Successfully generated: ${successful.length}/${results.length}`);
    if (successful.length > 0) {
      console.error('\nGenerated subagents:');
      successful.forEach(r => {
        console.error(`  - ${r.filename}`);
      });
    }
    
    if (failed.length > 0) {
      console.error(`\n✗ Failed: ${failed.length}`);
      failed.forEach(r => {
        console.error(`  - ${r.name}: ${r.error}`);
      });
    }
    
    console.error(`\nAll files saved to: ${outputDir}`);
    
    // Output JSON summary to stdout for potential piping
    console.log(JSON.stringify({
      outputDir: outputDir,
      results: results,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length
      }
    }, null, 2));
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

main();