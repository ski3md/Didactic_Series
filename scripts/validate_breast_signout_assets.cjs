const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CURRICULUM_PATH = path.join(ROOT, 'src', 'content', 'breast', 'breast_signout_curriculum.enhanced.json');
const SOURCE_MANIFEST_PATH = path.join(ROOT, 'src', 'content', 'breast', 'breast_signout_asset_sources.example.json');
const ACQUIRED_MANIFEST_PATH = path.join(ROOT, 'src', 'content', 'breast', 'breast_signout_acquired_assets.json');

const args = new Set(process.argv.slice(2));
const strictSourceCoverage = args.has('--strict-source-coverage');
const strictFiles = args.has('--strict-files');

const readJson = (filePath, fallback = undefined) => {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing JSON file: ${path.relative(ROOT, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const push = (bucket, message) => bucket.push(message);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const validate = () => {
  const failures = [];
  const warnings = [];
  const curriculum = readJson(CURRICULUM_PATH);
  const sourceManifest = readJson(SOURCE_MANIFEST_PATH);
  const acquiredManifest = readJson(ACQUIRED_MANIFEST_PATH, { assets: [] });

  if (!Array.isArray(curriculum.assetCategories) || curriculum.assetCategories.length < 5) {
    push(failures, 'Curriculum must define the five asset categories used by the breast sign-out program.');
  }

  if (!Array.isArray(curriculum.teachingMechanisms) || curriculum.teachingMechanisms.length < 4) {
    push(failures, 'Curriculum must define the missing teaching mechanisms: image-first, diagnostic commitment, sign-out efficiency, and synoptic build.');
  }

  const cases = Array.isArray(curriculum.cases) ? curriculum.cases : [];
  if (cases.length < 10) {
    push(failures, 'Curriculum must preserve all 10 original breast sign-out game cases.');
  }

  for (const item of cases) {
    if (!isNonEmptyString(item.id)) push(failures, 'Every case needs a stable id.');
    if (!isNonEmptyString(item.title)) push(failures, `${item.id || 'Unknown case'} is missing a title.`);
    if (!Array.isArray(item.visualEvidenceRequirements) || item.visualEvidenceRequirements.length === 0) {
      push(failures, `${item.id} has no visual evidence requirements.`);
    }
    if (!Array.isArray(item.diagnosticSteps) || item.diagnosticSteps.length < 2) {
      push(failures, `${item.id} needs at least two diagnostic reasoning steps.`);
    }
    if (!isNonEmptyString(item.reportingTarget)) {
      push(failures, `${item.id} is missing exact report language.`);
    }
    for (const step of item.diagnosticSteps || []) {
      if (!isNonEmptyString(step.prompt) || !isNonEmptyString(step.expectedObservation)) {
        push(failures, `${item.id} has a diagnostic step missing prompt or expected observation.`);
      }
    }
  }

  const entityCoverage = Array.isArray(curriculum.entityCoverage) ? curriculum.entityCoverage : [];
  if (entityCoverage.length < 25) {
    push(failures, 'Breast entity coverage must include the 25 local StainBrain breast entities.');
  }

  const sources = Array.isArray(sourceManifest.sources) ? sourceManifest.sources : [];
  if (sources.length === 0) {
    push(failures, 'Source manifest must contain at least one source entry or pending slot.');
  }

  const unresolved = [];
  const readySources = [];
  for (const source of sources) {
    if (!isNonEmptyString(source.id)) push(failures, 'Every source entry needs an id.');
    if (!isNonEmptyString(source.caseId) && !isNonEmptyString(source.entityId)) {
      push(failures, `${source.id || 'Unknown source'} needs a caseId or entityId.`);
    }
    if (!isNonEmptyString(source.role)) push(failures, `${source.id || 'Unknown source'} needs a diagnostic role.`);
    if (!isNonEmptyString(source.caption)) push(failures, `${source.id || 'Unknown source'} needs a clinically useful caption.`);

    if (source.kind === 'pending' || source.sourceStatus === 'needs_source_url_or_pdf_page' || source.sourceStatus === 'template_not_ready') {
      unresolved.push(source.id);
      continue;
    }

    if (source.kind === 'image_url' && !isNonEmptyString(source.url)) {
      push(failures, `${source.id} is image_url but has no url.`);
    } else if (source.kind === 'local_image' && !isNonEmptyString(source.path)) {
      push(failures, `${source.id} is local_image but has no path.`);
    } else if (source.kind === 'pdf_page' && !isNonEmptyString(source.pdfPath) && !isNonEmptyString(source.pdfUrl)) {
      push(failures, `${source.id} is pdf_page but has no pdfPath or pdfUrl.`);
    } else if (!['image_url', 'local_image', 'pdf_page'].includes(source.kind)) {
      push(failures, `${source.id} has unsupported kind: ${source.kind}`);
    } else {
      readySources.push(source);
    }
  }

  if (unresolved.length > 0) {
    push(warnings, `${unresolved.length} source slots are unresolved: ${unresolved.join(', ')}`);
    if (strictSourceCoverage) {
      push(failures, 'Strict source coverage is enabled and unresolved source slots remain.');
    }
  }

  const acquired = Array.isArray(acquiredManifest.assets)
    ? acquiredManifest.assets
    : Array.isArray(acquiredManifest)
      ? acquiredManifest
      : [];

  const acquiredBySource = new Map(acquired.map((asset) => [asset.sourceId, asset]));
  for (const source of readySources) {
    const asset = acquiredBySource.get(source.id);
    if (!asset) {
      push(warnings, `${source.id} has not been acquired into the local reference library yet.`);
      if (strictFiles) push(failures, `${source.id} is missing from acquired asset manifest.`);
      continue;
    }
    if (!isNonEmptyString(asset.localPath)) {
      push(failures, `${source.id} acquired asset is missing localPath.`);
      continue;
    }
    const absolutePath = path.join(ROOT, 'public', asset.localPath.replace(/^\/+/, ''));
    if (!fs.existsSync(absolutePath)) {
      push(warnings, `${source.id} local file is missing: ${asset.localPath}`);
      if (strictFiles) push(failures, `${source.id} local file is missing in strict mode.`);
    }
  }

  return {
    failures,
    warnings,
    summary: {
      cases: cases.length,
      entities: entityCoverage.length,
      sourceSlots: sources.length,
      readySources: readySources.length,
      unresolvedSources: unresolved.length,
      acquiredAssets: acquired.length,
      strictSourceCoverage,
      strictFiles,
    },
  };
};

try {
  const result = validate();
  console.log(JSON.stringify(result.summary, null, 2));
  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
  for (const failure of result.failures) console.error(`FAIL: ${failure}`);
  if (result.failures.length > 0) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
