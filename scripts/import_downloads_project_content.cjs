#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const DOWNLOADS_ROOT = '/Users/skim4/Downloads';
const OUTPUT_ROOT = path.join(ROOT, 'src', 'content', 'downloads_imports');
const RAW_ROOT = path.join(OUTPUT_ROOT, 'raw');
const NORMALIZED_ROOT = path.join(OUTPUT_ROOT, 'normalized');
const PROVENANCE_ROOT = path.join(OUTPUT_ROOT, 'provenance');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
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

function loadPythonAssignment(filePath, variableName) {
  const pythonScript = [
    'import ast',
    'import json',
    'import sys',
    'from pathlib import Path',
    'path = Path(sys.argv[1])',
    'variable_name = sys.argv[2]',
    'module = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))',
    'for node in module.body:',
    '    if isinstance(node, ast.Assign):',
    '        for target in node.targets:',
    '            if isinstance(target, ast.Name) and target.id == variable_name:',
    '                print(json.dumps(ast.literal_eval(node.value)))',
    '                raise SystemExit(0)',
    'raise SystemExit(f"Variable {variable_name} not found in {path}")',
  ].join('\n');

  const output = execFileSync('python3', ['-c', pythonScript, filePath, variableName], {
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

function formatSection(title, lines) {
  const cleaned = lines.filter(Boolean);
  if (!cleaned.length) {
    return '';
  }
  return [`## ${title}`, ...cleaned].join('\n');
}

function formatBulletLines(items) {
  return (items || []).map((item) => `- ${item}`);
}

function stageRawJson(sourcePath, targetFileName, payload, sourceRepo, description) {
  const targetPath = path.join(RAW_ROOT, targetFileName);
  writeJson(targetPath, payload);
  const recordCount = Array.isArray(payload)
    ? payload.length
    : payload && typeof payload === 'object'
      ? Object.keys(payload).length
      : 0;

  return {
    sourceRepo,
    sourcePath,
    targetPath: path.relative(ROOT, targetPath),
    description,
    sha256: sha256File(targetPath),
    recordCount,
  };
}

function normalizeIocLectures(rawRecords, sourcePath) {
  return rawRecords.map((record) => {
    const overview = record.payload.overview || {};
    const keyPointLines = (overview.key_points || []).map(
      (item) => `- ${item.label}: ${item.text}`
    );
    const triadLines = formatBulletLines(record.payload.triad || overview.triad_summary || []);

    return {
      id: `ioc-overview-${slugify(record.serviceLine)}`,
      sourceRepo: 'ioc-next-app',
      sourcePath,
      contentType: 'lecture',
      title: overview.title || `${record.serviceLine} IOC Overview`,
      category: record.serviceLine,
      summary: keyPointLines[0] ? keyPointLines[0].replace(/^- /, '') : `${record.serviceLine} intraoperative consultation overview.`,
      body: [formatSection('Key Points', keyPointLines), formatSection('Triad Summary', triadLines)]
        .filter(Boolean)
        .join('\n\n'),
      learningObjectives: [],
      slides: [],
      mcqs: [],
      flashcards: [],
      references: [],
      tags: [record.serviceLine, 'ioc'],
      provenance: {
        triad: record.payload.triad || [],
        keyPointCount: (overview.key_points || []).length,
      },
    };
  });
}

function normalizeIocEntities(rawRecords, sourcePath) {
  return rawRecords.map((record) => {
    const casePointLines = (record.payload.case_points || []).map(
      (item) => `- ${item.label}: ${item.text}`
    );
    const sketchLines = formatBulletLines(record.payload.sketch || []);

    return {
      id: `ioc-entity-${slugify(record.entityName)}`,
      sourceRepo: 'ioc-next-app',
      sourcePath,
      contentType: 'tutorial',
      title: String(record.payload.title || record.entityName).replace(/\s+Modal$/, ''),
      category: 'Intraoperative Consultation',
      summary: record.payload.action || record.payload.consequence || `IOC teaching brief for ${record.entityName}.`,
      body: [
        formatSection('Case Points', casePointLines),
        formatSection('Sketch', sketchLines),
        formatSection('Pitfall', record.payload.pitfall ? [record.payload.pitfall] : []),
        formatSection('Consequence', record.payload.consequence ? [record.payload.consequence] : []),
        formatSection('Action', record.payload.action ? [record.payload.action] : []),
      ]
        .filter(Boolean)
        .join('\n\n'),
      learningObjectives: [],
      slides: [],
      mcqs: [],
      flashcards: [],
      references: [],
      tags: ['ioc', record.entityName],
      provenance: {
        casePointCount: (record.payload.case_points || []).length,
        sketchCount: (record.payload.sketch || []).length,
      },
    };
  });
}

function normalizeAbpathExport(rawRecords, sourcePath) {
  return rawRecords.map(([topicId, payload]) => {
    const tutorial = payload.tutorial || {};
    return {
      id: topicId,
      sourceRepo: 'abpath-advanced-board-prep-platform (3)',
      sourcePath,
      contentType: 'tutorial',
      title: tutorial.title || topicId,
      category: null,
      summary: tutorial.visualType ? `Visual type: ${tutorial.visualType}` : 'Advanced board prep tutorial export.',
      body: String(tutorial.content || '').trim(),
      learningObjectives: [],
      slides: [],
      mcqs: payload.mcqs || [],
      flashcards: payload.flashcards || [],
      references: [],
      tags: tutorial.visualType ? [tutorial.visualType] : [],
      provenance: {
        topicId,
        visualType: tutorial.visualType || null,
      },
    };
  });
}

function normalizePregeneratedTutorials(rawRecords, sourcePath, sourceRepo) {
  return rawRecords.map((record) => ({
    id: slugify(record.topic),
    sourceRepo,
    sourcePath,
    contentType: 'tutorial',
    title: record.topic,
    category: null,
    summary: record.tutorial?.title || record.topic,
    body: String(record.tutorial?.content || '').trim(),
    learningObjectives: [],
    slides: [],
    mcqs: record.mcqs || [],
    flashcards: record.flashcards || [],
    references: [],
    tags: [record.topic],
    provenance: {
      tutorialTitle: record.tutorial?.title || null,
      mcqCount: (record.mcqs || []).length,
      flashcardCount: (record.flashcards || []).length,
    },
  }));
}

function renderCpCaseTutorial(tutorial) {
  const labLines = (tutorial.labFindings || []).map(
    (item) => `- ${item.title}: ${item.description}`
  );
  const pathLines = (tutorial.diagnosticPath || [])
    .sort((left, right) => (left.step || 0) - (right.step || 0))
    .map((item) => `- Step ${item.step}: ${item.title} - ${item.description}`);

  return [
    formatSection('Patient Presentation', tutorial.patientPresentation ? [tutorial.patientPresentation] : []),
    formatSection('Lab Findings', labLines),
    formatSection('Diagnostic Path', pathLines),
    formatSection('Discussion', tutorial.discussion ? [tutorial.discussion] : []),
    formatSection('Final Diagnosis', tutorial.finalDiagnosis ? [tutorial.finalDiagnosis] : []),
    formatSection('Key Takeaways', formatBulletLines(tutorial.keyTakeaways || [])),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function normalizeCpTutorials(rawBundle, sourcePath) {
  const tutorials = rawBundle.TUTORIAL_DATA || {};
  const mcqs = rawBundle.MCQS || [];

  return Object.values(tutorials).map((tutorial) => ({
    id: tutorial.id || slugify(tutorial.title),
    sourceRepo: 'cp-content-specification-tutorial_11.11.25',
    sourcePath,
    contentType: 'tutorial',
    title: tutorial.title,
    category: null,
    summary: tutorial.finalDiagnosis || tutorial.patientPresentation,
    body: renderCpCaseTutorial(tutorial),
    learningObjectives: [],
    slides: [],
    mcqs: mcqs.filter((item) => (tutorial.relatedTopics || []).includes(item.topicId)),
    flashcards: [],
    references: [],
    tags: tutorial.relatedTopics || [],
    provenance: {
      relatedTopics: tutorial.relatedTopics || [],
      labFindingCount: (tutorial.labFindings || []).length,
      diagnosticStepCount: (tutorial.diagnosticPath || []).length,
    },
  }));
}

function renderGranulomaModule(moduleRecord) {
  const caseTutorial = moduleRecord.case_tutorial || {};
  return [
    formatSection('Clinical Vignette', caseTutorial.clinicalVignette ? [caseTutorial.clinicalVignette] : []),
    formatSection('Objective', caseTutorial.objective ? [caseTutorial.objective] : []),
    formatSection('Case Discussion', caseTutorial.caseDiscussion ? [caseTutorial.caseDiscussion] : []),
    formatSection('Teaching Points', formatBulletLines(caseTutorial.teachingPoints || [])),
    formatSection('References', formatBulletLines(caseTutorial.references || [])),
    formatSection(
      'Gold Standard Report',
      [
        caseTutorial.goldStandardReport?.finalDiagnosis && `Final Diagnosis: ${caseTutorial.goldStandardReport.finalDiagnosis}`,
        caseTutorial.goldStandardReport?.microscopicDescription && `Microscopic Description: ${caseTutorial.goldStandardReport.microscopicDescription}`,
        caseTutorial.goldStandardReport?.comment && `Comment: ${caseTutorial.goldStandardReport.comment}`,
      ].filter(Boolean)
    ),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function normalizeGranulomaModules(rawRecords, sourcePath) {
  return rawRecords.map((moduleRecord) => ({
    id: slugify(moduleRecord.topic),
    sourceRepo: 'pathology-learning-module_-granulomatous-diseases (3)',
    sourcePath,
    contentType: 'tutorial',
    title: moduleRecord.case_tutorial?.title || moduleRecord.topic,
    category: 'Granulomatous Disease',
    summary: moduleRecord.case_tutorial?.objective || `Granulomatous disease module for ${moduleRecord.topic}.`,
    body: renderGranulomaModule(moduleRecord),
    learningObjectives: [],
    slides: [],
    mcqs: moduleRecord.mcqs || [],
    flashcards: moduleRecord.flashcards || [],
    references: moduleRecord.case_tutorial?.references || [],
    tags: [moduleRecord.topic],
    provenance: {
      status: moduleRecord.status || null,
      topic: moduleRecord.topic,
    },
  }));
}

function normalizeBacterialAlgorithm(rawData, sourcePath) {
  const nodeCount = Object.keys(rawData || {}).length;
  const firstNode = rawData.initial_assessment || null;
  return [
    {
      id: 'bacterial-diagnosis-algorithm',
      sourceRepo: 'workspace-3418f879-7689-4224-9717-636b27130563',
      sourcePath,
      contentType: 'algorithm',
      title: 'Bacterial Diagnosis Algorithm',
      category: 'Microbiology',
      summary: firstNode?.question || 'Decision tree for bacterial microorganism diagnosis.',
      body: [
        formatSection('Initial Assessment', [
          firstNode?.question || '',
          firstNode?.information || '',
          ...(firstNode?.tests || []).map((item) => `Test: ${item}`),
        ]),
        formatSection(
          'Initial Branches',
          (firstNode?.options || []).map((item) => `${item.text} -> ${item.next}`)
        ),
      ]
        .filter(Boolean)
        .join('\n\n'),
      learningObjectives: [],
      slides: [],
      mcqs: [],
      flashcards: [],
      references: [],
      tags: ['microbiology', 'bacteria'],
      provenance: {
        nodeCount,
        nodes: rawData,
      },
    },
  ];
}

function normalizeGalleryImages(rawGallery, sourcePath) {
  const collections = ['official', 'community'];
  const records = [];

  for (const collection of collections) {
    for (const image of rawGallery[collection] || []) {
      records.push({
        id: image.id,
        sourceRepo: 'pathology-learning-module_-granulomatous-diseases (3)',
        sourcePath,
        contentType: 'image',
        title: image.title,
        description: image.description,
        src: image.src,
        category: image.category || collection,
        uploader: image.uploader,
        timestamp: image.timestamp,
        entity: image.entity || null,
        difficulty: image.difficulty || null,
        tags: image.tags || [],
        provenance: {
          collection,
          gcsPath: image.gcsPath || null,
          cells: image.cells || [],
        },
      });
    }
  }

  return records;
}

function main() {
  ensureDir(RAW_ROOT);
  ensureDir(NORMALIZED_ROOT);
  ensureDir(PROVENANCE_ROOT);

  const sourceRecords = [];

  const iocOverviewDir = path.join(DOWNLOADS_ROOT, 'ioc-next-app', 'ioc-modal-complete-upgrade', 'data', 'overview');
  const iocEntityDir = path.join(DOWNLOADS_ROOT, 'ioc-next-app', 'ioc-modal-complete-upgrade', 'data', 'entity');
  const iocOverviewRecords = fs.readdirSync(iocOverviewDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => {
      const fullPath = path.join(iocOverviewDir, fileName);
      return {
        serviceLine: decodeURIComponent(path.basename(fileName, '.json')),
        sourcePath: fullPath,
        payload: readJson(fullPath),
      };
    });
  const iocEntityRecords = fs.readdirSync(iocEntityDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => {
      const fullPath = path.join(iocEntityDir, fileName);
      return {
        entityName: path.basename(fileName, '.json'),
        sourcePath: fullPath,
        payload: readJson(fullPath),
      };
    });
  sourceRecords.push(
    stageRawJson(
      iocOverviewDir,
      'ioc_overviews.raw.json',
      iocOverviewRecords,
      'ioc-next-app',
      'IOC overview JSON records from the modal upgrade data directory.'
    ),
    stageRawJson(
      iocEntityDir,
      'ioc_entities.raw.json',
      iocEntityRecords,
      'ioc-next-app',
      'IOC entity modal JSON records from the modal upgrade data directory.'
    )
  );

  const abpathExportPath = path.join(DOWNLOADS_ROOT, 'abpath-advanced-board-prep-platform (3)', 'abpath_export_1766721402593.json');
  const abpathExport = readJson(abpathExportPath);
  sourceRecords.push(
    stageRawJson(
      abpathExportPath,
      'abpath_advanced_board_prep_export.raw.json',
      abpathExport,
      'abpath-advanced-board-prep-platform (3)',
      'Primary advanced board prep tutorial export.'
    )
  );

  const cpBatchModulePath = path.join(DOWNLOADS_ROOT, 'cp-content-specification-tutorial-batch-ready', 'pregeneratedData.ts');
  const cpBatchModule = loadTsModule(cpBatchModulePath);
  const cpBatchData = cpBatchModule.PREGENERATED_DATA || [];
  sourceRecords.push(
    stageRawJson(
      cpBatchModulePath,
      'cp_content_specification_batch_ready.raw.json',
      cpBatchData,
      'cp-content-specification-tutorial-batch-ready',
      'Pre-generated case tutorials, MCQs, and flashcards.'
    )
  );

  const cpConstantsPath = path.join(DOWNLOADS_ROOT, 'cp-content-specification-tutorial_11.11.25', 'constants.ts');
  const cpConstantsModule = loadTsModule(cpConstantsPath);
  const cpConstantsBundle = {
    SYLLABUS_DATA: cpConstantsModule.SYLLABUS_DATA || [],
    TUTORIAL_DATA: cpConstantsModule.TUTORIAL_DATA || {},
    MCQS: cpConstantsModule.MCQS || [],
    FLASHCARDS: cpConstantsModule.FLASHCARDS || [],
  };
  sourceRecords.push(
    stageRawJson(
      cpConstantsPath,
      'cp_content_specification_11_11_25.raw.json',
      cpConstantsBundle,
      'cp-content-specification-tutorial_11.11.25',
      'Tutorial, syllabus, MCQ, and flashcard constants bundle.'
    )
  );

  const dashboardDataDir = path.join(DOWNLOADS_ROOT, 'dashboard1', 'backend', 'data');
  const dashboardFiles = [
    'hematology_entities.json',
    'coag_factors.json',
    'chemistry_cases.json',
    'transfusion_antibodies.json',
    'immunology_nodes.json',
  ];
  const dashboardBundle = {};
  for (const fileName of dashboardFiles) {
    const fullPath = path.join(dashboardDataDir, fileName);
    dashboardBundle[fileName] = readJson(fullPath);
  }
  sourceRecords.push(
    stageRawJson(
      dashboardDataDir,
      'dashboard1_backend_datasets.raw.json',
      dashboardBundle,
      'dashboard1',
      'Backend educational JSON datasets for hematology, coagulation, chemistry, transfusion, and immunology.'
    )
  );

  const granulomaModulesPath = path.join(DOWNLOADS_ROOT, 'pathology-learning-module_-granulomatous-diseases (3)', 'data', 'modules.ts');
  const granulomaModulesModule = loadTsModule(granulomaModulesPath);
  const granulomaModules = granulomaModulesModule.modules || [];
  sourceRecords.push(
    stageRawJson(
      granulomaModulesPath,
      'granulomatous_modules.raw.json',
      granulomaModules,
      'pathology-learning-module_-granulomatous-diseases (3)',
      'Granulomatous disease tutorial modules.'
    )
  );

  const granulomaGalleryPath = path.join(DOWNLOADS_ROOT, 'pathology-learning-module_-granulomatous-diseases (3)', 'data', 'gallery.json');
  const granulomaGallery = readJson(granulomaGalleryPath);
  sourceRecords.push(
    stageRawJson(
      granulomaGalleryPath,
      'granulomatous_gallery.raw.json',
      granulomaGallery,
      'pathology-learning-module_-granulomatous-diseases (3)',
      'Granulomatous disease gallery metadata with remote image URLs.'
    )
  );

  const granulomaRulesPath = path.join(DOWNLOADS_ROOT, 'pathology-learning-module_-granulomatous-diseases (3)', 'src', 'data', 'caseMetadataRules.json');
  const granulomaRules = readJson(granulomaRulesPath);
  sourceRecords.push(
    stageRawJson(
      granulomaRulesPath,
      'granulomatous_case_metadata_rules.raw.json',
      granulomaRules,
      'pathology-learning-module_-granulomatous-diseases (3)',
      'Granulomatous disease case metadata rules.'
    )
  );

  const bacterialAlgorithmPath = path.join(DOWNLOADS_ROOT, 'workspace-3418f879-7689-4224-9717-636b27130563', 'bacterial_algorithm_data.py');
  const bacterialAlgorithm = loadPythonAssignment(bacterialAlgorithmPath, 'BACTERIAL_ALGORITHM_DATA');
  sourceRecords.push(
    stageRawJson(
      bacterialAlgorithmPath,
      'bacterial_algorithm_data.raw.json',
      bacterialAlgorithm,
      'workspace-3418f879-7689-4224-9717-636b27130563',
      'Microbiology bacterial diagnosis decision tree.'
    )
  );

  const lecturesNormalized = normalizeIocLectures(
    iocOverviewRecords,
    'src/content/downloads_imports/raw/ioc_overviews.raw.json'
  );
  const tutorialsNormalized = [
    ...normalizeIocEntities(iocEntityRecords, 'src/content/downloads_imports/raw/ioc_entities.raw.json'),
    ...normalizeAbpathExport(abpathExport, 'src/content/downloads_imports/raw/abpath_advanced_board_prep_export.raw.json'),
    ...normalizePregeneratedTutorials(
      cpBatchData,
      'src/content/downloads_imports/raw/cp_content_specification_batch_ready.raw.json',
      'cp-content-specification-tutorial-batch-ready'
    ),
    ...normalizeCpTutorials(
      cpConstantsBundle,
      'src/content/downloads_imports/raw/cp_content_specification_11_11_25.raw.json'
    ),
    ...normalizeGranulomaModules(
      granulomaModules,
      'src/content/downloads_imports/raw/granulomatous_modules.raw.json'
    ),
  ];
  const algorithmsNormalized = normalizeBacterialAlgorithm(
    bacterialAlgorithm,
    'src/content/downloads_imports/raw/bacterial_algorithm_data.raw.json'
  );
  const imagesNormalized = normalizeGalleryImages(
    granulomaGallery,
    'src/content/downloads_imports/raw/granulomatous_gallery.raw.json'
  );

  writeJson(path.join(NORMALIZED_ROOT, 'lectures.normalized.json'), lecturesNormalized);
  writeJson(path.join(NORMALIZED_ROOT, 'tutorials.normalized.json'), tutorialsNormalized);
  writeJson(path.join(NORMALIZED_ROOT, 'algorithms.normalized.json'), algorithmsNormalized);
  writeJson(path.join(NORMALIZED_ROOT, 'images.normalized.json'), imagesNormalized);

  writeJson(path.join(PROVENANCE_ROOT, 'source_manifest.json'), { sources: sourceRecords });
  writeJson(path.join(OUTPUT_ROOT, 'catalog.json'), {
    counts: {
      lectures: lecturesNormalized.length,
      tutorials: tutorialsNormalized.length,
      algorithms: algorithmsNormalized.length,
      images: imagesNormalized.length,
    },
    sources: [
      'ioc-next-app',
      'abpath-advanced-board-prep-platform (3)',
      'cp-content-specification-tutorial-batch-ready',
      'cp-content-specification-tutorial_11.11.25',
      'dashboard1',
      'pathology-learning-module_-granulomatous-diseases (3)',
      'workspace-3418f879-7689-4224-9717-636b27130563',
    ],
    normalizedOutputs: {
      lectures: 'src/content/downloads_imports/normalized/lectures.normalized.json',
      tutorials: 'src/content/downloads_imports/normalized/tutorials.normalized.json',
      algorithms: 'src/content/downloads_imports/normalized/algorithms.normalized.json',
      images: 'src/content/downloads_imports/normalized/images.normalized.json',
    },
    rawPayloads: [
      'src/content/downloads_imports/raw/ioc_overviews.raw.json',
      'src/content/downloads_imports/raw/ioc_entities.raw.json',
      'src/content/downloads_imports/raw/abpath_advanced_board_prep_export.raw.json',
      'src/content/downloads_imports/raw/cp_content_specification_batch_ready.raw.json',
      'src/content/downloads_imports/raw/cp_content_specification_11_11_25.raw.json',
      'src/content/downloads_imports/raw/dashboard1_backend_datasets.raw.json',
      'src/content/downloads_imports/raw/granulomatous_modules.raw.json',
      'src/content/downloads_imports/raw/granulomatous_gallery.raw.json',
      'src/content/downloads_imports/raw/granulomatous_case_metadata_rules.raw.json',
      'src/content/downloads_imports/raw/bacterial_algorithm_data.raw.json',
    ],
  });

  console.log('Imported structured Downloads project content successfully.');
  console.log(`Lectures: ${lecturesNormalized.length}`);
  console.log(`Tutorials: ${tutorialsNormalized.length}`);
  console.log(`Algorithms: ${algorithmsNormalized.length}`);
  console.log(`Images: ${imagesNormalized.length}`);
}

main();
