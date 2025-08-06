#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// First, install the Anthropic SDK if not already installed
async function ensureAnthropicSDK() {
  try {
    require.resolve('@anthropic-ai/sdk');
  } catch (e) {
    console.error('Installing @anthropic-ai/sdk...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    await execAsync('npm install @anthropic-ai/sdk');
  }
}

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

async function callAI(model, prompt, outputDir) {
  const outputFile = path.join(outputDir, `${model}-raw.txt`);
  
  if (model === 'claude') {
    // Use the Anthropic SDK for Claude
    await ensureAnthropicSDK();
    const Anthropic = require('@anthropic-ai/sdk');
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    try {
      console.error(`Calling Claude via SDK with thinking...`);
      const message = await anthropic.beta.messages.create({
        model: "claude-opus-4-1-20250805",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 10
        }],
        thinking: {
          type: "enabled",
          budget_tokens: 16000
        }
      }, {
        headers: {
          'anthropic-beta': 'interleaved-thinking-2025-05-14'
        }
      });
      
      // Extract text from response, handling different content structures
      let response = '';
      if (message.content && Array.isArray(message.content)) {
        for (const item of message.content) {
          if (item.type === 'text' && item.text) {
            response += item.text;
          }
        }
      }
      if (!response && message.content && typeof message.content === 'string') {
        response = message.content;
      }
      await fs.writeFile(outputFile, response, 'utf-8');
      console.error(`${model} completed successfully, output saved to ${outputFile}`);
      return outputFile;
    } catch (error) {
      console.error(`Error calling Claude via SDK:`, error.message);
      return null;
    }
  } else if (model === 'openai') {
    // Use OpenAI SDK
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    try {
      console.error(`Calling OpenAI via SDK with reasoning...`);
      const completion = await openai.responses.create({
        model: "o4-mini-2025-04-16",
        input: prompt,
        reasoning: {
          effort: "high"
        },
        tools: [{ 
          type: "web_search_preview" 
        }],
      });
      
      const response = completion.output_text;
      await fs.writeFile(outputFile, response, 'utf-8');
      console.error(`${model} completed successfully, output saved to ${outputFile}`);
      return outputFile;
    } catch (error) {
      console.error(`Error calling OpenAI via SDK:`, error.message);
      return null;
    }
  } else if (model === 'gemini') {
    // Use Google GenAI SDK
    const { GoogleGenAI } = require('@google/genai');
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    
    try {
      console.error(`Calling Gemini via SDK with thinking...`);
      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          maxOutputTokens: 4096,
          tools: [{
            googleSearch: {}
          }],
          thinkingConfig: {
            thinkingBudget: 16000  // 16k tokens for thinking
          }
        }
      });
      
      const result = response.text;
      await fs.writeFile(outputFile, result, 'utf-8');
      console.error(`${model} completed successfully, output saved to ${outputFile}`);
      return outputFile;
    } catch (error) {
      console.error(`Error calling Gemini via SDK:`, error.message);
      return null;
    }
  } else {
    throw new Error(`Unknown model: ${model}`);
  }
}

async function extractSubagentDefinition(outputFile, model, outputDir) {
  if (!outputFile) {
    console.error(`No output file for ${model}`);
    return null;
  }
  
  try {
    const rawResponse = await fs.readFile(outputFile, 'utf-8');
    
    const extractPrompt = `You are a parser. Extract ONLY the subagent definition file from the following AI response.

The subagent definition file should be a Markdown file with YAML frontmatter containing these fields: name, display_name, description, display_description, category, and tags.

Look for content that starts with "---" (YAML frontmatter) and includes the markdown content after the closing "---".

If there are multiple subagent definitions in the response, choose the one that appears to be the final/best version.

Return ONLY the extracted subagent definition file, starting with the opening "---" and ending with the last line of markdown content. Do not add any explanation or commentary.

AI Response to parse:
${rawResponse}`;

    // Use Anthropic SDK for parsing
    await ensureAnthropicSDK();
    const Anthropic = require('@anthropic-ai/sdk');
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const message = await anthropic.beta.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 4096,
      messages: [{ role: "user", content: extractPrompt }],
      thinking: {
        type: "enabled",
        budget_tokens: 4000
      }
    }, {
      headers: {
        'anthropic-beta': 'interleaved-thinking-2025-05-14'
      }
    });
    
    // Extract text from response, handling different content structures
    let parsed = '';
    if (message.content && Array.isArray(message.content)) {
      for (const item of message.content) {
        if (item.type === 'text' && item.text) {
          parsed += item.text;
        }
      }
    }
    if (!parsed && message.content && typeof message.content === 'string') {
      parsed = message.content;
    }
    const parsedFile = path.join(outputDir, `${model}-parsed.md`);
    await fs.writeFile(parsedFile, parsed, 'utf-8');
    
    console.error(`Successfully parsed ${model} response`);
    return parsed.trim();
  } catch (error) {
    console.error(`Error parsing ${model} response:`, error.message);
    return null;
  }
}

async function evaluateWithDecider(definitions, successCriteria) {
  const deciderPrompt = `You are an expert evaluator of Claude Code subagent definition files.

Evaluate the following subagent definitions based on these success criteria from the requirements:

${successCriteria}

Think carefully about how effective each definition will be at guiding an AI to accomplish the stated goals. Consider:
- Adherence to the structural format (YAML frontmatter with required fields)
- Use of concrete, technical language
- Flexibility and resilience to varying environments
- Encouragement of directness and simplicity
- Clear, circumscribed role definition
- Quality of the description field
- Overall clarity and actionability

Here are the three subagent definitions to evaluate:

## Definition from Claude:
${definitions.claude || 'Failed to generate'}

## Definition from OpenAI:
${definitions.openai || 'Failed to generate'}

## Definition from Gemini:
${definitions.gemini || 'Failed to generate'}

Think hard about each definition's effectiveness at guiding the AI to accomplish the stated goals, then respond with ONLY a JSON object in this exact format:
{
  "claude": <number between 0-100>,
  "openai": <number between 0-100>,
  "gemini": <number between 0-100>,
  "winner": "<model_name with highest score>"
}`;

  // Use Anthropic SDK for evaluation
  await ensureAnthropicSDK();
  const Anthropic = require('@anthropic-ai/sdk');
  
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  try {
    const message = await anthropic.beta.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 2048,
      messages: [{ role: "user", content: deciderPrompt }],
      thinking: {
        type: "enabled",
        budget_tokens: 8000
      }
    }, {
      headers: {
        'anthropic-beta': 'interleaved-thinking-2025-05-14'
      }
    });
    
    // Extract text from response, handling different content structures
    let responseText = '';
    if (message.content && Array.isArray(message.content)) {
      for (const item of message.content) {
        if (item.type === 'text' && item.text) {
          responseText += item.text;
        }
      }
    }
    if (!responseText && message.content && typeof message.content === 'string') {
      responseText = message.content;
    }
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON in decider response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error with decider evaluation:', error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node generate-subagent.js "<subagent description>"');
    console.error('Make sure ANTHROPIC_API_KEY, OPENAI_API_KEY, and GEMINI_API_KEY are set in your environment');
    process.exit(1);
  }
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is not set');
    process.exit(1);
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY environment variable is not set');
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
    
    // Extract success criteria for the decider
    const criteriaMatch = promptTemplate.match(/## Essential guidelines for subagent creation([\s\S]*?)### What is Claude Code\?/);
    const successCriteria = criteriaMatch ? criteriaMatch[1].trim() : '';
    
    console.error('Generating subagent definitions in parallel...');
    
    // Call all three AIs in parallel, writing to files
    const [claudeFile, openaiFile, geminiFile] = await Promise.all([
      callAI('claude', prompt, outputDir),
      callAI('openai', prompt, outputDir),
      callAI('gemini', prompt, outputDir)
    ]);
    
    console.error('Extracting subagent definitions from responses...');
    
    // Extract subagent definitions from each file
    const [claudeDef, openaiDef, geminiDef] = await Promise.all([
      extractSubagentDefinition(claudeFile, 'claude', outputDir),
      extractSubagentDefinition(openaiFile, 'openai', outputDir),
      extractSubagentDefinition(geminiFile, 'gemini', outputDir)
    ]);
    
    const definitions = {
      claude: claudeDef,
      openai: openaiDef,
      gemini: geminiDef
    };
    
    console.error('Evaluating definitions with Claude Opus decider...');
    
    // Have Claude Opus evaluate and pick the best one
    const evaluation = await evaluateWithDecider(definitions, successCriteria);
    
    console.error(`Winner: ${evaluation.winner}`);
    console.error(`Scores: Claude=${evaluation.claude}, OpenAI=${evaluation.openai}, Gemini=${evaluation.gemini}`);
    
    // Output the winning definition to stdout
    const winningDefinition = definitions[evaluation.winner];
    if (winningDefinition) {
      console.log(winningDefinition);
      
      // Also save the winning definition to agent_files directory
      const agentFilesDir = path.join(__dirname, 'agent_files');
      await fs.mkdir(agentFilesDir, { recursive: true });
      
      // Extract the name from the YAML frontmatter to use as filename
      const nameMatch = winningDefinition.match(/^---\s*\nname:\s*(.+?)$/m);
      const filename = nameMatch 
        ? `${nameMatch[1].trim().toLowerCase().replace(/\s+/g, '-')}.md`
        : `subagent-${Date.now()}.md`;
      
      const outputPath = path.join(agentFilesDir, filename);
      await fs.writeFile(outputPath, winningDefinition, 'utf-8');
      console.error(`\nWinning definition saved to: ${outputPath}`);
      console.error(`Intermediate files saved in: ${outputDir}`);
    } else {
      console.error('Error: No valid definition found');
      console.error(`Check intermediate files in: ${outputDir}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();