#!/usr/bin/env node
// rebuild manifest and default rules from scratch (safe)
import fs from 'fs/promises';
import path from 'path';
import config from './manifest.config.js';
import { info, warn } from './utils/logger.js';
import * as futils from './utils/file_utils.js';

async function rebuild() {
  info('Rebuilding manifest and metadata rules (safe defaults)...', { logFile: config.logFile });
  // minimal manifest skeleton
  const manifest = {
    generated: new Date().toISOString(),
    ai_enhanced: false,
    version: '1.0.0',
    schema: config.defaultSchemaVersion,
    categories: {}
  };
  // default rules (extend as needed)
  const rules = {
    version: '1.0.0',
    schema: config.defaultSchemaVersion,
    entities: {
      tuberculosis: {
        category: 'infectious',
        patterns: [{ keyword: 'caseous', description: 'caseating necrosis' }],
        cells: ['epithelioid histiocytes', 'Langhans giant cells'],
        difficulty: 'advanced',
        tags: ['mycobacterial', 'caseating'],
        teachingPoint: 'Caseating granulomas with central necrosis suggest mycobacterial infection (e.g., TB).'
      },
      histoplasmosis: {
        category: 'infectious',
        patterns: [{ keyword: 'yeast', description: 'intracellular yeast forms' }],
        cells: ['epithelioid histiocytes', 'intracellular yeast'],
        difficulty: 'advanced',
        tags: ['fungal', 'dimorphic'],
        teachingPoint: 'Small intracellular yeast forms with narrow-based budding are characteristic of histoplasmosis.'
      },
      sarcoidosis: {
        category: 'noninfectious',
        patterns: [{ keyword: 'noncaseating', description: 'noncaseating granulomas' }],
        cells: ['epithelioid histiocytes', 'asteroid bodies (sometimes)'],
        difficulty: 'intermediate',
        tags: ['noncaseating', 'systemic'],
        teachingPoint: 'Noncaseating granulomas in the appropriate clinical setting support sarcoidosis.'
      }
    },
    stainRoles: {
      'H&E': 'general morphology',
      'GMS': 'highlight fungal cell walls',
      'PAS': 'highlight fungal cell walls and mucin',
      'AFB': 'highlight mycobacterial organisms',
      'Polarized': 'reveal polarizable foreign material'
    },
    difficultyLevels: {
      beginner: 'Classic presentations with obvious diagnostic features',
      intermediate: 'Moderate diagnostic complexity, requires pattern recognition',
      advanced: 'Subtle findings, mimics, or rare presentations'
    }
  };

  // ensure directories
  await futils.ensureDir(path.dirname(path.join(process.cwd(), config.outputFile)));
  await futils.ensureDir(path.dirname(path.join(process.cwd(), config.rulesFile)));

  // write safely
  await futils.safeWriteJSON(path.join(process.cwd(), config.outputFile), manifest, config.tmpSuffix);
  await futils.safeWriteJSON(path.join(process.cwd(), config.rulesFile), rules, config.tmpSuffix);

  info(`Rebuilt manifest and rules at ${config.outputFile} and ${config.rulesFile}`, { logFile: config.logFile });
  info('Done', { logFile: config.logFile });
}

rebuild().catch(e => {
  console.error(e);
  process.exit(1);
});
