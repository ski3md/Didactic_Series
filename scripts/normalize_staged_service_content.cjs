#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const STAGING_ROOT = path.join(ROOT, 'src', 'content', 'staging');
const OUTPUT_ROOT = path.join(ROOT, 'src', 'content', 'derived');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function sanitizeSource(source) {
  return source
    .replace(/^\s*import\s+type\s+[^;]+;\s*$/gm, '')
    .replace(/^\s*import\s+[^;]+;\s*$/gm, '');
}

function loadTsModule(modulePath) {
  const source = fs.readFileSync(modulePath, 'utf8');
  const transpiled = ts.transpileModule(sanitizeSource(source), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: modulePath,
  }).outputText;

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require: () => {
      throw new Error(`Runtime require is not supported while evaluating ${modulePath}`);
    },
    console,
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(transpiled, sandbox, { filename: modulePath });
  return sandbox.module.exports;
}

function countObjectKeys(value) {
  return value && typeof value === 'object' ? Object.keys(value).length : 0;
}

const moduleSpecs = [
  {
    source: path.join(STAGING_ROOT, 'stainbrain_printable', 'services', 'lectureData.ts'),
    outputs: [
      {
        exportName: 'LECTURES',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'lectures.from_service.json'),
        summarize: (value) => ({ lectureCount: Array.isArray(value) ? value.length : 0 }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain_printable', 'services', 'algorithmData.ts'),
    outputs: [
      {
        exportName: 'ALGORITHMS',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'algorithms.from_service.json'),
        summarize: (value) => ({ algorithmCount: Array.isArray(value) ? value.length : 0 }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain_printable', 'services', 'tutorialContent.ts'),
    outputs: [
      {
        exportName: 'tutorialSections',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'tutorial_sections.from_service.json'),
        summarize: (value) => ({ tutorialSectionCount: Array.isArray(value) ? value.length : 0 }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain_printable', 'services', 'networkData.ts'),
    outputs: [
      {
        exportName: 'RAW_NODES',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'network_nodes.from_service.json'),
        summarize: (value) => ({ nodeCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'RAW_LINKS',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'network_links.from_service.json'),
        summarize: (value) => ({ linkCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'EXTENDED_DATA',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'network_extended.from_service.json'),
        summarize: (value) => ({ extendedRecordCount: countObjectKeys(value) }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain_printable', 'services', 'histologyImageService.ts'),
    outputs: [
      {
        exportName: 'HISTOLOGY_IMAGES',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'histology_images.from_service.json'),
        summarize: (value) => ({ histologyImageCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'HISTOLOGY_IMAGE_DATA',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'histology_image_buckets.from_service.json'),
        summarize: (value) => ({ histologyBucketCount: countObjectKeys(value) }),
      },
      {
        exportName: 'SEARCH_TERM_OVERRIDES',
        target: path.join(OUTPUT_ROOT, 'stainbrain_printable', 'histology_search_overrides.from_service.json'),
        summarize: (value) => ({ searchOverrideCount: countObjectKeys(value) }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'tutorialContent.ts'),
    outputs: [
      {
        exportName: 'tutorialSections',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'tutorial_sections.from_service.json'),
        summarize: (value) => ({ tutorialSectionCount: Array.isArray(value) ? value.length : 0 }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'algorithmData.ts'),
    outputs: [
      {
        exportName: 'ALGORITHMS',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'algorithms.from_service.json'),
        summarize: (value) => ({ algorithmCount: Array.isArray(value) ? value.length : 0 }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'algorithmDatav2.ts'),
    outputs: [
      {
        exportName: 'ALGORITHMS',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'algorithms_v2.from_service.json'),
        summarize: (value) => ({ algorithmCount: Array.isArray(value) ? value.length : 0 }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'networkData.ts'),
    outputs: [
      {
        exportName: 'RAW_NODES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'network_nodes.from_service.json'),
        summarize: (value) => ({ nodeCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'RAW_LINKS',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'network_links.from_service.json'),
        summarize: (value) => ({ linkCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'EXTENDED_DATA',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'network_extended.from_service.json'),
        summarize: (value) => ({ extendedRecordCount: countObjectKeys(value) }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'histologyImageService.ts'),
    outputs: [
      {
        exportName: 'HISTOLOGY_IMAGE_DATA',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'histology_image_buckets.from_service.json'),
        summarize: (value) => ({ histologyBucketCount: countObjectKeys(value) }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'educationalCases.ts'),
    outputs: [
      {
        exportName: 'educationalCases',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'educational_cases.from_service.json'),
        summarize: (value) => ({ educationalCaseCount: Array.isArray(value) ? value.length : 0 }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'caseTutorData.ts'),
    outputs: [
      {
        exportName: 'BONE_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_bone.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'SOFT_TISSUE_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_soft_tissue.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'SKIN_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_skin.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'GYN_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_gyn.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'BREAST_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_breast.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'GU_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_gu.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'THORACIC_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_thoracic.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'GI_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_gi.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'NEURO_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_neuro.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
      {
        exportName: 'HEADNECK_PATHOLOGY_ENTITIES',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'case_tutor_entities_headneck.from_service.json'),
        summarize: (value) => ({ entityCount: Array.isArray(value) ? value.length : 0 }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'caseGeneratorData.ts'),
    outputs: [
      {
        exportName: 'BST_GENERATOR_DATA',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'generator_data_bst.from_service.json'),
        summarize: (value) => ({ profileCount: countObjectKeys(value) }),
      },
      {
        exportName: 'DERMPATH_GENERATOR_DATA',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'generator_data_dermpath.from_service.json'),
        summarize: (value) => ({ profileCount: countObjectKeys(value) }),
      },
      {
        exportName: 'GYN_GENERATOR_DATA',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'generator_data_gyn.from_service.json'),
        summarize: (value) => ({ profileCount: countObjectKeys(value) }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'differentialDiagnosisData.ts'),
    outputs: [
      {
        exportName: 'DIFFERENTIAL_DIAGNOSIS_MAP',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'differential_diagnosis_map.from_service.json'),
        summarize: (value) => ({ familyCount: countObjectKeys(value) }),
      },
    ],
  },
  {
    source: path.join(STAGING_ROOT, 'stainbrain', 'services', 'whoClassificationService.ts'),
    outputs: [
      {
        exportName: 'WHO_CLASSIFICATION_DATA',
        target: path.join(OUTPUT_ROOT, 'stainbrain', 'who_classification.from_service.json'),
        summarize: (value) => ({ familyCount: countObjectKeys(value) }),
      },
    ],
  },
];

const manifest = [];

for (const spec of moduleSpecs) {
  if (!fs.existsSync(spec.source)) {
    throw new Error(`Missing staged source file: ${spec.source}`);
  }

  const exportsMap = loadTsModule(spec.source);
  for (const output of spec.outputs) {
    if (!(output.exportName in exportsMap)) {
      throw new Error(`Export ${output.exportName} not found in ${spec.source}`);
    }

    const value = exportsMap[output.exportName];
    writeJson(output.target, value);
    manifest.push({
      source: path.relative(ROOT, spec.source),
      exportName: output.exportName,
      target: path.relative(ROOT, output.target),
      summary: output.summarize(value),
    });
  }
}

writeJson(path.join(OUTPUT_ROOT, 'derived_manifest.json'), {
  generatedAt: new Date().toISOString(),
  outputs: manifest,
});

console.log(`Wrote ${manifest.length} derived JSON exports.`);
