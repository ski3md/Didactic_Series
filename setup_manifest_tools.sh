#!/usr/bin/env bash
# Script to automatically set up the manifest tools project structure

set -euo pipefail

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if project directory exists
if [ -d "scripts" ] || [ -d "src" ]; then
    print_warning "Project directories already exist. This may overwrite existing files."
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setup cancelled."
        exit 0
    fi
fi

# Create directory structure
print_info "Creating directory structure..."
mkdir -p scripts/utils
mkdir -p scripts/docs
mkdir -p src/assets/images/granulomas
mkdir -p src/assets/data
mkdir -p logs

# Create manifest.config.js
print_info "Creating scripts/manifest.config.js..."
cat > scripts/manifest.config.js << 'EOF'
// ES module config for manifest tools
export default {
  projectRoot: process.cwd(),
  imagesDir: 'src/assets/images/granulomas', // change if your images live elsewhere
  outputFile: 'src/assets/data/image_manifest.json',
  rulesFile: 'src/assets/data/metadata_rules.json',
  statsFile: 'src/assets/data/manifest_stats.json',
  logFile: 'logs/manifest.log',
  schemaFile: 'scripts/docs/manifest_schema.json',
  defaultSchemaVersion: 'who-2022-thoracic',
  tmpSuffix: '.tmp',
  ai: {
    enabled: false, // default; overridden by CLI flag
    model: 'gpt-4',
    maxTokens: 400,
    temperature: 0.2
  }
};
EOF

# Create logger.js
print_info "Creating scripts/utils/logger.js..."
cat > scripts/utils/logger.js << 'EOF'
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const now = () => new Date().toISOString();

export async function writeLog(logFile, line) {
  try {
    await fs.mkdir(path.dirname(logFile), { recursive: true });
    await fs.appendFile(logFile, `${line}\n`, 'utf8');
  } catch (e) {
    // don't throw for logging
    // eslint-disable-next-line no-console
    console.error('Logger write failed', e.message);
  }
}

export function info(msg, opts = {}) {
  const line = `[INFO] ${now()} ${msg}`;
  // user-visible
  // eslint-disable-next-line no-console
  console.log(chalk.green(line));
  if (opts.logFile) writeLog(opts.logFile, line);
}
export function warn(msg, opts = {}) {
  const line = `[WARN] ${now()} ${msg}`;
  // eslint-disable-next-line no-console
  console.log(chalk.yellow(line));
  if (opts.logFile) writeLog(opts.logFile, line);
}
export function error(msg, opts = {}) {
  const line = `[ERROR] ${now()} ${msg}`;
  // eslint-disable-next-line no-console
  console.error(chalk.red(line));
  if (opts.logFile) writeLog(opts.logFile, line);
}
export function debug(msg, opts = {}) {
  const line = `[DEBUG] ${now()} ${msg}`;
  if (process.env.DEBUG) {
    // eslint-disable-next-line no-console
    console.log(chalk.gray(line));
  }
  if (opts.logFile) writeLog(opts.logFile, line);
}
EOF

# Create file_utils.js
print_info "Creating scripts/utils/file_utils.js..."
cat > scripts/utils/file_utils.js << 'EOF'
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export function safeHash(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 12);
}

// Write JSON safely: write to tmp then rename
export async function safeWriteJSON(targetPath, obj, tmpSuffix = '.tmp') {
  const dir = path.dirname(targetPath);
  await ensureDir(dir);
  const tmpPath = `${targetPath}${tmpSuffix}`;
  const data = JSON.stringify(obj, null, 2);
  await fs.writeFile(tmpPath, data, 'utf8');
  await fs.rename(tmpPath, targetPath);
}

// Read JSON but handle empty/malformed gracefully
export async function readJSONSafe(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw || raw.trim() === '') return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function listFilesRecursive(baseDir, exts = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.svs']) {
  // synchronous walk for speed and predictability
  const files = [];
  function walk(dir) {
    const entries = fsSync.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const low = path.extname(e.name).toLowerCase();
        if (exts.includes(low)) files.push(full);
      }
    }
  }
  if (fsSync.existsSync(baseDir)) walk(baseDir);
  return files;
}
EOF

# Create taxonomy.js
print_info "Creating scripts/utils/taxonomy.js..."
cat > scripts/utils/taxonomy.js << 'EOF'
import fs from 'fs/promises';
import path from 'path';

// load rules JSON (metadata_rules.json)
export async function loadRules(rulesPath) {
  try {
    const raw = await fs.readFile(rulesPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

// heuristics: infer entity and stain from file path names
export function inferFromPath(filePath, rules) {
  const fn = filePath.toLowerCase();
  // stain detection
  const stainMap = ['gms', 'pas', 'h&e', 'h&e', 'he', 'afb', 'polarized', 'polar'];
  let stain = 'H&E';
  for (const s of stainMap) {
    if (fn.includes(`/${s}/`) || fn.includes(`_${s}_`) || fn.includes(`-${s}-`) || fn.includes(` ${s} `)) {
      stain = s.toUpperCase().replace('HE', 'H&E');
      break;
    }
  }
  // entity detection by keyword
  let entity = 'unknown';
  if (rules && rules.entities) {
    for (const candidate of Object.keys(rules.entities)) {
      if (fn.includes(candidate.toLowerCase())) {
        entity = candidate;
        break;
      }
      // also check patterns
      const patterns = rules.entities[candidate]?.patterns || [];
      for (const p of patterns) {
        if (p.keyword && fn.includes(p.keyword.toLowerCase())) {
          entity = candidate;
          break;
        }
      }
      if (entity !== 'unknown') break;
    }
  }

  // category lookup from entity if available
  let category = rules?.entities?.[entity]?.category || 'unmapped';
  return { entity, category, stain };
}
EOF

# Create json_utils.js
print_info "Creating scripts/utils/json_utils.js..."
cat > scripts/utils/json_utils.js << 'EOF'
export function toCamel(s) {
  return s.replace(/[_-][a-z]/g, (m) => m[1].toUpperCase());
}

export function normalizeMetadata(raw) {
  // ensure keys we need exist and follow camelCase
  const out = {};
  out.id = raw.id;
  out.entity = raw.entity || 'unknown';
  out.category = raw.category || 'unmapped';
  out.pattern = raw.pattern || '';
  out.cells = raw.cells || [];
  out.stain = raw.stain || 'H&E';
  out.stainRole = raw.stainRole || '';
  out.organ = raw.organ || 'lung';
  out.system = raw.system || 'thoracic';
  out.difficulty = raw.difficulty || 'intermediate';
  out.path = raw.path;
  out.tags = raw.tags || [];
  out.teachingPoint = raw.teachingPoint || '';
  out.source = raw.source || 'local';
  return out;
}
EOF

# Create ai_enrichment.js
print_info "Creating scripts/ai_enrichment.js..."
cat > scripts/ai_enrichment.js << 'EOF'
// ES module optional AI enrichment helper
import { fileURLToPath } from 'url';
import path from 'path';
import { info, warn, error } from './utils/logger.js';

export async function enrichWithAI(metadata, config) {
  // metadata: object
  // config: { model, maxTokens, temperature }
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    warn('OPENAI_API_KEY not set; skipping AI enrichment', { logFile: config.logFile });
    metadata.aiEnhanced = false;
    metadata.aiNote = 'No OPENAI_API_KEY';
    return metadata;
  }

  let OpenAI;
  try {
    ({ OpenAI } = await import('openai'));
  } catch (err) {
    warn('openai SDK not installed; skip AI enrichment', { logFile: config.logFile });
    metadata.aiEnhanced = false;
    metadata.aiNote = 'OpenAI SDK missing';
    return metadata;
  }

  try {
    const client = new OpenAI({ apiKey: OPENAI_KEY });
    const prompt = `Enhance the following pathology image metadata JSON. Add a concise 2-sentence teaching point, 3 short diagnostic tags, key histologic features (3), and 2 differential considerations. Return valid JSON only.\n\n${JSON.stringify(metadata, null, 2)}`;
    const resp = await client.chat.completions.create({
      model: config.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature ?? 0.2,
      max_tokens: config.maxTokens ?? 400
    });
    const txt = resp.choices?.[0]?.message?.content;
    if (!txt) throw new Error('Empty response from AI');
    // try parse
    try {
      const enriched = JSON.parse(txt);
      enriched.aiEnhanced = true;
      enriched.aiEnrichmentAt = new Date().toISOString();
      return enriched;
    } catch (parseErr) {
      // fallback: attach raw text
      metadata.aiEnhanced = true;
      metadata.aiRaw = txt;
      return metadata;
    }
  } catch (err) {
    error(`AI enrichment error: ${err.message}`, { logFile: config.logFile });
    metadata.aiEnhanced = false;
    metadata.aiError = err.message;
    return metadata;
  }
}
EOF

# Create manifest_builder.js
print_info "Creating scripts/manifest_builder.js..."
cat > scripts/manifest_builder.js << 'EOF'
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
EOF

# Create generate_manifest.sh
print_info "Creating scripts/generate_manifest.sh..."
cat > scripts/generate_manifest.sh << 'EOF'
#!/usr/bin/env bash
# wrapper for manifest_builder
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE=$(command -v node || echo node)
AI=false
VALIDATE=false
for arg in "$@"; do
  case "$arg" in
    --ai) AI=true ;;
    --validate) VALIDATE=true ;;
    --out=*) OUT="${arg#--out=}" ;;
  esac
done

CMD_ARGS=()
 $AI && CMD_ARGS+=("--ai")
 $VALIDATE && CMD_ARGS+=("--validate")
 $OUT && CMD_ARGS+=("--out=$OUT")

echo "🛠️  Running manifest builder (ai=$AI, validate=$VALIDATE)"
cd "$SCRIPT_DIR" || exit 1
 $NODE manifest_builder.js "${CMD_ARGS[@]}"
echo "✅ generate_manifest.sh finished"
EOF

# Create validate_manifest.js
print_info "Creating scripts/validate_manifest.js..."
cat > scripts/validate_manifest.js << 'EOF'
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
EOF

# Create diagnose_manifest.js
print_info "Creating scripts/diagnose_manifest.js..."
cat > scripts/diagnose_manifest.js << 'EOF'
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
EOF

# Create rebuild_manifest.js
print_info "Creating scripts/rebuild_manifest.js..."
cat > scripts/rebuild_manifest.js << 'EOF'
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
EOF

# Create manifest_schema.json
print_info "Creating scripts/docs/manifest_schema.json..."
cat > scripts/docs/manifest_schema.json << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Image Manifest (WHO thoracic)",
  "type": "object",
  "required": ["generated","schema","categories"],
  "properties": {
    "generated": { "type": "string", "format": "date-time" },
    "schema": { "type": "string" },
    "version": { "type": "string" },
    "categories": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["id","entity","category","stain","path"],
              "properties": {
                "id": { "type": "string" },
                "entity": { "type": "string" },
                "category": { "type": "string" },
                "stain": { "type": "string" },
                "path": { "type": "string" },
                "difficulty": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}
EOF

# Create README.md
print_info "Creating scripts/docs/README.md..."
cat > scripts/docs/README.md << 'EOF'
Manifest Tools - README

Commands:
- node scripts/diagnose_manifest.js
- node scripts/rebuild_manifest.js
- ./scripts/generate_manifest.sh --validate
- ./scripts/generate_manifest.sh --ai --validate

Dependencies:
- node >= 18
- npm install openai ajv chalk
- set OPENAI_API_KEY if using --ai

Outputs:
- src/assets/data/image_manifest.json
- src/assets/data/metadata_rules.json
- src/assets/data/manifest_stats.json
- logs/manifest.log
EOF

# Create package.json
print_info "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "didactic-series",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "manifest:generate": "node scripts/manifest_builder.js",
    "manifest:validate": "node scripts/validate_manifest.js",
    "manifest:rebuild": "node scripts/rebuild_manifest.js",
    "manifest:diagnose": "node scripts/diagnose_manifest.js"
  },
  "dependencies": {
    "openai": "^4.0.0",
    "ajv": "^8.0.0",
    "chalk": "^5.0.0"
  }
}
EOF