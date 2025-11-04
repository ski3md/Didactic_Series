#!/usr/bin/env node

// Quick Fix Script for Empty/Corrupted Manifest
// Usage: node fix_manifest.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_FILE = path.join(__dirname, 'src/assets/data/image_manifest.json');
const METADATA_RULES_FILE = path.join(__dirname, 'src/assets/data/metadata_rules.json');

console.log('🔧 Fixing manifest files...');

// Create empty manifest if needed
if (!fs.existsSync(MANIFEST_FILE) || fs.readFileSync(MANIFEST_FILE, 'utf8').trim() === '') {
  const emptyManifest = {
    generated: new Date().toISOString(),
    ai_enhanced: false,
    version: "1.0.0",
    schema: "who-2022-thoracic",
    categories: {}
  };
  
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(emptyManifest, null, 2));
  console.log('✅ Created empty manifest file');
}

// Create empty rules if needed
if (!fs.existsSync(METADATA_RULES_FILE) || fs.readFileSync(METADATA_RULES_FILE, 'utf8').trim() === '') {
  const emptyRules = {
    version: "1.0.0",
    schema: "who-2022-thoracic",
    entities: {},
    stainRoles: {
      "H&E": "general morphology",
      "GMS": "highlight fungal cell walls",
      "PAS": "highlight fungal cell walls and mucin",
      "AFB": "highlight mycobacterial organisms",
      "Polarized": "reveal polarizable foreign material"
    },
    difficultyLevels: {
      "beginner": "Classic presentations with obvious diagnostic features",
      "intermediate": "Moderate diagnostic complexity, requires pattern recognition",
      "advanced": "Subtle findings, mimics, or rare presentations"
    }
  };
  
  fs.writeFileSync(METADATA_RULES_FILE, JSON.stringify(emptyRules, null, 2));
  console.log('✅ Created empty rules file');
}

console.log('🎉 Fix complete! Now run: node validate_manifest.js');