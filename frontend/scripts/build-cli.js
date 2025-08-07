#!/usr/bin/env node

import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildCLI() {
  // Default to production, use NODE_ENV=development for local testing
  const isDev = process.env.NODE_ENV === 'development';
  const apiUrl = isDev ? 'http://localhost:3000' : 'https://ipa.io7.dev';
  
  console.log(`Building CLI with API URL: ${apiUrl} (${isDev ? 'development' : 'production'})`);
  
  // Read the source file
  const sourcePath = join(__dirname, '../cli/index.js');
  const distPath = join(__dirname, '../cli/index.built.js');
  
  const content = await readFile(sourcePath, 'utf8');
  
  // Replace the placeholder with the actual URL
  const updatedContent = content.replace('__API_BASE_URL__', apiUrl);
  
  // Write the built file
  await writeFile(distPath, updatedContent, 'utf8');
  
  console.log(`✓ CLI built successfully to cli/index.built.js`);
}

buildCLI().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});