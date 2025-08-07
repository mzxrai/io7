#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function readPromptTemplate() {
  const promptPath = path.join(__dirname, 'agent_files', 'prompt.md');
  const template = await fs.readFile(promptPath, 'utf-8');
  return template;
}

async function ensureOutputDir() {
  const outputDir = `/tmp/subagent-gen-${Date.now()}`;
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

async function callClaude(prompt) {
  try {
    // Write prompt to temp file to avoid shell escaping issues
    const tempFile = `/tmp/claude-prompt-${Date.now()}.txt`;
    await fs.writeFile(tempFile, prompt, 'utf-8');
    
    // Call Claude CLI in print mode with JSON output
    // Use --max-turns to ensure we get a response
    const claudePath = '/Users/mbm-premva/.claude/local/claude';
    const command = `${claudePath} -p --output-format json --max-turns 5 < "${tempFile}"`;
    const { stdout, stderr } = await execAsync(command, { 
      maxBuffer: 10 * 1024 * 1024,
      timeout: 5 * 60 * 1000 // 5 minutes
    });
    
    // Clean up temp file  
    await fs.unlink(tempFile).catch(() => {});
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Claude stderr:', stderr);
    }
    
    const response = JSON.parse(stdout);
    if (response.subtype !== 'success') {
      throw new Error(`Claude returned error: ${response.subtype}`);
    }
    
    return response.result;
  } catch (error) {
    console.error('Error calling Claude:', error.message);
    if (error.stdout) {
      console.error('Stdout:', error.stdout.substring(0, 500));
    }
    if (error.stderr) {
      console.error('Stderr:', error.stderr);
    }
    throw error;
  }
}

async function generateInitialSubagent(prompt, outputDir) {
  try {
    console.error(`Generating initial subagent definition with Claude...`);
    // Prepend instruction to not explore codebase
    const focusedPrompt = `Hi Claude, I have a specific task for you to perform. For this task, don't research the codebase or call any tools other than web search (if necessary).

${prompt}`;
    const response = await callClaude(focusedPrompt);
    
    // Extract just the subagent definition
    const definition = await extractSubagentDefinition(response);
    
    const outputFile = path.join(outputDir, `iteration-1.md`);
    await fs.writeFile(outputFile, definition, 'utf-8');
    console.error(`Initial generation complete, saved to ${outputFile}`);
    
    return definition;
  } catch (error) {
    console.error(`Error generating initial subagent:`, error.message);
    throw error;
  }
}

async function extractSubagentDefinition(rawResponse) {
  const extractPrompt = `Hi Claude, I have a specific task for you to perform. For this task, don't research the codebase or call any tools.

You are a parser. Extract ONLY the subagent definition file from the following AI response.

The subagent definition file should be a Markdown file with YAML frontmatter containing these fields: name, display_name, description, display_description, category, and tags.

Look for content that starts with "---" (YAML frontmatter) and includes the markdown content after the closing "---".

If there are multiple subagent definitions in the response, choose the one that appears to be the final/best version.

Return ONLY the extracted subagent definition file, starting with the opening "---" and ending with the last line of markdown content. Do not add any explanation or commentary.

AI Response to parse:
${rawResponse}`;

  const parsed = await callClaude(extractPrompt);
  return parsed.trim();
}

async function evaluateSubagent(definition, successCriteria, previousEvaluation = null) {
  let contextSection = '';
  if (previousEvaluation) {
    contextSection = `\nIMPORTANT: This is an improved version. The previous score was ${previousEvaluation.score}/100 with these issues:
${previousEvaluation.issues ? previousEvaluation.issues.map(i => `- ${i}`).join('\n') : 'None specified'}

If these specific issues have been adequately addressed, you MUST increase the score accordingly. Don't nitpick new minor issues if the main problems were fixed. Progress should be rewarded.\n`;
  }
  
  const evaluationPrompt = `Hi Claude, I have a specific task for you to perform. For this task, don't research the codebase or call any tools.

You are an expert evaluator of Claude Code subagent definition files.
${contextSection}
Evaluate the following subagent definition based on these success criteria:

${successCriteria}

Key evaluation points:
- Does it focus on expertise and capabilities rather than task lists?
- Is it adaptable rather than prescriptive?
- Does it avoid code examples and implementation snippets?
- Does it clearly explain what gets returned to the main agent?
- Is it concrete and technical without being a checklist?
- Does it avoid rigid output formats or sections?
- Is the description field appropriate (not overusing USE PROACTIVELY)?
- Is it concise without being too brief (not a novel, but has substance)?

Here is the subagent definition to evaluate:

${definition}

Evaluate the definition and respond with ONLY this JSON format:
{
  "score": <number between 0-100>,
  "issues": [
    "specific issue 1",
    "specific issue 2"
  ]
}

The issues array should contain 2-4 specific, actionable problems preventing a perfect score.
Examples: "Uses USE PROACTIVELY inappropriately", "No clear statement of what gets returned to main agent", "Contains prescriptive task lists instead of expertise", "Has code examples or implementation snippets", "Defines rigid output format instead of adaptive responses"

If the score is 95+, the issues array can be empty.

IMPORTANT: Be fair and recognize improvements. If previous issues were addressed, increase the score. Don't keep finding new nitpicks if the core problems were solved. A definition doesn't need to be perfect to score 95+.`;

  try {
    const responseText = await callClaude(evaluationPrompt);
    
    // Extract JSON from response
    let result;
    try {
      // Try to parse the entire response as JSON first
      result = JSON.parse(responseText.trim());
    } catch (e) {
      // If that fails, look for JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          throw new Error('Could not parse JSON from evaluation response');
        }
      } else {
        throw new Error('Could not find JSON in evaluation response');
      }
    }
    
    if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
      throw new Error(`Invalid score: ${result.score}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error evaluating subagent:', error.message);
    throw error;
  }
}

async function improveSubagent(definition, successCriteria, evaluation, iteration, outputDir, history = []) {
  const { score, issues } = evaluation;
  const issuesList = issues && issues.length > 0 
    ? `Specific issues identified:\n${issues.map(i => `- ${i}`).join('\n')}`
    : 'No specific issues identified, but general improvements needed.';
  
  // Build history section showing previous attempts
  let historySection = '';
  if (history.length > 0) {
    historySection = `\n## Previous Improvement Attempts:\n\n`;
    history.forEach((item, idx) => {
      historySection += `### Iteration ${idx + 1} (Score: ${item.score}/100)\n`;
      historySection += `Issues: ${item.issues ? item.issues.join(', ') : 'None specified'}\n`;
      historySection += `<definition_${idx + 1}>\n${item.definition}\n</definition_${idx + 1}>\n\n`;
    });
    historySection += `\nYou can see the full progression of changes and scores. Learn from what worked and what didn't. Avoid repeating changes that lowered the score.\n`;
  }
    
  const improvementPrompt = `Hi Claude, I have a specific task for you to perform. For this task, don't research the codebase or call any tools.

You are an expert at improving Claude Code subagent definition files.

The current subagent definition scored ${score}/100.

${issuesList}
${historySection}
Success criteria to follow:
${successCriteria}

Key areas to focus on:
- Ensure it describes expertise and capabilities, not task lists
- Make it more adaptable and less prescriptive
- Remove any code examples or implementation snippets if present
- Adjust length to be around 30-35 lines for system instructions
- Ensure it clearly states what gets returned to the main agent
- Make it concrete without being a checklist
- Avoid rigid output formats or sections
- Check the description field isn't overusing USE PROACTIVELY

Current subagent definition (scored ${score}/100):

${definition}

Return the improved subagent definition file, maintaining the same structure but with refinements to better meet the criteria. Focus on subtle improvements - don't rewrite everything from scratch.`;

  try {
    console.error(`Improving subagent (iteration ${iteration}, current score: ${score})...`);
    const response = await callClaude(improvementPrompt);
    
    // Extract just the subagent definition
    const improvedDefinition = await extractSubagentDefinition(response);
    
    const outputFile = path.join(outputDir, `iteration-${iteration}.md`);
    await fs.writeFile(outputFile, improvedDefinition, 'utf-8');
    console.error(`Improvement iteration ${iteration} complete, saved to ${outputFile}`);
    
    return improvedDefinition;
  } catch (error) {
    console.error(`Error improving subagent:`, error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node generate-subagent-cli.js "<subagent description>"');
    console.error('Make sure you are logged in with: claude login');
    process.exit(1);
  }
  
  const subagentDescription = args.join(' ');
  
  try {
    // Create output directory
    const outputDir = await ensureOutputDir();
    console.error(`Output directory: ${outputDir}`);
    
    // Read the prompt template
    const promptTemplate = await readPromptTemplate();
    const prompt = promptTemplate.replace('$SUBAGENT', subagentDescription);
    
    // Extract success criteria
    const criteriaMatch = promptTemplate.match(/## Essential guidelines for subagent creation([\s\S]*?)### What is Claude Code\?/);
    const successCriteria = criteriaMatch ? criteriaMatch[1].trim() : '';
    
    // Step 1: Generate initial subagent with Claude
    let currentDefinition = await generateInitialSubagent(prompt, outputDir);
    
    // Step 2: Evaluate the initial generation
    let evaluation = await evaluateSubagent(currentDefinition, successCriteria);
    let score = evaluation.score;
    console.error(`Initial score: ${score}/100`);
    if (evaluation.issues && evaluation.issues.length > 0) {
      console.error(`Issues: ${evaluation.issues.join(', ')}`);
    }
    
    // Step 3-4: Improvement loop
    let iteration = 2;
    const maxIterations = 10;
    let bestScore = score;
    let bestDefinition = currentDefinition;
    let bestIteration = 1;
    let bestEvaluation = evaluation;
    
    // Track history of all attempts
    const history = [{
      score: score,
      issues: evaluation.issues,
      definition: currentDefinition
    }];
    
    while (bestScore < 95 && iteration <= maxIterations) {
      // Always improve from the best version so far
      const improvedDefinition = await improveSubagent(
        bestDefinition, 
        successCriteria, 
        bestEvaluation, 
        iteration, 
        outputDir,
        history
      );
      
      // Re-evaluate, passing the previous best evaluation for context
      const newEvaluation = await evaluateSubagent(improvedDefinition, successCriteria, bestEvaluation);
      const newScore = newEvaluation.score;
      console.error(`Iteration ${iteration} score: ${newScore}/100`);
      if (newEvaluation.issues && newEvaluation.issues.length > 0) {
        console.error(`Issues: ${newEvaluation.issues.join(', ')}`);
      }
      
      // Add to history
      history.push({
        score: newScore,
        issues: newEvaluation.issues,
        definition: improvedDefinition
      });
      
      // Update best if this is better
      if (newScore > bestScore) {
        console.error(`✓ New best score! (was ${bestScore}, now ${newScore})`);
        bestScore = newScore;
        bestDefinition = improvedDefinition;
        bestIteration = iteration;
        bestEvaluation = newEvaluation;
      } else if (newScore < bestScore) {
        console.error(`✗ Score didn't improve (best remains ${bestScore} from iteration ${bestIteration})`);
      } else {
        console.error(`= Score unchanged at ${newScore}`);
      }
      
      // Keep current for comparison
      currentDefinition = improvedDefinition;
      iteration++;
    }
    
    // Use the best version we found
    currentDefinition = bestDefinition;
    score = bestScore;
    
    if (score >= 95) {
      console.error(`✓ Successfully achieved score of ${score}/100 (from iteration ${bestIteration})`);
    } else {
      console.error(`⚠ Maximum iterations reached. Best score: ${score}/100 (from iteration ${bestIteration})`);
    }
    
    // Output the final definition to stdout
    console.log(currentDefinition);
    
    // Save the final definition to agent_files directory
    const agentFilesDir = path.join(__dirname, 'agent_files');
    await fs.mkdir(agentFilesDir, { recursive: true });
    
    // Extract the name from the YAML frontmatter to use as filename
    const nameMatch = currentDefinition.match(/^---\s*\nname:\s*(.+?)$/m);
    const filename = nameMatch 
      ? `${nameMatch[1].trim().toLowerCase().replace(/\s+/g, '-')}.md`
      : `subagent-${Date.now()}.md`;
    
    const outputPath = path.join(agentFilesDir, filename);
    await fs.writeFile(outputPath, currentDefinition, 'utf-8');
    // Also save a copy as "best.md" for easy identification
    const bestPath = path.join(outputDir, 'best.md');
    await fs.writeFile(bestPath, currentDefinition, 'utf-8');
    
    console.error(`\nFinal definition saved to: ${outputPath}`);
    console.error(`All iterations saved in: ${outputDir}`);
    console.error(`Best iteration (#${bestIteration}) also saved as: ${bestPath}`);
    console.error(`Final score: ${score}/100`);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();