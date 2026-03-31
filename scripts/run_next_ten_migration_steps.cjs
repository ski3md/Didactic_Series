#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOWNLOADS_IMPORT_ROOT = path.join(ROOT, 'src', 'content', 'downloads_imports');
const NORMALIZED_ROOT = path.join(DOWNLOADS_IMPORT_ROOT, 'normalized');
const PLANNING_ROOT = path.join(DOWNLOADS_IMPORT_ROOT, 'planning');

const SOURCE_RULES = {
  'ioc-next-app': {
    displayName: 'Core Principles Library',
    strategicFit: 0.9,
    dataQuality: 0.88,
    recommendedAction: 'Promote as a distinct didactic lecture and tutorial library with pathology-topic filters.',
    rationale: 'Clean lecture/tutorial structure, clinically coherent, and immediately usable as an education-first teaching vertical.',
  },
  'abpath-advanced-board-prep-platform (3)': {
    displayName: 'ABPath Advanced Board Prep',
    strategicFit: 0.84,
    dataQuality: 0.8,
    recommendedAction: 'Promote selected high-yield pathology tutorials into the main board prep surface after curation.',
    rationale: 'Large tutorial corpus with MCQs/flashcards, but broad scope means it needs curation before mainline exposure.',
  },
  'cp-content-specification-tutorial-batch-ready': {
    displayName: 'CP Tutorial Batch Ready',
    strategicFit: 0.79,
    dataQuality: 0.83,
    recommendedAction: 'Promote as a focused CP tutorial subset with explicit board-prep labeling.',
    rationale: 'Structured tutorials with strong MCQ/flashcard density and lower cleanup cost than the larger ABPath corpus.',
  },
  'cp-content-specification-tutorial_11.11.25': {
    displayName: 'CP Tutorial 11.11.25',
    strategicFit: 0.73,
    dataQuality: 0.77,
    recommendedAction: 'Fold into the CP queue after topic deduplication against the batch-ready set.',
    rationale: 'Small but useful tutorial set; risk is mainly duplication and inconsistent case naming.',
  },
  'pathology-learning-module_-granulomatous-diseases (3)': {
    displayName: 'Granulomatous Diseases Module',
    strategicFit: 0.97,
    dataQuality: 0.86,
    recommendedAction: 'Promote images and granulomatous tutorials first because they align directly with the current app domain.',
    rationale: 'Highest topical alignment with the existing app and already compatible with the histology-centered UI.',
  },
  'workspace-3418f879-7689-4224-9717-636b27130563': {
    displayName: 'Microbiology Algorithm Workspace',
    strategicFit: 0.48,
    dataQuality: 0.7,
    recommendedAction: 'Keep staged until a microbiology or infectious-disease workflow is intentionally added.',
    rationale: 'Algorithm is structured, but its subject matter is broader and less aligned with the current pathology module.',
  },
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, 'utf8');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function topCounts(map, limit = 10) {
  return Object.entries(map)
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }
      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function createSourceStats() {
  return {
    sourceRepo: '',
    lectures: 0,
    tutorials: 0,
    algorithms: 0,
    images: 0,
    mcqs: 0,
    flashcards: 0,
    categories: new Set(),
    entities: new Set(),
    imageEntities: new Set(),
    tags: new Set(),
    sampleTitles: [],
  };
}

function scoreSource(stats) {
  const rule = SOURCE_RULES[stats.sourceRepo] || {
    displayName: stats.sourceRepo,
    strategicFit: 0.65,
    dataQuality: 0.65,
    recommendedAction: 'Review manually before promotion.',
    rationale: 'No source-specific rule exists yet.',
  };

  const contentYield =
    (stats.lectures * 14) +
    (stats.tutorials * 2.2) +
    (stats.algorithms * 10) +
    (stats.images * 0.3) +
    (stats.mcqs * 0.08) +
    (stats.flashcards * 0.04);
  const breadth = (stats.categories.size * 2.5) + (stats.entities.size * 2) + (stats.imageEntities.size * 0.6);
  const score = Number(((rule.strategicFit * 55) + (rule.dataQuality * 25) + Math.min(contentYield, 120) * 0.15 + Math.min(breadth, 40) * 0.4).toFixed(2));

  return {
    ...rule,
    score,
  };
}

function toArraySet(set) {
  return [...set].sort((left, right) => left.localeCompare(right));
}

function summarizeRecordTitle(record) {
  if (record.summary) {
    return `${record.title}: ${record.summary}`.slice(0, 180);
  }
  return String(record.title).slice(0, 180);
}

function buildPromotionQueues(datasets, sourceRanking) {
  const rankingMap = new Map(sourceRanking.map((entry) => [entry.sourceRepo, entry.score]));

  const lectureQueue = datasets.lectures
    .map((record) => ({
      id: record.id,
      title: record.title,
      sourceRepo: record.sourceRepo,
      category: record.category,
      priorityScore: rankingMap.get(record.sourceRepo) || 0,
      promotionTarget: 'Downloads Library -> Core principles lecture module',
      rationale: 'Lecture-format pathology overview with clean topic taxonomy.',
    }))
    .sort((left, right) => right.priorityScore - left.priorityScore || left.title.localeCompare(right.title));

  const tutorialQueue = datasets.tutorials
    .map((record) => {
      const mcqCount = (record.mcqs || []).length;
      const flashcardCount = (record.flashcards || []).length;
      const sourceScore = rankingMap.get(record.sourceRepo) || 0;
      const learningAssetDensity = (mcqCount * 1.5) + flashcardCount;
      return {
        id: record.id,
        title: record.title,
        sourceRepo: record.sourceRepo,
        category: record.category,
        mcqCount,
        flashcardCount,
        priorityScore: Number((sourceScore + Math.min(learningAssetDensity, 25)).toFixed(2)),
        promotionTarget: record.sourceRepo === 'pathology-learning-module_-granulomatous-diseases (3)'
          ? 'Main granulomatous tutorial surface'
          : 'Downloads Library -> Board prep surface',
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore || left.title.localeCompare(right.title));

  const algorithmQueue = datasets.algorithms
    .map((record) => ({
      id: record.id,
      title: record.title,
      sourceRepo: record.sourceRepo,
      category: record.category,
      nodeCount: Number(record.provenance?.nodeCount || 0),
      priorityScore: Number(((rankingMap.get(record.sourceRepo) || 0) + Math.min(Number(record.provenance?.nodeCount || 0), 100) * 0.12).toFixed(2)),
      promotionTarget: 'Keep in Downloads Library until an algorithm navigator is added',
    }))
    .sort((left, right) => right.priorityScore - left.priorityScore || left.title.localeCompare(right.title));

  const imageQueue = datasets.images
    .map((record) => ({
      id: record.id,
      title: record.title,
      sourceRepo: record.sourceRepo,
      entity: record.entity || null,
      difficulty: record.difficulty || null,
      priorityScore: Number(((rankingMap.get(record.sourceRepo) || 0) + (record.entity ? 8 : 0)).toFixed(2)),
      promotionTarget: 'Curated atlas and granulomatous workflow',
    }))
    .sort((left, right) => right.priorityScore - left.priorityScore || left.title.localeCompare(right.title));

  return {
    lectures: lectureQueue,
    tutorials: tutorialQueue,
    algorithms: algorithmQueue,
    images: imageQueue,
  };
}

function main() {
  const lectures = readJson(path.join(NORMALIZED_ROOT, 'lectures.normalized.json'));
  const tutorials = readJson(path.join(NORMALIZED_ROOT, 'tutorials.normalized.json'));
  const algorithms = readJson(path.join(NORMALIZED_ROOT, 'algorithms.normalized.json'));
  const images = readJson(path.join(NORMALIZED_ROOT, 'images.normalized.json'));
  const datasets = { lectures, tutorials, algorithms, images };

  ensureDir(PLANNING_ROOT);

  const validation = {
    generatedAt: new Date().toISOString(),
    root: path.relative(ROOT, DOWNLOADS_IMPORT_ROOT),
    datasets: {
      lectures: lectures.length,
      tutorials: tutorials.length,
      algorithms: algorithms.length,
      images: images.length,
    },
    checks: [
      { name: 'Lectures imported', status: lectures.length > 0 ? 'pass' : 'fail' },
      { name: 'Tutorials imported', status: tutorials.length > 0 ? 'pass' : 'fail' },
      { name: 'Algorithms imported', status: algorithms.length > 0 ? 'pass' : 'fail' },
      { name: 'Images imported', status: images.length > 0 ? 'pass' : 'fail' },
    ],
  };

  const sourceStatsMap = new Map();
  const getStats = (sourceRepo) => {
    if (!sourceStatsMap.has(sourceRepo)) {
      const stats = createSourceStats();
      stats.sourceRepo = sourceRepo;
      sourceStatsMap.set(sourceRepo, stats);
    }
    return sourceStatsMap.get(sourceRepo);
  };

  for (const record of lectures) {
    const stats = getStats(record.sourceRepo);
    stats.lectures += 1;
    if (record.category) stats.categories.add(record.category);
    for (const tag of record.tags || []) stats.tags.add(tag);
    if (stats.sampleTitles.length < 5) stats.sampleTitles.push(summarizeRecordTitle(record));
  }

  for (const record of tutorials) {
    const stats = getStats(record.sourceRepo);
    stats.tutorials += 1;
    stats.mcqs += (record.mcqs || []).length;
    stats.flashcards += (record.flashcards || []).length;
    if (record.category) stats.categories.add(record.category);
    for (const tag of record.tags || []) stats.tags.add(tag);
    if (stats.sampleTitles.length < 5) stats.sampleTitles.push(summarizeRecordTitle(record));
  }

  for (const record of algorithms) {
    const stats = getStats(record.sourceRepo);
    stats.algorithms += 1;
    if (record.category) stats.categories.add(record.category);
    for (const tag of record.tags || []) stats.tags.add(tag);
    if (stats.sampleTitles.length < 5) stats.sampleTitles.push(summarizeRecordTitle(record));
  }

  for (const record of images) {
    const stats = getStats(record.sourceRepo);
    stats.images += 1;
    if (record.category) stats.categories.add(record.category);
    if (record.entity) {
      stats.entities.add(record.entity);
      stats.imageEntities.add(record.entity);
    }
    for (const tag of record.tags || []) stats.tags.add(tag);
    if (stats.sampleTitles.length < 5) stats.sampleTitles.push(`${record.title}: ${record.description}`.slice(0, 180));
  }

  const sourceProfiles = [...sourceStatsMap.values()].map((stats) => {
    const scoring = scoreSource(stats);
    return {
      sourceRepo: stats.sourceRepo,
      displayName: scoring.displayName,
      score: scoring.score,
      strategicFit: scoring.strategicFit,
      dataQuality: scoring.dataQuality,
      recommendedAction: scoring.recommendedAction,
      rationale: scoring.rationale,
      counts: {
        lectures: stats.lectures,
        tutorials: stats.tutorials,
        algorithms: stats.algorithms,
        images: stats.images,
        mcqs: stats.mcqs,
        flashcards: stats.flashcards,
      },
      categories: toArraySet(stats.categories),
      entities: toArraySet(stats.entities),
      imageEntities: toArraySet(stats.imageEntities),
      tags: toArraySet(stats.tags),
      sampleTitles: stats.sampleTitles,
    };
  }).sort((left, right) => right.score - left.score || left.sourceRepo.localeCompare(right.sourceRepo));

  const promotionQueues = buildPromotionQueues(datasets, sourceProfiles);

  const facetManifest = {
    lectures: {
      sourceRepos: uniqueSorted(lectures.map((record) => record.sourceRepo)),
      categories: uniqueSorted(lectures.map((record) => record.category)),
    },
    tutorials: {
      sourceRepos: uniqueSorted(tutorials.map((record) => record.sourceRepo)),
      categories: uniqueSorted(tutorials.map((record) => record.category)),
      topTags: topCounts(tutorials.flatMap((record) => record.tags || []).reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {}), 20),
    },
    algorithms: {
      sourceRepos: uniqueSorted(algorithms.map((record) => record.sourceRepo)),
      categories: uniqueSorted(algorithms.map((record) => record.category)),
    },
    images: {
      sourceRepos: uniqueSorted(images.map((record) => record.sourceRepo)),
      entities: uniqueSorted(images.map((record) => record.entity)),
      topEntities: topCounts(images.reduce((acc, image) => {
        const key = image.entity || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}), 20),
    },
  };

  const integrationRecommendations = [
    {
      order: 1,
      area: 'Granulomatous image promotion',
      action: 'Promote top granulomatous entities from Downloads images into the curated atlas and Job Aid differential view.',
      output: 'Uses the direct app-domain overlap from the granulomatous module without new routing complexity.',
    },
    {
      order: 2,
      area: 'Core principles lecture promotion',
      action: 'Split the core principles lectures into a dedicated didactic section with pathology-topic navigation.',
      output: 'Converts the current Downloads lecture staging area into an education-first teaching module.',
    },
    {
      order: 3,
      area: 'Board-prep tutorial curation',
      action: 'Curate ABPath and CP tutorial records into AP, CP, and granulomatous tracks before exposing them in the main tutorial browser.',
      output: 'Prevents the existing Tutorials view from becoming noisy or clinically incoherent.',
    },
    {
      order: 4,
      area: 'Algorithm integration',
      action: 'Keep the microbiology algorithm staged until a dedicated algorithm navigator exists or an infectious disease track is added.',
      output: 'Avoids mixing a broad microbiology decision tree into a lung granuloma-focused app prematurely.',
    },
  ];

  const nextTenSteps = [
    {
      step: 1,
      title: 'Validate staged Downloads imports',
      status: 'completed_in_batch',
      outputFiles: ['validation.json'],
      detail: 'Confirmed the normalized lectures, tutorials, algorithms, and image datasets are present and non-empty.',
    },
    {
      step: 2,
      title: 'Profile each source repository by content yield and educational density',
      status: 'completed_in_batch',
      outputFiles: ['source_profiles.json'],
      detail: 'Built per-source counts for lectures, tutorials, algorithms, images, MCQs, flashcards, categories, and entities.',
    },
    {
      step: 3,
      title: 'Rank source repositories for promotion priority',
      status: 'completed_in_batch',
      outputFiles: ['promotion_priority.json'],
      detail: 'Applied deterministic scoring using strategic fit, data quality, breadth, and content yield.',
    },
    {
      step: 4,
      title: 'Create a lecture promotion queue',
      status: 'completed_in_batch',
      outputFiles: ['promotion_queues.json'],
      detail: 'Queued the core principles lectures first because they are cleanly structured and clinically coherent.',
    },
    {
      step: 5,
      title: 'Create a tutorial promotion queue',
      status: 'completed_in_batch',
      outputFiles: ['promotion_queues.json'],
      detail: 'Ranked ABPath, CP, core-principles, and granulomatous tutorials by source fit plus embedded learning assets.',
    },
    {
      step: 6,
      title: 'Create an algorithm promotion queue',
      status: 'completed_in_batch',
      outputFiles: ['promotion_queues.json'],
      detail: 'Preserved the microbiology algorithm as staged content with an explicit hold recommendation.',
    },
    {
      step: 7,
      title: 'Create an image promotion queue',
      status: 'completed_in_batch',
      outputFiles: ['promotion_queues.json'],
      detail: 'Prioritized granulomatous entities for atlas and differential-view promotion.',
    },
    {
      step: 8,
      title: 'Build facet manifests for source, category, and entity filtering',
      status: 'completed_in_batch',
      outputFiles: ['facet_manifest.json'],
      detail: 'Prepared reusable filter metadata for future UI promotion and QA checks.',
    },
    {
      step: 9,
      title: 'Write integration recommendations in domain order',
      status: 'completed_in_batch',
      outputFiles: ['integration_recommendations.json'],
      detail: 'Mapped the safest app-facing promotion order: granulomatous images, core-principles lectures, curated board-prep tutorials, then algorithms.',
    },
    {
      step: 10,
      title: 'Publish the execution report and roadmap',
      status: 'completed_in_batch',
      outputFiles: ['NEXT_TEN_STEPS_BATCH_REPORT.md', 'next_ten_steps.json'],
      detail: 'Wrote a markdown report and machine-readable roadmap for the next migration tranche.',
    },
  ];

  const promotionPriority = sourceProfiles.map((profile, index) => ({
    rank: index + 1,
    sourceRepo: profile.sourceRepo,
    displayName: profile.displayName,
    score: profile.score,
    recommendedAction: profile.recommendedAction,
    rationale: profile.rationale,
    counts: profile.counts,
  }));

  const report = [
    '# Downloads Migration Batch Report',
    '',
    '## Batch Scope',
    '',
    'This batch completed the next ten migration-planning steps for the Downloads-derived corpus without mutating the imported datasets.',
    '',
    '## Dataset Totals',
    '',
    `- Lectures: ${lectures.length}`,
    `- Tutorials: ${tutorials.length}`,
    `- Algorithms: ${algorithms.length}`,
    `- Images: ${images.length}`,
    '',
    '## Priority Ranking',
    '',
    ...promotionPriority.map((entry) => (
      `- ${entry.rank}. ${entry.displayName} (${entry.sourceRepo}) score ${entry.score}: ${entry.recommendedAction}`
    )),
    '',
    '## Recommended Promotion Order',
    '',
    ...integrationRecommendations.map((entry) => (
      `- ${entry.order}. ${entry.area}: ${entry.action}`
    )),
    '',
    '## Top Queue Signals',
    '',
    `- Lectures: ${promotionQueues.lectures.slice(0, 3).map((record) => record.title).join('; ')}`,
    `- Tutorials: ${promotionQueues.tutorials.slice(0, 5).map((record) => `${record.title} (${record.sourceRepo})`).join('; ')}`,
    `- Algorithms: ${promotionQueues.algorithms.slice(0, 3).map((record) => record.title).join('; ')}`,
    `- Images: ${promotionQueues.images.slice(0, 5).map((record) => `${record.entity || record.title}`).join('; ')}`,
    '',
    '## Output Files',
    '',
    '- `validation.json`',
    '- `source_profiles.json`',
    '- `promotion_priority.json`',
    '- `promotion_queues.json`',
    '- `facet_manifest.json`',
    '- `integration_recommendations.json`',
    '- `next_ten_steps.json`',
    '- `NEXT_TEN_STEPS_BATCH_REPORT.md`',
    '',
  ].join('\n');

  writeJson(path.join(PLANNING_ROOT, 'validation.json'), validation);
  writeJson(path.join(PLANNING_ROOT, 'source_profiles.json'), sourceProfiles);
  writeJson(path.join(PLANNING_ROOT, 'promotion_priority.json'), promotionPriority);
  writeJson(path.join(PLANNING_ROOT, 'promotion_queues.json'), promotionQueues);
  writeJson(path.join(PLANNING_ROOT, 'facet_manifest.json'), facetManifest);
  writeJson(path.join(PLANNING_ROOT, 'integration_recommendations.json'), integrationRecommendations);
  writeJson(path.join(PLANNING_ROOT, 'next_ten_steps.json'), nextTenSteps);
  writeText(path.join(PLANNING_ROOT, 'NEXT_TEN_STEPS_BATCH_REPORT.md'), `${report}\n`);

  console.log(`Wrote Downloads migration batch outputs to ${path.relative(ROOT, PLANNING_ROOT)}`);
}

main();
