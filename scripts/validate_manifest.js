#!/usr/bin/env node
// ES module: validate manifest; also exports default for programmatic invocation
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './manifest.config.js';
import { info, warn, error } from './utils/logger.js';
import Ajv from 'ajv';
import * as futils from './utils/file_utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function validate({ manifestPath = path.join(process.cwd(), config.outputFile), fix = false, verbose = false } = {}) {
  try {
    info(`Validating manifest: ${manifestPath}`, { logFile: config.logFile });
    const raw = await futils.readJSONSafe(manifestPath);
    if (!raw) throw new Error('Manifest file empty or unreadable');

    // Basic structural checks
    if (!raw.categories || typeof raw.categories !== 'object') throw new Error('Missing categories structure');

    // collect ids and missing fields
    const ids = new Set();
    const duplicates = [];
    const missing = [];
    const required = ['id', 'entity', 'category', 'stain', 'path'];
    for (const category of Object.keys(raw.categories)) {
      for (const entity of Object.keys(raw.categories[category])) {
        for (const stain of Object.keys(raw.categories[category][entity])) {
          const arr = raw.categories[category][entity][stain];
          for (const img of arr) {
            // required fields check
            for (const r of required) {
              if (!img[r]) missing.push(`${img.id || 'unknown'}:${r}`);
            }
            if (ids.has(img.id)) duplicates.push(img.id);
            else ids.add(img.id);
          }
        }
      }
    }

    if (missing.length) {
      warn(`Missing required fields (${missing.length}): ${missing.slice(0,5).join(', ')}`, { logFile: config.logFile });
    }
    if (duplicates.length) {
      warn(`Duplicate IDs found: ${[...new Set(duplicates)].slice(0,5).join(', ')}`, { logFile: config.logFile });
      if (fix) {
        info('Fixing duplicate IDs...', { logFile: config.logFile });
        // add timestamp suffix to duplicates
        for (const category of Object.keys(raw.categories)) {
          for (const entity of Object.keys(raw.categories[category])) {
            for (const stain of Object.keys(raw.categories[category][entity])) {
              const arr = raw.categories[category][entity][stain];
              for (let i = 0; i < arr.length; i++) {
                const img = arr[i];
                if (duplicates.includes(img.id)) {
                  const newId = `${img.entity}_${img.stain.toLowerCase()}_${Date.now()}_${i}`;
                  info(`Reid ${img.id} -> ${newId}`, { logFile: config.logFile });
                  img.id = newId;
                }
              }
            }
          }
        }
        await futils.safeWriteJSON(manifestPath, raw, config.tmpSuffix);
        info('Duplicate IDs fixed and manifest updated', { logFile: config.logFile });
      }
    }

    // Optional schema validation if schema file exists
    const schemaPath = path.join(__dirname, 'docs', 'manifest_schema.json');
    try {
      const schemaRaw = await futils.readJSONSafe(schemaPath);
      if (schemaRaw) {
        const ajv = new Ajv({ allErrors: true, strict: false });
        const validateFn = ajv.compile(schemaRaw);
        const ok = validateFn(raw);
        if (!ok) {
          warn('Schema validation failed', { logFile: config.logFile });
          if (verbose) {
            console.log(validateFn.errors);
          }
          if (fix) {
            warn('Auto-fix for schema errors is limited; please inspect errors', { logFile: config.logFile });
          }
        } else info('Schema validation passed', { logFile: config.logFile });
      } else {
        if (verbose) info('No schema found; skipped AJV validation', { logFile: config.logFile });
      }
    } catch (err) {
      warn('Schema validation error: ' + err.message, { logFile: config.logFile });
    }

    info('Validation complete', { logFile: config.logFile });
    return true;
  } catch (err) {
    error(`Validation error: ${err.message}`, { logFile: config.logFile });
    return false;
  }
}

if (process.argv[1].endsWith('validate_manifest.js')) {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const verbose = args.includes('--verbose');
  const manifestArg = args.find(a => a.startsWith('--manifest=')) || '';
  const manifestPath = manifestArg ? manifestArg.split('=')[1] : undefined;
  validate({ manifestPath, fix, verbose }).then(ok => process.exit(ok ? 0 : 1));
}

export default validate;
