#!/usr/bin/env node
// quick diagnostic for manifest + rules files
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './manifest.config.js';
import { info, warn } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function existsSync(p) {
  try {
    return !!(require('fs').statSync(p));
  } catch (e) {
    return false;
  }
}

async function diagnose() {
  const manifest = path.join(process.cwd(), config.outputFile);
  const rules = path.join(process.cwd(), config.rulesFile);
  info(`Diagnosing manifest: ${manifest}`);
  if (!existsSync(manifest)) {
    warn('Manifest file not found');
  } else {
    const stat = await fs.stat(manifest);
    info(`Manifest size: ${stat.size} bytes`);
    const content = await fs.readFile(manifest, 'utf8');
    if (!content || content.trim() === '') warn('Manifest file empty');
    else {
      try {
        const obj = JSON.parse(content);
        info(`Manifest top keys: ${Object.keys(obj).join(', ')}`);
      } catch (e) {
        warn(`Manifest JSON parse error: ${e.message}`);
      }
    }
  }
  info(`Checking rules file: ${rules}`);
  if (!existsSync(rules)) warn('Rules file not found');
  else {
    const stat = await fs.stat(rules);
    info(`Rules size: ${stat.size} bytes`);
  }
  // ensure images dir exists
  const imagesDir = path.join(process.cwd(), config.imagesDir);
  info(`Images dir: ${imagesDir}`);
  if (!existsSync(imagesDir)) warn('Images directory not found or empty');
  else {
    const readdir = await fs.readdir(imagesDir);
    info(`Image subentries count: ${readdir.length}`);
  }
}

diagnose().catch(e => {
  console.error(e);
  process.exit(1);
});
