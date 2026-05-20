#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, 'src/content/planning/next_1000_major_changes.seed.json');
const GENERATED_JSON_PATH = path.join(ROOT, 'src/content/planning/next_1000_major_changes.json');
const GENERATED_MD_PATH = path.join(ROOT, 'docs/planning/NEXT_1000_MAJOR_CHANGES.md');
const SUMMARY_PATH = path.join(ROOT, 'reports/next_1000_major_changes_summary.json');

const REQUIRED_CONTRACTS = [
  '/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/SKI-CORTEX/contracts/dirty_repo_negotiation_contract.md',
  '/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/SKI-CORTEX/contracts/universal_cli_first_token_optimization_contract.md',
  '/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/SKI-CORTEX/contracts/openclaw_parallel_execution_contract.md',
  '/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/docs/contracts/SEMANTIC_DIRTINESS_SYNTHESIS_CONTRACT.md',
  '/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/docs/contracts/CORPUS_REALIZATION_CONTRACT.md',
  '/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md',
  '/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series/docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md',
];

const LANE_IDS = [
  'L1_CP_TRUTH',
  'L2_CONTENT_PARITY',
  'L3_LEARNER_UX',
  'L4_WORKUPS_ROUTING',
  'L5_CONTRACTS_VALIDATORS',
];

const WAVE_IDS = Array.from({ length: 20 }, (_, index) => `W${String(index + 1).padStart(2, '0')}`);
const CHANGE_STATUSES = ['planned', 'historical-precondition', 'blocked', 'ready-next'];
const CONTENT_OUTPUTS = [
  'NONE',
  'LEARNER_COPY',
  'FACULTY_REVIEW_PACKET',
  'BOARD_PREP_ASSET',
  'DEMO_ARTIFACT',
  'MANUSCRIPT_ASSET',
  'SPONSOR_PACKET_ASSET',
  'PRODUCT_POSITIONING_ASSET',
];
const AUDIENCES = ['learner', 'faculty', 'recruiter', 'chair', 'reviewer', 'product_lead', 'self'];
const REUSE_TARGETS = [
  'Didactic_Series',
  'DERC',
  'Projection_Atlas',
  'Frozens',
  'sponsor_packet',
  'manuscript',
  'portfolio',
];
const VALUE_LEVELS = ['low', 'moderate', 'high'];
const PROOF_STYLES = ['CLI_ONLY', 'CLI_FIRST', 'CLI_PLUS_BROWSER_LAST_STEP'];

const ROADMAP_BLOCKED_TERMS = [
  'acceptance surface',
  'artifact factory',
  'synchrony gate',
  'delta correction',
  'ontology',
  'implementation surface',
  'route hint',
  'canonical truth owner',
];

const CONTENT_BUCKETS = {
  learnerFacing: new Set(['LEARNER_COPY', 'BOARD_PREP_ASSET']),
  sponsorReviewer: new Set(['FACULTY_REVIEW_PACKET', 'SPONSOR_PACKET_ASSET', 'MANUSCRIPT_ASSET']),
  demoProduct: new Set(['DEMO_ARTIFACT', 'PRODUCT_POSITIONING_ASSET']),
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });
const writeJson = (filePath, value) => {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};
const writeText = (filePath, value) => {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value);
};

const countBy = (rows, keyFn) => {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
};

const toTitleCase = (value) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const summarizeReuseTargets = (records) =>
  Array.from(countBy(records, (record) => record.reuse_target).entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([reuseTarget, count]) => ({ reuseTarget, count }));

const summarizeContentOutputs = (records) =>
  Array.from(countBy(records, (record) => record.content_output).entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([contentOutput, count]) => ({ contentOutput, count }));

const buildWaveArtifactCoverage = (records) => {
  const coverage = {
    learnerFacing: false,
    proofValidator: false,
    sponsorReviewer: false,
    demoProduct: false,
  };

  for (const record of records) {
    if (CONTENT_BUCKETS.learnerFacing.has(record.content_output)) coverage.learnerFacing = true;
    if (record.lane === 'L5_CONTRACTS_VALIDATORS') coverage.proofValidator = true;
    if (CONTENT_BUCKETS.sponsorReviewer.has(record.content_output)) coverage.sponsorReviewer = true;
    if (CONTENT_BUCKETS.demoProduct.has(record.content_output)) coverage.demoProduct = true;
  }

  return coverage;
};

const buildSummary = (program) => {
  const { records, lanes, waves } = program;
  const waveSummaries = waves.map((wave) => {
    const waveRecords = records.filter((record) => record.wave === wave.id);
    return {
      id: wave.id,
      title: wave.title,
      group: wave.group,
      recordCount: waveRecords.length,
      artifactCoverage: buildWaveArtifactCoverage(waveRecords),
      contentOutputs: summarizeContentOutputs(waveRecords),
      reuseTargets: summarizeReuseTargets(waveRecords),
    };
  });

  const laneSummaries = lanes.map((lane) => {
    const laneRecords = records.filter((record) => record.lane === lane.id);
    return {
      id: lane.id,
      title: lane.title,
      recordCount: laneRecords.length,
      contentOutputs: summarizeContentOutputs(laneRecords),
      reuseTargets: summarizeReuseTargets(laneRecords),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalRecords: records.length,
    laneCount: lanes.length,
    waveCount: waves.length,
    laneSummaries,
    waveSummaries,
    overallContentOutputs: summarizeContentOutputs(records),
    overallReuseTargets: summarizeReuseTargets(records),
  };
};

const renderBulletList = (items) => items.map((item) => `- ${item}`).join('\n');

const renderProgramMarkdown = (program) => {
  const summary = buildSummary(program);
  const laneOutputMapLines = program.lanes.map((lane) => {
    const outputs = lane.expected_outputs.map((entry) => `\`${entry}\``).join(', ');
    return `- **${lane.public_label}**: ${outputs}`;
  });

  const productivityByWaveLines = summary.waveSummaries.map((waveSummary) => {
    const outputs = waveSummary.contentOutputs.map((entry) => `${entry.contentOutput} (${entry.count})`).join(', ');
    return `- **${waveSummary.id} ${waveSummary.title}**: ${outputs}`;
  });

  const sponsorReviewerLines = summary.waveSummaries.map((waveSummary) => {
    const waveRecords = program.records.filter((record) => record.wave === waveSummary.id);
    const selected = waveRecords
      .filter((record) =>
        ['FACULTY_REVIEW_PACKET', 'SPONSOR_PACKET_ASSET', 'MANUSCRIPT_ASSET'].includes(record.content_output)
      )
      .slice(0, 4)
      .map((record) => `\`${record.id}\` ${record.title}`);
    return `- **${waveSummary.id}**: ${selected.join('; ')}`;
  });

  const reuseMapLines = Array.from(countBy(program.records, (record) => record.reuse_target).entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([reuseTarget, count]) => `- **${reuseTarget}**: ${count} planned changes`);

  const waveSections = program.waves.map((wave) => {
    const waveRecords = program.records.filter((record) => record.wave === wave.id);
    const laneSections = program.lanes.map((lane) => {
      const laneRecords = waveRecords.filter((record) => record.lane === lane.id);
      const changes = laneRecords
        .map((record) => {
          const proof = record.proof_commands.map((command) => `\`${command}\``).join(', ');
          const dependsOn = record.depends_on.length ? record.depends_on.join(', ') : 'none';
          return [
            `- **${record.id} ${record.title}**`,
            `  - Why this matters: ${record.why_this_matters}`,
            `  - Current problem: ${record.current_problem}`,
            `  - Done when: ${record.done_when}`,
            `  - Content output: \`${record.content_output}\` for \`${record.audience}\``,
            `  - Reuse target: \`${record.reuse_target}\``,
            `  - Proof commands: ${proof}`,
            `  - Depends on: ${dependsOn}`,
          ].join('\n');
        })
        .join('\n');

      return [
        `### ${lane.public_label}`,
        '',
        `${lane.wave_goal_prefix} ${wave.title.toLowerCase()}.`,
        '',
        changes,
      ].join('\n');
    });

    return [
      `## ${wave.id} ${wave.title}`,
      '',
      `**Wave goal**: ${wave.goal}`,
      '',
      `**Wave sync rule**: ${wave.wave_sync_rule}`,
      '',
      `**Required outputs for this wave**: learner-facing asset, proof bundle, sponsor or reviewer packet, and demo or product output.`,
      '',
      `**What needs to land first**: ${wave.prerequisites.length ? wave.prerequisites.join(', ') : 'none'}`,
      '',
      laneSections.join('\n\n'),
    ].join('\n');
  });

  return [
    '# Next 1000 Major Changes',
    '',
    'This roadmap is the repo-native plan for the next 1000 major changes in Didactic Series.',
    'It keeps the five work lanes stable, uses plain language, and requires every planned change to show its learner, faculty, demo, manuscript, sponsor, or product value.',
    '',
    '## Planning Rules',
    '',
    renderBulletList([
      'Use CLI-first proof wherever the terminal can answer the question.',
      'Keep the five work lanes stable and avoid overlap without an integrator pass.',
      'Treat source truth, learner clarity, proof bundles, and reuse value as first-class outcomes.',
      'Downgrade or merge any planned change that does not improve truth, learning, proof, workflow, or market-facing credibility.',
    ]),
    '',
    '## Lane Outputs',
    '',
    laneOutputMapLines.join('\n'),
    '',
    '## Productivity Outputs by Wave',
    '',
    productivityByWaveLines.join('\n'),
    '',
    '## Sponsor / Faculty / Reviewer-Ready Artifacts',
    '',
    sponsorReviewerLines.join('\n'),
    '',
    '## Product Pipeline Reuse Map',
    '',
    reuseMapLines.join('\n'),
    '',
    waveSections.join('\n\n'),
    '',
  ].join('\n');
};

const validateProgram = (program) => {
  const failures = [];
  const requiredTopLevelKeys = ['title', 'summary', 'lanes', 'waves', 'wave_groups', 'records'];
  for (const key of requiredTopLevelKeys) {
    if (!(key in program)) failures.push(`missing top-level field: ${key}`);
  }

  const records = Array.isArray(program.records) ? program.records : [];
  const lanes = Array.isArray(program.lanes) ? program.lanes : [];
  const waves = Array.isArray(program.waves) ? program.waves : [];

  if (records.length !== 1000) failures.push(`expected 1000 planned changes, found ${records.length}`);
  if (lanes.length !== 5) failures.push(`expected 5 lanes, found ${lanes.length}`);
  if (waves.length !== 20) failures.push(`expected 20 waves, found ${waves.length}`);

  const laneIds = new Set(lanes.map((lane) => lane.id));
  const waveIds = new Set(waves.map((wave) => wave.id));
  const idSet = new Set();

  const requiredRecordFields = [
    'id',
    'wave',
    'lane',
    'title',
    'why_this_matters',
    'current_problem',
    'done_when',
    'required_files',
    'do_not_touch',
    'contracts',
    'depends_on',
    'proof_commands',
    'status',
    'wave_sync_rule',
    'proof_style',
    'content_output',
    'audience',
    'reuse_target',
    'public_safe',
    'phi_safe',
    'career_value',
    'product_value',
  ];

  for (const record of records) {
    for (const key of requiredRecordFields) {
      if (!(key in record)) failures.push(`${record.id || '<missing-id>'} is missing field ${key}`);
    }

    if (idSet.has(record.id)) failures.push(`duplicate record id: ${record.id}`);
    idSet.add(record.id);

    if (!laneIds.has(record.lane)) failures.push(`${record.id} uses unknown lane ${record.lane}`);
    if (!waveIds.has(record.wave)) failures.push(`${record.id} uses unknown wave ${record.wave}`);
    if (!CHANGE_STATUSES.includes(record.status)) failures.push(`${record.id} uses invalid status ${record.status}`);
    if (!CONTENT_OUTPUTS.includes(record.content_output)) failures.push(`${record.id} uses invalid content_output ${record.content_output}`);
    if (!AUDIENCES.includes(record.audience)) failures.push(`${record.id} uses invalid audience ${record.audience}`);
    if (!REUSE_TARGETS.includes(record.reuse_target)) failures.push(`${record.id} uses invalid reuse_target ${record.reuse_target}`);
    if (!VALUE_LEVELS.includes(record.career_value)) failures.push(`${record.id} uses invalid career_value ${record.career_value}`);
    if (!VALUE_LEVELS.includes(record.product_value)) failures.push(`${record.id} uses invalid product_value ${record.product_value}`);
    if (!PROOF_STYLES.includes(record.proof_style)) failures.push(`${record.id} uses invalid proof_style ${record.proof_style}`);
    if (!Array.isArray(record.required_files) || record.required_files.length === 0) failures.push(`${record.id} must list required_files`);
    if (!Array.isArray(record.do_not_touch) || record.do_not_touch.length === 0) failures.push(`${record.id} must list do_not_touch`);
    if (!Array.isArray(record.contracts) || record.contracts.length === 0) failures.push(`${record.id} must list contracts`);
    if (!Array.isArray(record.depends_on)) failures.push(`${record.id} must list depends_on`);
    if (!Array.isArray(record.proof_commands) || record.proof_commands.length === 0) failures.push(`${record.id} must list proof_commands`);

    for (const requiredContract of REQUIRED_CONTRACTS) {
      if (!record.contracts.includes(requiredContract)) {
        failures.push(`${record.id} is missing required contract ${requiredContract}`);
      }
    }

    const hasCliProof = (record.proof_commands || []).some((command) =>
      /^(node|npm run|npx|git |rg |sed -n |find |fd )/.test(command)
    );
    if (!hasCliProof) failures.push(`${record.id} must include CLI-first proof commands`);
  }

  for (const laneId of LANE_IDS) {
    const count = records.filter((record) => record.lane === laneId).length;
    if (count !== 200) failures.push(`lane ${laneId} must contain 200 planned changes, found ${count}`);
  }

  for (const waveId of WAVE_IDS) {
    const count = records.filter((record) => record.wave === waveId).length;
    if (count !== 50) failures.push(`wave ${waveId} must contain 50 planned changes, found ${count}`);
  }

  for (const waveId of WAVE_IDS) {
    for (const laneId of LANE_IDS) {
      const count = records.filter((record) => record.wave === waveId && record.lane === laneId).length;
      if (count !== 10) failures.push(`wave ${waveId} lane ${laneId} must contain 10 planned changes, found ${count}`);
    }
  }

  for (const waveId of WAVE_IDS) {
    const waveRecords = records.filter((record) => record.wave === waveId);
    const coverage = buildWaveArtifactCoverage(waveRecords);
    if (!coverage.learnerFacing) failures.push(`wave ${waveId} is missing a learner-facing asset`);
    if (!coverage.proofValidator) failures.push(`wave ${waveId} is missing a proof bundle or validator artifact`);
    if (!coverage.sponsorReviewer) failures.push(`wave ${waveId} is missing a sponsor or reviewer packet`);
    if (!coverage.demoProduct) failures.push(`wave ${waveId} is missing a demo or product output`);
  }

  const markdown = renderProgramMarkdown(program).toLowerCase();
  for (const blockedTerm of ROADMAP_BLOCKED_TERMS) {
    if (markdown.includes(blockedTerm)) {
      failures.push(`roadmap text uses blocked jargon: ${blockedTerm}`);
    }
  }

  if (!markdown.includes('## productivity outputs by wave')) {
    failures.push('roadmap markdown is missing "Productivity Outputs by Wave"');
  }
  if (!markdown.includes('## sponsor / faculty / reviewer-ready artifacts')) {
    failures.push('roadmap markdown is missing "Sponsor / Faculty / Reviewer-Ready Artifacts"');
  }
  if (!markdown.includes('## product pipeline reuse map')) {
    failures.push('roadmap markdown is missing "Product Pipeline Reuse Map"');
  }

  return failures;
};

const readProgram = () => readJson(SEED_PATH);

module.exports = {
  AUDIENCES,
  CHANGE_STATUSES,
  CONTENT_OUTPUTS,
  GENERATED_JSON_PATH,
  GENERATED_MD_PATH,
  LANE_IDS,
  PROOF_STYLES,
  REUSE_TARGETS,
  ROADMAP_BLOCKED_TERMS,
  ROOT,
  SEED_PATH,
  SUMMARY_PATH,
  VALUE_LEVELS,
  WAVE_IDS,
  buildSummary,
  readProgram,
  renderProgramMarkdown,
  validateProgram,
  writeJson,
  writeText,
};
