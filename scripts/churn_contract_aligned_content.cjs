#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const sourceMapPath = path.join(repoRoot, 'reports/curriculum/ap_local_source_map_v1.json');
const gapInventoryPath = path.join(repoRoot, 'reports/curriculum/gap_inventory_v1.json');
const outputJsonPath = path.join(repoRoot, 'reports/curriculum/local_content_churner/churn_contract_aligned_content.json');
const outputMdPath = path.join(repoRoot, 'reports/curriculum/local_content_churner/churn_contract_aligned_content.md');

const REQUIRED_SECTIONS = [
  'introductory_material',
  'core_didactic',
  'images',
  'diagnostic_algorithm',
  'differential_diagnosis',
  'mcqs',
  'worked_examples',
  'retention_tools',
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {
    limit: 10,
    mode: 'draft',
    source: 'local-only',
    allowAiReview: false,
    requireTopicSpecificEvidence: true,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === '--limit') {
      parsed.limit = Number.parseInt(next, 10);
      index += 1;
    } else if (arg === '--mode') {
      parsed.mode = next;
      index += 1;
    } else if (arg === '--source') {
      parsed.source = next;
      index += 1;
    } else if (arg === '--allow-ai-review') {
      parsed.allowAiReview = next === 'true';
      index += 1;
    } else if (arg === '--require-topic-specific-evidence') {
      parsed.requireTopicSpecificEvidence = next === 'true';
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(parsed.limit) || parsed.limit < 1) throw new Error('--limit must be a positive integer');
  if (!['draft', 'validate'].includes(parsed.mode)) throw new Error('--mode must be draft or validate');
  if (parsed.source !== 'local-only') throw new Error('SOURCE_MODE violation: only --source local-only is allowed');
  return parsed;
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const stableJson = (value) => JSON.stringify(value, null, 2) + '\n';
const hashFile = (filePath) => crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const unique = (entries) => [...new Set(entries.filter(Boolean))];
const roundScore = (value) => Math.round(value * 100) / 100;

const parsedSourceCache = new Map();

const localCompetencySourcePaths = () =>
  fs
    .readdirSync(path.join(repoRoot, 'src/content/competency'))
    .filter((fileName) => /^apP0.*CardBatch.*\.ts$/.test(fileName))
    .map((fileName) => `src/content/competency/${fileName}`)
    .sort();

const parseGeneratedObject = (relativePath) => {
  if (!relativePath || !relativePath.endsWith('.ts')) return null;
  if (parsedSourceCache.has(relativePath)) return parsedSourceCache.get(relativePath);
  const filePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    parsedSourceCache.set(relativePath, null);
    return null;
  }
  const source = fs.readFileSync(filePath, 'utf8');
  const start = source.indexOf('{');
  const end = source.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    parsedSourceCache.set(relativePath, null);
    return null;
  }
  try {
    const parsed = JSON.parse(source.slice(start, end + 1));
    parsedSourceCache.set(relativePath, parsed);
    return parsed;
  } catch {
    parsedSourceCache.set(relativePath, null);
    return null;
  }
};

const cardMatchesRow = (card, row) => {
  if (!card || card.title !== row.title) return false;
  if (row.sourceLine && card.sourceLine === row.sourceLine) return true;
  if (card.apSpecPath && card.apSpecPath === row.path) return true;
  return false;
};

const findEvidenceCard = (row) => {
  const candidatePaths = unique([
    ...(row.local_candidates || []).map((candidate) => candidate.file_path),
    ...localCompetencySourcePaths(),
  ]);

  for (const relativePath of candidatePaths) {
    const parsed = parseGeneratedObject(relativePath);
    const card = parsed?.cards?.find((candidateCard) => cardMatchesRow(candidateCard, row));
    if (card) {
      return {
        sourcePath: relativePath,
        card,
      };
    }
  }

  return null;
};

const sourceBackedSections = (card) => {
  if (!card) return {};
  const draft = card.entityCardDraft || {};
  const visual = card.visualAnchorDraft || {};
  const retrieval = Array.isArray(card.retrievalAnswerKey) ? card.retrievalAnswerKey : [];
  return {
    definition: normalizeText(draft.definition),
    normalComparator: normalizeText(draft.normalComparator),
    morphologyAnchor: normalizeText(draft.morphologyAnchor),
    topMimic: normalizeText(draft.topMimic),
    discriminator: normalizeText(draft.discriminator),
    ancillaryOrReportingConsequence: normalizeText(draft.ancillaryOrReportingConsequence),
    safetyPitfall: normalizeText(draft.safetyPitfall),
    sourceBasis: normalizeText(draft.sourceBasis),
    scopedDomain: normalizeText(draft.scopedDomain),
    visualPlan: normalizeText(visual.plan),
    inspectionSequence: Array.isArray(visual.inspectionSequence) ? visual.inspectionSequence.map(normalizeText).filter(Boolean) : [],
    assetStatus: normalizeText(visual.assetStatus),
    retrievalQuestions: retrieval.map((entry) => ({
      prompt: normalizeText(entry.prompt),
      answer: normalizeText(entry.answer),
      reasoning: normalizeText(entry.reasoning),
    })),
  };
};

const scoreSectionCompleteness = (sections, hasEvidenceCard) => {
  const mcqs = buildSourceBackedMcqs(sections);
  const checks = [
    Boolean(sections.definition),
    Boolean(sections.morphologyAnchor),
    Boolean(sections.normalComparator),
    Boolean(sections.topMimic && sections.discriminator),
    Boolean(sections.ancillaryOrReportingConsequence),
    Boolean(sections.safetyPitfall),
    Boolean(sections.visualPlan || sections.inspectionSequence?.length),
    sections.retrievalQuestions?.length >= 4,
    hasEvidenceCard,
    mcqs.length >= 5,
  ];
  return roundScore(checks.filter(Boolean).length / checks.length);
};

const sourceBackedChoiceSet = (correctAnswer, sections) => {
  const choices = unique([
    correctAnswer,
    sections.normalComparator,
    sections.topMimic,
    sections.discriminator,
    sections.ancillaryOrReportingConsequence,
    sections.safetyPitfall,
    sections.morphologyAnchor,
  ]).slice(0, 5);

  while (choices.length < 5) choices.push(`Source-backed option ${choices.length + 1} unavailable`);
  return choices;
};

const buildSourceBackedMcqs = (sections) => {
  if (!sections.definition || !sections.morphologyAnchor || !sections.retrievalQuestions?.length) return [];
  const retrievalMcqs = sections.retrievalQuestions.slice(0, 4).map((entry, index) => ({
    id: `source-backed-retrieval-${index + 1}`,
    source: 'retrievalAnswerKey',
    stem: entry.prompt,
    choices: sourceBackedChoiceSet(entry.answer, sections),
    correct_answer: entry.answer,
    explanation: entry.reasoning || sections.sourceBasis,
    incorrect_explanations: Object.fromEntries(
      sourceBackedChoiceSet(entry.answer, sections)
        .filter((choice) => choice !== entry.answer)
        .map((choice) => [choice, 'Local source-backed distractor; verify against the cited answer key before learner promotion.'])
    ),
    abpath_objective_link: sections.sourceBasis,
    difficulty: index === 0 ? 'basic' : 'intermediate',
  }));

  const visualAnswer = sections.visualPlan || sections.inspectionSequence?.[0] || sections.morphologyAnchor;
  return [
    ...retrievalMcqs,
    {
      id: 'source-backed-visual-anchor-5',
      source: 'visualAnchorDraft',
      stem: `Which local visual-anchor plan should guide image review for this packet?`,
      choices: sourceBackedChoiceSet(visualAnswer, sections),
      correct_answer: visualAnswer,
      explanation: sections.inspectionSequence?.join(' ') || sections.sourceBasis,
      incorrect_explanations: Object.fromEntries(
        sourceBackedChoiceSet(visualAnswer, sections)
          .filter((choice) => choice !== visualAnswer)
          .map((choice) => [choice, 'Local source-backed distractor; verify against the cited visual anchor before learner promotion.'])
      ),
      abpath_objective_link: sections.sourceBasis,
      difficulty: 'board-level',
    },
  ];
};

const selectRows = (sourceMap, limit, requireTopicSpecificEvidence) =>
  sourceMap.candidate_rows
    .filter((row) => !requireTopicSpecificEvidence || row.best_candidate_specificity === 'topic_specific')
    .filter((row) => row.local_candidate_count > 0 && row.local_candidates?.length > 0)
    .slice(0, limit);

const topicSpecificityScore = (row) => {
  if (row.best_candidate_specificity === 'topic_specific') return 0.8;
  if (row.best_candidate_specificity === 'category_only') return 0.35;
  return 0;
};

const buildPacket = (row, index) => {
  const primary = row.local_candidates[0] || {};
  const evidenceCard = findEvidenceCard(row);
  const sections = sourceBackedSections(evidenceCard?.card);
  const mcqs = buildSourceBackedMcqs(sections);
  const objectiveLinked = Boolean(row.id && row.category && row.path);
  const localSourceLinked = Boolean(primary.file_path);
  const sectionCompleteness = scoreSectionCompleteness(sections, Boolean(evidenceCard));
  const evidenceScore = {
    objective_linked: objectiveLinked,
    local_source_linked: localSourceLinked && Boolean(evidenceCard),
    topic_specificity: topicSpecificityScore(row),
    section_completeness: sectionCompleteness,
    image_support: sections.visualPlan || sections.inspectionSequence?.length ? 0.6 : primary.reuse_target === 'image_atlas' ? 0.25 : 0,
    mcq_support: mcqs.length >= 5 ? 1 : roundScore(mcqs.length / 5),
    algorithm_support: sections.inspectionSequence?.length ? 0.6 : 0.2,
    differential_support: sections.topMimic && sections.discriminator ? 0.45 : 0.2,
    worked_example_support: 0,
    promotion_ready: false,
  };
  const blockingReasons = [];
  if (!objectiveLinked) blockingReasons.push('missing_abpath_objective_linkage');
  if (!localSourceLinked) blockingReasons.push('missing_local_source_evidence');
  if (evidenceScore.topic_specificity < 0.75) blockingReasons.push('topic_specificity_below_threshold');
  if (evidenceScore.section_completeness < 0.9) blockingReasons.push('required_content_sections_incomplete');
  if (evidenceScore.mcq_support < 1) blockingReasons.push('missing_mcqs');
  if (evidenceScore.image_support === 0) blockingReasons.push('missing_images_or_image_placeholders');
  if (!evidenceScore.promotion_ready) blockingReasons.push('faculty_review_required_before_promotion');

  return {
    packet_id: `local-content-churn-${String(index + 1).padStart(3, '0')}`,
    source_map_id: row.id,
    topic_id: row.topicId || row.id,
    abpath_domain: 'AP',
    abpath_topic: row.title,
    path: row.path,
    source_specificity: row.best_candidate_specificity,
    local_evidence: {
      source_map: 'reports/curriculum/ap_local_source_map_v1.json',
      primary_source_path: primary.file_path || null,
      extracted_card_source_path: evidenceCard?.sourcePath || null,
      extracted_card_id: evidenceCard?.card?.id || null,
      local_candidate_count: row.local_candidate_count,
      match_reasons: primary.match_reasons || [],
      source_line: row.sourceLine || null,
      source_basis: sections.sourceBasis || null,
      extracted_fields: Object.entries({
        definition: sections.definition,
        normalComparator: sections.normalComparator,
        morphologyAnchor: sections.morphologyAnchor,
        topMimic: sections.topMimic,
        discriminator: sections.discriminator,
        ancillaryOrReportingConsequence: sections.ancillaryOrReportingConsequence,
        safetyPitfall: sections.safetyPitfall,
        visualPlan: sections.visualPlan,
        retrievalQuestions: sections.retrievalQuestions?.length ? 'present' : '',
      })
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key),
    },
    introductory_material: {
      orientation: sections.definition || `Local evidence packet for ${normalizeText(row.title)}.`,
      clinical_relevance:
        sections.ancillaryOrReportingConsequence ||
        'Blocked from promotion until deterministic local sources support full teaching claims.',
      prerequisites: unique([row.category, row.learnerLevel, sections.normalComparator]),
      key_vocabulary: unique([row.title, row.category, sections.scopedDomain]),
    },
    core_didactic: {
      definition: sections.definition || '',
      clinical_context: '',
      gross_findings: '',
      histomorphology: sections.morphologyAnchor || '',
      cytomorphology: '',
      immunophenotype: '',
      molecular_profile: '',
      classification_relevance: '',
      clinical_imaging_correlation: '',
      reporting_management_implications: sections.ancillaryOrReportingConsequence || '',
    },
    images: [
      {
        type: primary.reuse_target === 'image_atlas' ? 'source-linked-placeholder' : 'needs_source',
        teaching_point: sections.visualPlan || normalizeText(row.title),
        caption: sections.assetStatus || '',
        annotations: sections.inspectionSequence || [],
        source_status: evidenceCard ? 'available' : 'needs_source',
      },
    ],
    diagnostic_algorithm: {
      entry_point: normalizeText(row.path),
      steps:
        sections.inspectionSequence?.length > 0
          ? sections.inspectionSequence
          : ['Confirm topic-specific local evidence before diagnostic branch generation.'],
      terminal_nodes: [],
    },
    differential_diagnosis:
      sections.topMimic && sections.discriminator
        ? [
            {
              entity: sections.topMimic,
              shared_features: '',
              distinguishing_features: sections.discriminator,
              ihc_or_lab_discriminator: '',
              molecular_discriminator: '',
              clinical_or_imaging_discriminator: '',
              pitfall: sections.safetyPitfall || '',
            },
          ]
        : [],
    mcqs,
    worked_examples: [],
    retrieval_questions: sections.retrievalQuestions || [],
    retention_tools: {
      high_yield_summary: sections.definition || '',
      diagnostic_hook: sections.morphologyAnchor || '',
      mnemonic: '',
      flashcard_facts: unique((sections.retrievalQuestions || []).map((entry) => entry.answer)),
      comparison_table: sections.topMimic && sections.discriminator ? [`${sections.topMimic} :: ${sections.discriminator}`] : [],
      do_not_miss_pearl: sections.safetyPitfall || '',
    },
    evidence_score: evidenceScore,
    validation_status: blockingReasons.length === 0 ? 'pass' : 'blocked',
    promotion_status: 'review-queue',
    blocking_reasons: blockingReasons,
    ai_review_packet: {
      enabled: false,
      purpose: 'optional_quality_review_only',
      prompt: '',
      local_evidence_summary: primary.file_path
        ? `Primary local evidence: ${primary.file_path}; specificity=${row.best_candidate_specificity}.`
        : '',
      questions_for_reviewer: [],
      forbidden_use: [
        'primary content generation',
        'unstable factual invention',
        'unsourced expansion',
        'promotion gate bypass',
      ],
    },
  };
};

const buildPayload = (options) => {
  const sourceMap = readJson(sourceMapPath);
  const gapInventory = readJson(gapInventoryPath);
  const rows = selectRows(sourceMap, options.limit, options.requireTopicSpecificEvidence);
  const packets = rows.map(buildPacket);
  const promotionReadyPackets = packets.filter((packet) => packet.evidence_score.promotion_ready).length;
  const blockedPackets = packets.filter((packet) => packet.validation_status !== 'pass').length;

  return {
    contract_version: 'ai-independent-local-content-churner.v1',
    runtime: {
      ai_dependency: 'NONE',
      network_access: 'NONE',
      source_mode: 'LOCAL_ONLY',
      allow_ai_review: options.allowAiReview,
      deterministic_generation: true,
    },
    source_inputs: [
      {
        path: 'reports/curriculum/ap_local_source_map_v1.json',
        sha256: hashFile(sourceMapPath),
      },
      {
        path: 'reports/curriculum/gap_inventory_v1.json',
        sha256: hashFile(gapInventoryPath),
      },
    ],
    local_first_source_order: [
      'Existing ABPath objective/specification artifacts',
      'Existing AP/CP source maps',
      'Existing local corpus chunks',
      'Existing local image/image-metadata folders',
      'Existing tutorial-card/content artifacts',
      'Uploaded local seed files',
      'Manually approved external-ingestion outputs',
    ],
    qa_checks: {
      abpath_objective_linkage: packets.every((packet) => packet.evidence_score.objective_linked),
      source_evidence_linkage: packets.every((packet) => packet.evidence_score.local_source_linked),
      topic_specificity_score: packets.every((packet) => packet.evidence_score.topic_specificity >= 0.75),
      required_section_completeness: packets.every((packet) => packet.evidence_score.section_completeness >= 0.9),
      duplicate_content: new Set(packets.map((packet) => packet.source_map_id)).size !== packets.length,
      unsupported_claims: false,
      schema_validity: packets.every((packet) => REQUIRED_SECTIONS.every((section) => Object.hasOwn(packet, section))),
      promotion_depends_on_ai_review: false,
    },
    source_context: {
      gap_inventory_contract_version: gapInventory.contract_version,
      source_map_contract_version: sourceMap.contract_version,
      selected_rows: rows.length,
      require_topic_specific_evidence: options.requireTopicSpecificEvidence,
    },
    packets,
    summary: {
      packet_count: packets.length,
      promotion_ready_packets: promotionReadyPackets,
      blocked_packets: blockedPackets,
      next_safe_action: 'Review blocked packets for stronger local source extraction before promotion.',
    },
  };
};

const renderMarkdown = (payload) => [
  '# AI-Independent Local Content Churner Report',
  '',
  `AI_DEPENDENCY: ${payload.runtime.ai_dependency}`,
  `NETWORK_ACCESS: ${payload.runtime.network_access}`,
  `SOURCE_MODE: ${payload.runtime.source_mode}`,
  'DETERMINISTIC_REGENERATION: PASS',
  `PROMOTION_READY_PACKETS: ${payload.summary.promotion_ready_packets}`,
  `BLOCKED_PACKETS: ${payload.summary.blocked_packets}`,
  `NEXT_SAFE_ACTION: ${payload.summary.next_safe_action}`,
  '',
  '## Packets',
  '',
  '| Packet | Topic | Source | Section completeness | MCQs | Extracted fields | Promotion | Blockers |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...payload.packets.map((packet) =>
    `| ${packet.packet_id} | ${normalizeText(packet.abpath_topic)} | ${packet.local_evidence.extracted_card_source_path || packet.local_evidence.primary_source_path || 'missing'} | ${packet.evidence_score.section_completeness.toFixed(2)} | ${packet.mcqs.length} | ${packet.local_evidence.extracted_fields.join(', ')} | ${packet.evidence_score.promotion_ready ? 'ready' : 'blocked'} | ${packet.blocking_reasons.join(', ')} |`
  ),
  '',
].join('\n');

const validatePayload = (payload) => {
  const failures = [];
  if (payload.runtime.ai_dependency !== 'NONE') failures.push('AI dependency is not NONE');
  if (payload.runtime.network_access !== 'NONE') failures.push('Network access is not NONE');
  if (payload.runtime.source_mode !== 'LOCAL_ONLY') failures.push('Source mode is not LOCAL_ONLY');
  if (payload.qa_checks.duplicate_content) failures.push('Duplicate source-map packet content detected');
  if (!payload.qa_checks.schema_validity) failures.push('Schema validity failed');
  if (!payload.qa_checks.abpath_objective_linkage) failures.push('ABPath objective linkage absent');
  if (!payload.qa_checks.source_evidence_linkage) failures.push('Local source evidence absent');
  if (payload.qa_checks.promotion_depends_on_ai_review) failures.push('Promotion depends on advisory AI review');

  for (const packet of payload.packets) {
    if (packet.evidence_score.promotion_ready && packet.ai_review_packet.enabled) {
      failures.push(`${packet.packet_id} uses AI review as a promotion dependency`);
    }
    if (
      packet.evidence_score.promotion_ready &&
      (packet.evidence_score.topic_specificity < 0.75 ||
        packet.evidence_score.section_completeness < 0.9 ||
        !packet.evidence_score.local_source_linked ||
        !packet.evidence_score.objective_linked)
    ) {
      failures.push(`${packet.packet_id} is promotion-ready without meeting deterministic thresholds`);
    }
  }

  return failures;
};

const main = () => {
  const options = parseArgs();
  const firstPayload = buildPayload(options);
  const secondPayload = buildPayload(options);
  const firstJson = stableJson(firstPayload);
  const secondJson = stableJson(secondPayload);
  if (firstJson !== secondJson) {
    throw new Error('DETERMINISTIC_REGENERATION failed: identical local inputs produced different JSON output');
  }

  const failures = validatePayload(firstPayload);
  if (failures.length > 0) {
    console.error(`Local content churner validation failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  const markdown = renderMarkdown(firstPayload);
  if (options.mode === 'draft') {
    ensureDir(outputJsonPath);
    fs.writeFileSync(outputJsonPath, firstJson);
    fs.writeFileSync(outputMdPath, markdown);
  } else {
    if (!fs.existsSync(outputJsonPath) || !fs.existsSync(outputMdPath)) {
      throw new Error('Validation requires existing deterministic churn JSON and Markdown reports. Run draft mode first.');
    }
    if (fs.readFileSync(outputJsonPath, 'utf8') !== firstJson) {
      throw new Error('Stored churn JSON does not match deterministic regeneration.');
    }
    if (fs.readFileSync(outputMdPath, 'utf8') !== markdown) {
      throw new Error('Stored churn Markdown does not match deterministic regeneration.');
    }
  }

  console.log('AI_DEPENDENCY: NONE');
  console.log('NETWORK_ACCESS: NONE');
  console.log('SOURCE_MODE: LOCAL_ONLY');
  console.log('DETERMINISTIC_REGENERATION: PASS');
  console.log(`PROMOTION_READY_PACKETS: ${firstPayload.summary.promotion_ready_packets}`);
  console.log(`BLOCKED_PACKETS: ${firstPayload.summary.blocked_packets}`);
  console.log(`NEXT_SAFE_ACTION: ${firstPayload.summary.next_safe_action}`);
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
