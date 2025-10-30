#!/usr/bin/env node
// ES module: main manifest builder
import path from 'path';
import { fileURLToPath } from 'url';
import config from './manifest.config.js';
import { info, warn, error, debug } from './utils/logger.js';
import * as futils from './utils/file_utils.js';
import * as taxonomy from './utils/taxonomy.js';
import { normalizeMetadata } from './utils/json_utils.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const argv = process.argv.slice(2);
  const opts = {
    useAI: argv.includes('--ai'),
    validate: argv.includes('--validate'),
    out: config.outputFile
  };
  info(`Manifest builder starting (ai=${opts.useAI})`, { logFile: config.logFile });

  // load rules or fallback to default
  let rules = await taxonomy.loadRules(path.join(process.cwd(), config.rulesFile)).catch(() => null);
  if (!rules) {
    warn('metadata_rules.json not found or unreadable - continuing with minimal rules', { logFile: config.logFile });
    rules = { entities: {}, stainRoles: {} };
  }

  // scan images
  const imagesAbsoluteRoot = path.join(process.cwd(), config.imagesDir);
  const files = futils.listFilesRecursive(imagesAbsoluteRoot);
  info(`Found ${files.length} image file(s) under ${config.imagesDir}`, { logFile: config.logFile });

  // build manifest structure: categories -> entity -> stain -> [images]
  const manifest = {
    generated: new Date().toISOString(),
    ai_enhanced: opts.useAI,
    version: '1.0.0',
    schema: config.defaultSchemaVersion,
    categories: {}
  };

  for (const f of files) {
    try {
      const relPath = path.relative(process.cwd(), f).replace(/\\/g, '/');
      const infer = taxonomy.inferFromPath(relPath, rules);
      let { entity, category, stain } = infer;
      const sanitizedEntity = (entity || 'unknown').toLowerCase().replace(/\s+/g, '_');
      const sanitizedStain = stain.replace(/\s+/g, '_').toUpperCase();
      // metadata base
      const id = `${sanitizedEntity}_${futils.safeHash(relPath)}`;
      const meta = {
        id,
        entity,
        category,
        pattern: rules.entities?.[entity]?.patterns?.[0]?.description || '',
        cells: rules.entities?.[entity]?.cells || ['epithelioid histiocytes'],
        stain: sanitizedStain,
        stainRole: rules.stainRoles?.[stain] || '',
        organ: 'lung',
        system: 'thoracic',
        difficulty: rules.entities?.[entity]?.difficulty || 'intermediate',
        path: `/${relPath}`,
        tags: rules.entities?.[entity]?.tags || [category, entity, sanitizedStain.toLowerCase()],
        teachingPoint: rules.entities?.[entity]?.teachingPoint || '',
        source: 'local'
      };

      let normalized = normalizeMetadata(meta);

      // optionally AI enrich (synchronous)
      if (opts.useAI) {
        try {
          const { enrichWithAI } = await import('./ai_enrichment.js');
          normalized = await enrichWithAI(normalized, { model: config.ai.model, maxTokens: config.ai.maxTokens, temperature: config.ai.temperature, logFile: config.logFile });
        } catch (err) {
          warn(`AI enrichment failed for ${relPath}: ${err.message}`, { logFile: config.logFile });
        }
      }

      // ensure category + entity + stain buckets exist
      if (!manifest.categories[category]) manifest.categories[category] = {};
      if (!manifest.categories[category][entity]) manifest.categories[category][entity] = {};
      if (!manifest.categories[category][entity][sanitizedStain]) manifest.categories[category][entity][sanitizedStain] = [];

      manifest.categories[category][entity][sanitizedStain].push(normalized);

      debug(`Added ${normalized.id}`, { logFile: config.logFile });
    } catch (err) {
      warn(`Skipping file ${f}: ${err.message}`, { logFile: config.logFile });
    }
  }

  // write manifest safely
  const outPath = path.join(process.cwd(), opts.out);
  await futils.safeWriteJSON(outPath, manifest, config.tmpSuffix);
  info(`Image manifest written to ${opts.out}`, { logFile: config.logFile });

  // optional validate
  if (opts.validate) {
    info('Validating manifest...', { logFile: config.logFile });
    try {
      const { default: validateScript } = await import('./validate_manifest.js');
      // validate_manifest exports default function for programmatic use
      await validateScript({ manifestPath: outPath, fix: true, verbose: true });
    } catch (err) {
      warn('Validation failed to run programmatically: ' + err.message, { logFile: config.logFile });
    }
  }

  // build stats
  await buildStats(outPath);
  info('Manifest build complete', { logFile: config.logFile });
}

async function buildStats(manifestPath) {
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    let totalImages = 0;
    const categoryCounts = {}, entityCounts = {}, stainCounts = {};
    for (const [category, entities] of Object.entries(manifest.categories || {})) {
      categoryCounts[category] = 0;
      for (const [entity, stains] of Object.entries(entities)) {
        entityCounts[entity] = 0;
        for (const [stain, images] of Object.entries(stains)) {
          stainCounts[stain] = (stainCounts[stain] || 0) + images.length;
          entityCounts[entity] += images.length;
          categoryCounts[category] += images.length;
          totalImages += images.length;
        }
      }
    }
    const stats = {
      generated: new Date().toISOString(),
      totalImages,
      categoryCounts,
      entityCounts,
      stainCounts
    };
    await futils.safeWriteJSON(path.join(process.cwd(), config.statsFile), stats, config.tmpSuffix);
    info(`Manifest stats saved to ${config.statsFile}`, { logFile: config.logFile });
  } catch (err) {
    warn('Failed to generate stats: ' + err.message, { logFile: config.logFile });
  }
}

if (import.meta.url === `file://${process.argv[1]}` || import.meta.url.endsWith('/manifest_builder.js')) {
  main().catch((err) => {
    error('Manifest builder fatal: ' + err.stack, { logFile: config.logFile });
    process.exit(1);
  });
}

export default main; // programmatic export
