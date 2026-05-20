#!/usr/bin/env node

const path = require('path');

const {
  ROOT,
  readProgram,
  writeJson,
  writeText,
} = require('./next_1000_major_changes_lib.cjs');

const GENERATED_JSON_PATH = path.join(ROOT, 'src/content/planning/next_100_implementation_plan.json');
const GENERATED_MD_PATH = path.join(ROOT, 'docs/planning/NEXT_100_IMPLEMENTATION_PLAN.md');
const SUMMARY_PATH = path.join(ROOT, 'reports/next_100_implementation_summary.json');

const TARGET_WAVES = ['W01', 'W02'];

const summarizeValue = (records) => {
  const counts = new Map();
  for (const record of records) {
    counts.set(record.content_output, (counts.get(record.content_output) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([contentOutput, count]) => ({ contentOutput, count }));
};

const buildPlan = () => {
  const program = readProgram();
  const lanesById = new Map(program.lanes.map((lane) => [lane.id, lane]));
  const waves = program.waves.filter((wave) => TARGET_WAVES.includes(wave.id));
  const records = program.records.filter((record) => TARGET_WAVES.includes(record.wave));

  const tranches = waves.flatMap((wave, waveIndex) =>
    program.lanes.map((lane, laneIndex) => {
      const trancheRecords = records.filter((record) => record.wave === wave.id && record.lane === lane.id);
      const trancheNumber = waveIndex * program.lanes.length + laneIndex + 1;
      return {
        id: `T${String(trancheNumber).padStart(2, '0')}`,
        title: `${wave.id} ${lane.public_label}`,
        wave: wave.id,
        waveTitle: wave.title,
        lane: lane.id,
        laneLabel: lane.public_label,
        laneTitle: lane.title,
        goal: `${lane.wave_goal_prefix} ${wave.title.toLowerCase()}.`,
        tranche_step_count: trancheRecords.length,
        step_ids: trancheRecords.map((record) => record.id),
        record_titles: trancheRecords.map((record) => record.title),
        prerequisites: Array.from(new Set(trancheRecords.flatMap((record) => record.depends_on))).sort(),
        required_files: lane.required_files,
        do_not_touch: lane.do_not_touch,
        proof_commands: lane.proof_commands,
        value_outputs: summarizeValue(trancheRecords),
      };
    })
  );

  return {
    title: 'Next 100 Implementation Plan',
    summary:
      'A derived execution plan for the next 100 steps, using waves W01 and W02 from the 1000-change planning program and preserving the same five stable work lanes.',
    source_program: 'src/content/planning/next_1000_major_changes.json',
    target_waves: TARGET_WAVES,
    total_steps: records.length,
    tranche_count: tranches.length,
    lane_order: program.lanes.map((lane) => lane.id),
    implementation_rules: [
      'Work in wave order: finish W01 before W02 unless an explicit prerequisite says otherwise.',
      'Inside each wave, land L1, then L2, then L3, then L4, then L5.',
      'Treat each lane-wave pair as one bounded tranche of 10 steps.',
      'Do not mix source-truth files with learner-UX files unless the tranche owns both.',
      'Close every tranche with its lane proof commands before opening the next tranche.',
    ],
    waves,
    lanes: program.lanes,
    records,
    tranches,
  };
};

const renderMarkdown = (plan) => {
  const trancheLines = plan.tranches
    .map((tranche) => {
      const outputs = tranche.value_outputs.map((entry) => `${entry.contentOutput} (${entry.count})`).join(', ');
      const prerequisites = tranche.prerequisites.length ? tranche.prerequisites.join(', ') : 'none';
      const recordWindow = `${tranche.step_ids[0]} -> ${tranche.step_ids[tranche.step_ids.length - 1]}`;
      return [
        `### ${tranche.id} ${tranche.wave} ${tranche.laneLabel}`,
        '',
        `- Goal: ${tranche.goal}`,
        `- Step window: ${recordWindow}`,
        `- Tranche size: ${tranche.tranche_step_count} planned changes`,
        `- Required files: ${tranche.required_files.map((entry) => `\`${entry}\``).join(', ')}`,
        `- Do not touch: ${tranche.do_not_touch.map((entry) => `\`${entry}\``).join(', ')}`,
        `- Proof commands: ${tranche.proof_commands.map((entry) => `\`${entry}\``).join(', ')}`,
        `- Prerequisites: ${prerequisites}`,
        `- Planned outputs: ${outputs}`,
      ].join('\n');
    })
    .join('\n\n');

  const immediateNextTranches = plan.tranches.slice(0, 3).map((tranche) => `- \`${tranche.id}\` ${tranche.goal}`);

  return [
    '# Next 100 Implementation Plan',
    '',
    plan.summary,
    '',
    '## Program Boundary',
    '',
    `- Source program: \`${plan.source_program}\``,
    `- Included waves: ${plan.target_waves.map((entry) => `\`${entry}\``).join(', ')}`,
    `- Total planned steps: ${plan.total_steps}`,
    `- Execution shape: ${plan.tranche_count} tranches x 10 steps each`,
    '',
    '## Implementation Rules',
    '',
    ...plan.implementation_rules.map((rule) => `- ${rule}`),
    '',
    '## Wave Order',
    '',
    ...plan.waves.map((wave) => `- **${wave.id} ${wave.title}**: ${wave.goal}`),
    '',
    '## Lane Order Per Wave',
    '',
    ...plan.lanes.map((lane, index) => `- ${index + 1}. **${lane.public_label}**: ${lane.title}`),
    '',
    '## Immediate Next Tranches',
    '',
    ...immediateNextTranches,
    '',
    '## Tranche Map',
    '',
    trancheLines,
    '',
    '## Implementation Closeout Standard',
    '',
    '- End each tranche with lane proof commands, a bounded commit, and a merge-ready repo state packet.',
    '- Do not open the next tranche until the current tranche is either committed or intentionally restored.',
    '- If a tranche discovers cross-lane drift, stop and spawn a new tranche instead of widening scope in place.',
  ].join('\n');
};

const buildSummary = (plan) => ({
  generatedAt: new Date().toISOString(),
  totalSteps: plan.total_steps,
  trancheCount: plan.tranche_count,
  targetWaves: plan.target_waves,
  laneOrder: plan.lane_order,
  immediateNextTranches: plan.tranches.slice(0, 3).map((tranche) => ({
    id: tranche.id,
    wave: tranche.wave,
    lane: tranche.lane,
    goal: tranche.goal,
  })),
});

const main = () => {
  const plan = buildPlan();
  writeJson(GENERATED_JSON_PATH, plan);
  writeText(GENERATED_MD_PATH, `${renderMarkdown(plan)}\n`);
  writeJson(SUMMARY_PATH, buildSummary(plan));
};

main();
