#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');

const {
  ROOT,
  readProgram,
  writeJson,
  writeText,
} = require('./next_1000_major_changes_lib.cjs');

const GENERATED_JSON_PATH = path.join(ROOT, 'src/content/planning/full_1000_execution_ledger.json');
const GENERATED_MD_PATH = path.join(ROOT, 'docs/planning/FULL_1000_EXECUTION_LEDGER.md');
const SUMMARY_PATH = path.join(ROOT, 'reports/full_1000_execution_ledger_summary.json');

const GROUPED_PHASES = [
  {
    id: 'G1',
    title: 'Foundation and truth',
    waves: ['W01', 'W02', 'W03'],
    exitCondition: 'Truth artifacts, content parity baseline, and the canonical CP study map all agree.',
  },
  {
    id: 'G2',
    title: 'Learner language and navigation',
    waves: ['W04', 'W05', 'W06'],
    exitCondition: 'Public study flow reads naturally and remains orientation-safe across route transitions.',
  },
  {
    id: 'G3',
    title: 'Provenance and connected study tools',
    waves: ['W07', 'W08', 'W09', 'W10'],
    exitCondition: 'Learners and reviewers can see trust, links, and readiness state directly on study surfaces.',
  },
  {
    id: 'G4',
    title: 'Reviewer legibility and proof usability',
    waves: ['W11', 'W12', 'W13'],
    exitCondition: 'Faculty, chair, and outside-review surfaces are understandable without implementation knowledge.',
  },
  {
    id: 'G5',
    title: 'Product coherence',
    waves: ['W14', 'W15', 'W16'],
    exitCondition: 'AP and CP feel like one product and the best paths are reusable assets.',
  },
  {
    id: 'G6',
    title: 'External review packaging',
    waves: ['W17', 'W18'],
    exitCondition: 'Strongest validated outputs are bundled for faculty review and manuscript support.',
  },
  {
    id: 'G7',
    title: 'Release story and portfolio finish',
    waves: ['W19', 'W20'],
    exitCondition: 'Repo truth, reviewer proof, sponsor story, and reusable portfolio outputs all align.',
  },
];

const TRANCHE_OVERRIDES = {
  T01: {
    status: 'completed',
    statusBasis: 'exact_proof_bundle',
    completionEvidence: {
      completedStepIds: [
        'W01-L1_CP_TRUTH-C01',
        'W01-L1_CP_TRUTH-C02',
        'W01-L1_CP_TRUTH-C03',
        'W01-L1_CP_TRUTH-C04',
        'W01-L1_CP_TRUTH-C05',
        'W01-L1_CP_TRUTH-C06',
        'W01-L1_CP_TRUTH-C07',
        'W01-L1_CP_TRUTH-C08',
        'W01-L1_CP_TRUTH-C09',
        'W01-L1_CP_TRUTH-C10',
      ],
      remainingStepIds: [],
    },
    evidenceCommits: [
      'a0737af1 Freeze CP truth baseline snapshots',
      'e281b31a Freeze CP governed exception snapshots',
      'f145f8b4 Split CP exception reviewer action buckets',
      '8c1999f6 Add CP truth handoff summary',
      '28ee500a Add CP reviewer action packet',
      'cb2c69f9 Add CP governed promotion packet',
      '8b6f287a Add CP root priority summary',
      '712e15c9 Add CP root execution checklist',
      '8e85c92e Add CP root execution manifest',
      'f4b8690d Add CP truth tranche closeout packet',
    ],
    evidenceArtifacts: [
      'reports/cp_precision_governance_report.json',
      'reports/validated_mappings_manifest.json',
      'reports/cp_truth_handoff_summary.json',
      'reports/cp_root_execution_manifest.json',
      'reports/cp_truth_tranche_closeout_packet.json',
    ],
    proofCommands: [
      'npm run cp:precision:validate',
      'npx vitest run scripts/validate_cp_truth_baseline_outputs.test.ts',
      'npx vitest run scripts/validate_cp_truth_handoff_summary.test.ts',
      'npx vitest run scripts/validate_cp_root_execution_manifest.test.ts',
      'npx vitest run scripts/validate_cp_truth_tranche_closeout_packet.test.ts',
      'git diff --check',
    ],
    summary:
      'CP truth for W01 is effectively closed with a full baseline, exception queue, root-priority packet, execution manifest, and tranche closeout packet.',
  },
  T02: {
    status: 'completed',
    statusBasis: 'exact_proof_bundle',
    completionEvidence: {
      completedStepIds: [
        'W01-L2_CONTENT_PARITY-C01',
        'W01-L2_CONTENT_PARITY-C02',
        'W01-L2_CONTENT_PARITY-C03',
        'W01-L2_CONTENT_PARITY-C04',
        'W01-L2_CONTENT_PARITY-C05',
        'W01-L2_CONTENT_PARITY-C06',
        'W01-L2_CONTENT_PARITY-C07',
        'W01-L2_CONTENT_PARITY-C08',
        'W01-L2_CONTENT_PARITY-C09',
        'W01-L2_CONTENT_PARITY-C10',
      ],
      remainingStepIds: [],
    },
    evidenceCommits: [
      'b6c2c480 Freeze content parity baseline snapshot',
      '01032db0 Normalize CP curriculum tutorial source links',
      'ad27fcce Align CP foundations content parity',
      '15ff4f00 Align CP module cluster parity copy',
    ],
    evidenceArtifacts: [
      'reports/content_consumption_journey_evaluation.json',
      'reports/content_parity_tranche_closeout_packet.json',
    ],
    proofCommands: [
      'npm run cp:precision:validate',
      'npm run test -- src/utils/tutorialLibraryCatalog.test.ts',
      'npx vitest run scripts/validate_content_parity_tranche_closeout_packet.test.ts',
      'git diff --check',
    ],
    summary:
      'Content parity is formally closed with a valid baseline report, normalized CP source links, aligned module copy, and a dedicated tranche closeout packet.',
  },
  T03: {
    status: 'in_progress',
    statusBasis: 'supporting_commit_evidence_only',
    completionEvidence: {
      completedStepIds: [],
      remainingStepIds: [
        'W01-L3_LEARNER_UX-C01',
        'W01-L3_LEARNER_UX-C02',
        'W01-L3_LEARNER_UX-C03',
        'W01-L3_LEARNER_UX-C04',
        'W01-L3_LEARNER_UX-C05',
        'W01-L3_LEARNER_UX-C06',
        'W01-L3_LEARNER_UX-C07',
        'W01-L3_LEARNER_UX-C08',
        'W01-L3_LEARNER_UX-C09',
        'W01-L3_LEARNER_UX-C10',
      ],
    },
    evidenceCommits: [
      'ce3a8d9b Govern curriculum follow-up review ordering',
    ],
    evidenceArtifacts: [
      'reports/didactics_learning_ux_report.json',
    ],
    proofCommands: [
      'npm run didactics:ux:validate',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts',
      'git diff --check',
    ],
    remainingOwnedFiles: [
      'src/components/Home.tsx',
      'src/components/ReferenceLibrary.tsx',
      'src/components/CompetencyMatrix.tsx',
    ],
    supportingProgress: [
      'Curriculum follow-up review ordering is already governed in PathologyCurriculum.',
      'The didactics UX validator/report lane is active, but the learner-UX tranche has not yet been formally backfilled against its owned file set.',
    ],
    summary:
      'Learner UX has real W01 movement, but it still needs formal tranche closure against the owned Home, Reference Library, and Competency Matrix surfaces.',
  },
  T04: {
    status: 'in_progress',
    statusBasis: 'supporting_commit_evidence_only',
    completionEvidence: {
      completedStepIds: [],
      remainingStepIds: [
        'W01-L4_WORKUPS_ROUTING-C01',
        'W01-L4_WORKUPS_ROUTING-C02',
        'W01-L4_WORKUPS_ROUTING-C03',
        'W01-L4_WORKUPS_ROUTING-C04',
        'W01-L4_WORKUPS_ROUTING-C05',
        'W01-L4_WORKUPS_ROUTING-C06',
        'W01-L4_WORKUPS_ROUTING-C07',
        'W01-L4_WORKUPS_ROUTING-C08',
        'W01-L4_WORKUPS_ROUTING-C09',
        'W01-L4_WORKUPS_ROUTING-C10',
      ],
    },
    evidenceCommits: [
      '9bc73a67 Widen workups layout in focus mode',
      '03bbd67a Densify clinical pathology workups grid',
      '01caab57 Tighten workups sidebar plain-language rail',
      'e41c04fc Tighten workups plain-language helper copy',
    ],
    evidenceArtifacts: [
      'reports/didactics_learning_ux_report.json',
    ],
    proofCommands: [
      'npm run didactics:ux:validate',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts',
      'git diff --check',
    ],
    remainingOwnedFiles: [
      'src/utils/algorithmCatalog.ts',
      'src/utils/algorithmNavigatorNavigation.ts',
      'src/content/algorithms/algorithms.normalized.json',
    ],
    supportingProgress: [
      'Clinical Pathology workups layout, density, and plain-language copy are already improved on live study surfaces.',
      'Routing/catalog parity, lane rules, focused route tests, reusable diagnostic-map output, and tranche handoff are still open.',
    ],
    summary:
      'Workups and routing have visible W01 improvements, but the tranche still needs formal backfill across the underlying route, catalog, test, and handoff surfaces.',
  },
  T05: {
    status: 'in_progress',
    statusBasis: 'supporting_commit_evidence_only',
    completionEvidence: {
      completedStepIds: [],
      remainingStepIds: [
        'W01-L5_CONTRACTS_VALIDATORS-C01',
        'W01-L5_CONTRACTS_VALIDATORS-C02',
        'W01-L5_CONTRACTS_VALIDATORS-C03',
        'W01-L5_CONTRACTS_VALIDATORS-C04',
        'W01-L5_CONTRACTS_VALIDATORS-C05',
        'W01-L5_CONTRACTS_VALIDATORS-C06',
        'W01-L5_CONTRACTS_VALIDATORS-C07',
        'W01-L5_CONTRACTS_VALIDATORS-C08',
        'W01-L5_CONTRACTS_VALIDATORS-C09',
        'W01-L5_CONTRACTS_VALIDATORS-C10',
      ],
    },
    evidenceCommits: [
      '90b6a327 Govern autonomous execution contract',
      '799b83d1 Govern automation execution contract',
    ],
    evidenceArtifacts: [
      'docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md',
      'reports/didactics_learning_ux_report.json',
    ],
    proofCommands: [
      'npm run didactics:ux:validate',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts',
      'git diff --check',
    ],
    remainingOwnedFiles: [
      'docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md',
      'src/content/contracts/pthfndrDidacticsLearningUxContract.json',
    ],
    supportingProgress: [
      'Autonomous execution and automation rules are now governed in the Codex alignment contract and validator.',
      'The tranche still needs a full W01 proof-baseline backfill, explicit report parity, remaining contract sync, and a formal proof handoff.',
    ],
    summary:
      'Contracts and proof have meaningful W01 progress, but the tranche is not formally closed until the remaining contract surfaces and proof outputs are backfilled together.',
  },
};

const trancheId = (index) => `T${String(index).padStart(2, '0')}`;

const buildGroupedPhases = (program) =>
  GROUPED_PHASES.map((phase) => ({
    ...phase,
    waveTitles: phase.waves.map((waveId) => {
      const wave = program.waves.find((entry) => entry.id === waveId);
      return wave ? `${wave.id} ${wave.title}` : waveId;
    }),
  }));

const buildBaseTranches = (program) =>
  program.waves.flatMap((wave, waveIndex) =>
    program.lanes.map((lane, laneIndex) => {
      const trancheIndex = waveIndex * program.lanes.length + laneIndex + 1;
      const records = program.records.filter((record) => record.wave === wave.id && record.lane === lane.id);
      const id = trancheId(trancheIndex);
      return {
        id,
        title: `${wave.id} ${lane.public_label}`,
        wave: wave.id,
        waveTitle: wave.title,
        lane: lane.id,
        laneLabel: lane.public_label,
        laneTitle: lane.title,
        group: wave.group,
        goal: `${lane.wave_goal_prefix} ${wave.title.toLowerCase()}.`,
        status: 'planned',
        statusBasis: 'not_started',
        completionEvidence: {
          completedStepIds: [],
          remainingStepIds: records.map((record) => record.id),
        },
        recordTitles: records.map((record) => ({ id: record.id, title: record.title })),
        prerequisites: Array.from(new Set(records.flatMap((record) => record.depends_on))).sort(),
        requiredFiles: lane.required_files,
        doNotTouch: lane.do_not_touch,
        proofCommands: lane.proof_commands,
        evidenceCommits: [],
        evidenceArtifacts: [],
        supportingProgress: [],
        remainingOwnedFiles: [],
        summary: 'Not started in the formal tranche ledger yet.',
      };
    })
  );

const applyOverrides = (tranches) =>
  tranches.map((tranche) => ({
    ...tranche,
    ...(TRANCHE_OVERRIDES[tranche.id] || {}),
    completionEvidence: {
      ...tranche.completionEvidence,
      ...((TRANCHE_OVERRIDES[tranche.id] || {}).completionEvidence || {}),
    },
  }));

const summarizeStatuses = (tranches) => {
  const summary = { completed: 0, in_progress: 0, planned: 0 };
  for (const tranche of tranches) {
    summary[tranche.status] = (summary[tranche.status] || 0) + 1;
  }
  return summary;
};

const readGit = (command, fallback) => {
  try {
    return execSync(command, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
};

const buildLedger = () => {
  const program = readProgram();
  const groupedPhases = buildGroupedPhases(program);
  const tranches = applyOverrides(buildBaseTranches(program));
  const currentWave = program.waves.find((wave) => wave.id === 'W01');

  return {
    title: 'Full 1000 Execution Ledger',
    summary:
      'A repo-native tranche ledger that reconciles the current live Didactic Series state against the full 20-wave / 1000-change program.',
    sourceProgram: 'src/content/planning/next_1000_major_changes.json',
    derivedPlans: [
      'docs/planning/NEXT_100_IMPLEMENTATION_PLAN.md',
      'reports/cp_truth_tranche_closeout_packet.json',
      'reports/content_consumption_journey_evaluation.json',
      'reports/didactics_learning_ux_report.json',
    ],
    currentState: {
      branch: readGit('git branch --show-current', 'unknown'),
      head: readGit('git rev-parse --short HEAD', 'unknown'),
      sync: `${readGit('git rev-list --left-right --count HEAD...origin/main', 'UNKNOWN').replace(/\s+/g, '/')} vs origin/main`,
      repoState: 'clean_synced',
      firstOpenWave: currentWave?.id ?? 'W01',
      immediateNextAction: 'Backfill and formally close the remaining W01 tranches before opening W02 feature work.',
    },
    completionDefinition: {
      terminalWave: 'W20',
      requiredState:
        'All W01 through W20 lane records are either landed or intentionally superseded, each wave ends with its required proof bundle, and the release-story outputs in W19/W20 are present.',
    },
    groupedPhases,
    trancheStatusCounts: summarizeStatuses(tranches),
    immediateNextSequence: [
      'Backfill the tranche ledger from current live state.',
      'Formally close T02 W01 Content Parity.',
      'Formally close T03 W01 Learner UX.',
      'Formally close T04 W01 Workups and Routing.',
      'Formally close T05 W01 Contracts and Proof.',
      'Open W02 only after W01 is fully ledgered and proof-complete.',
    ],
    tranches,
  };
};

const renderMarkdown = (ledger) => {
  const trancheLines = ledger.tranches
    .map((tranche) => {
      const completed = tranche.completionEvidence.completedStepIds.length;
      const remaining = tranche.completionEvidence.remainingStepIds.length;
      const commits = tranche.evidenceCommits.length
        ? tranche.evidenceCommits.map((entry) => `\`${entry}\``).join(', ')
        : 'none';
      const artifacts = tranche.evidenceArtifacts.length
        ? tranche.evidenceArtifacts.map((entry) => `\`${entry}\``).join(', ')
        : 'none';
      const remainingFiles = tranche.remainingOwnedFiles.length
        ? tranche.remainingOwnedFiles.map((entry) => `\`${entry}\``).join(', ')
        : 'none';
      return [
        `### ${tranche.id} ${tranche.wave} ${tranche.laneLabel}`,
        '',
        `- Status: \`${tranche.status}\``,
        `- Status basis: \`${tranche.statusBasis}\``,
        `- Goal: ${tranche.goal}`,
        `- Completed steps: ${completed}`,
        `- Remaining steps: ${remaining}`,
        `- Evidence commits: ${commits}`,
        `- Evidence artifacts: ${artifacts}`,
        `- Remaining owned files: ${remainingFiles}`,
        `- Proof commands: ${tranche.proofCommands.map((entry) => `\`${entry}\``).join(', ')}`,
        `- Summary: ${tranche.summary}`,
        ...(tranche.supportingProgress.length
          ? ['', ...tranche.supportingProgress.map((entry) => `  - ${entry}`)]
          : []),
      ].join('\n');
    })
    .join('\n\n');

  return [
    '# Full 1000 Execution Ledger',
    '',
    ledger.summary,
    '',
    '## Current State',
    '',
    `- Branch: \`${ledger.currentState.branch}\``,
    `- HEAD: \`${ledger.currentState.head}\``,
    `- Sync: \`${ledger.currentState.sync}\``,
    `- Repo state: \`${ledger.currentState.repoState}\``,
    `- First open wave: \`${ledger.currentState.firstOpenWave}\``,
    `- Immediate next action: ${ledger.currentState.immediateNextAction}`,
    '',
    '## Completion Definition',
    '',
    `- Terminal wave: \`${ledger.completionDefinition.terminalWave}\``,
    `- Required state: ${ledger.completionDefinition.requiredState}`,
    '',
    '## Grouped Phases',
    '',
    ...ledger.groupedPhases.map(
      (phase) =>
        `- **${phase.id} ${phase.title}**: ${phase.waveTitles.join(', ')}. Exit when ${phase.exitCondition}`
    ),
    '',
    '## Tranche Status Counts',
    '',
    `- Completed: ${ledger.trancheStatusCounts.completed}`,
    `- In progress: ${ledger.trancheStatusCounts.in_progress}`,
    `- Planned: ${ledger.trancheStatusCounts.planned}`,
    '',
    '## Immediate Next Sequence',
    '',
    ...ledger.immediateNextSequence.map((entry, index) => `${index + 1}. ${entry}`),
    '',
    '## Tranche Map',
    '',
    trancheLines,
  ].join('\n');
};

const buildSummary = (ledger) => ({
  generatedAt: new Date().toISOString(),
  currentState: ledger.currentState,
  completionDefinition: ledger.completionDefinition,
  trancheStatusCounts: ledger.trancheStatusCounts,
  firstOpenWave: ledger.currentState.firstOpenWave,
  immediateNextSequence: ledger.immediateNextSequence,
  inProgressTranches: ledger.tranches
    .filter((tranche) => tranche.status === 'in_progress')
    .map((tranche) => ({
      id: tranche.id,
      wave: tranche.wave,
      lane: tranche.lane,
      statusBasis: tranche.statusBasis,
      completedSteps: tranche.completionEvidence.completedStepIds.length,
      remainingSteps: tranche.completionEvidence.remainingStepIds.length,
    })),
});

const main = () => {
  const ledger = buildLedger();
  writeJson(GENERATED_JSON_PATH, ledger);
  writeText(GENERATED_MD_PATH, `${renderMarkdown(ledger)}\n`);
  writeJson(SUMMARY_PATH, buildSummary(ledger));
};

main();
