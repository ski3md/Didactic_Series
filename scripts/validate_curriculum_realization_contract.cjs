#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const contractPath = path.join(root, 'docs/contracts/CORPUS_REALIZATION_CONTRACT.md');
const contract = fs.readFileSync(contractPath, 'utf8');

const failures = [];
const passes = [];

const ensure = (condition, passMessage, failMessage) => {
  if (condition) {
    passes.push(passMessage);
  } else {
    failures.push(failMessage);
  }
};

const includesAll = (terms) => terms.every((term) => contract.includes(term));

ensure(
  contract.includes('The system must never immediately crawl the internet.'),
  'contract forbids immediate internet crawling',
  'contract must explicitly forbid immediate internet crawling'
);

const hierarchyTerms = [
  'Existing curriculum content',
  'Local hard-drive corpus',
  'Previously indexed local knowledge base',
  'Internal ontology/library',
  'Open-access online sources',
  'Licensed sources',
  'Human escalation',
];
ensure(
  includesAll(hierarchyTerms),
  'contract preserves the seven-tier knowledge acquisition hierarchy',
  `contract is missing hierarchy tiers: ${hierarchyTerms.filter((term) => !contract.includes(term)).join(', ')}`
);

ensure(
  contract.indexOf('Existing curriculum content') < contract.indexOf('Open-access online sources') &&
    contract.indexOf('Local hard-drive corpus') < contract.indexOf('Open-access online sources'),
  'local tiers precede open-access online sources',
  'local curriculum/corpus tiers must precede open-access online sources'
);

const infrastructureTerms = [
  'Local Data Infrastructure Registry',
  'System architecture inventory: `/Users/ski_mini/SystemArchitectureInventory`',
  '`SYSTEM_SOURCE_OF_TRUTH.md`',
  '`system_inventory.json`',
  'Primary external HD: `/Volumes/DB_External`',
  'Secondary external HD / cold corpus: `/Volumes/Elements`',
  'NAS/network mounts',
  'Do not assume a NAS path.',
  '`nas_unavailable`',
  '`infrastructure_tier_attempted`',
  '`path_checked`',
  '`mounted`',
  '`result_count`',
  '`gap_status`',
  '`skip_rationale`',
];
ensure(
  includesAll(infrastructureTerms),
  'local data infrastructure registry is explicit and machine-checkable',
  `contract is missing local data infrastructure requirements: ${infrastructureTerms
    .filter((term) => !contract.includes(term))
    .join(', ')}`
);

ensure(
  contract.indexOf('Local Data Infrastructure Registry') < contract.indexOf('Open-access online sources'),
  'local infrastructure registry precedes online acquisition',
  'local data infrastructure registry must precede open-access online sources'
);

ensure(
  contract.includes('the agent must reference it instead of recreating it'),
  'contract forbids redundant reconstruction when local evidence already exists',
  'contract must require referencing existing local evidence before recreating assets'
);

const churnAddendumTerms = [
  'Contract Addendum: AI-Independent Local Content Churner',
  'deterministic and AI-independent at runtime',
  'must not require an LLM, API key, cloud model, agent, or network connection',
  'AI only as an optional downstream reviewer, never as a dependency',
  'Fail closed when evidence is missing, weak, or non-specific',
  'Avoid online crawling unless a separate, explicitly approved ingestion contract is invoked',
  'Existing ABPath objective/specification artifacts',
  'Existing AP/CP source maps',
  'Existing local corpus chunks',
  'Existing local image/image-metadata folders',
  'Existing tutorial-card/content artifacts',
  'Uploaded local seed files',
  'Manually approved external-ingestion outputs',
  '"ai_review_packet"',
  '"optional_quality_review_only"',
  '"primary content generation"',
  '"promotion gate bypass"',
  'OpenAI API',
  'Claude API',
  'Gemini API',
  'local Ollama model',
  'remote crawler',
  'browser automation',
  'network fetch',
  '--allow-ai-review true',
  'advisory review only',
  'ABPath objective linkage',
  'Source evidence linkage',
  'Topic-specificity score',
  'Required section completeness',
  'Duplicate content',
  'Unsupported claims',
  'Missing images or image placeholders',
  'Missing MCQs',
  'Missing diagnostic algorithms',
  'Missing differential diagnosis',
  'Missing worked examples for quantitative topics',
  '"evidence_score"',
  '"topic_specificity"',
  '"section_completeness"',
  '"promotion_ready"',
  'topic_specificity >= 0.75',
  'section_completeness >= 0.90',
  'node scripts/churn_contract_aligned_content.cjs',
  '"curriculum:churn"',
  '"curriculum:churn:validate"',
  'The script attempts network access.',
  'AI output is used as primary content.',
  'The packet cannot be regenerated deterministically.',
  'Promotion depends on advisory AI review.',
  '`AI_DEPENDENCY: NONE`',
  '`NETWORK_ACCESS: NONE`',
  '`SOURCE_MODE: LOCAL_ONLY`',
  '`DETERMINISTIC_REGENERATION: PASS/FAIL`',
  '`PROMOTION_READY_PACKETS: N`',
  '`BLOCKED_PACKETS: N`',
];
ensure(
  includesAll(churnAddendumTerms),
  'AI-independent local content churner addendum is complete',
  `contract is missing AI-independent churner requirements: ${churnAddendumTerms
    .filter((term) => !contract.includes(term))
    .join(', ')}`
);

ensure(
  contract.indexOf('Existing ABPath objective/specification artifacts') < contract.indexOf('Manually approved external-ingestion outputs'),
  'local-first churner source order precedes approved external-ingestion outputs',
  'local-first churner source order must precede approved external-ingestion outputs'
);

const gapInventoryFields = [
  '`gap_id`',
  '`abpath_section`',
  '`abpath_topic`',
  '`current_status`',
  '`severity`',
  '`educational_artifact_needed`',
  '`estimated_tokens`',
  '`estimated_images`',
  '`estimated_mcqs`',
  '`estimated_effort`',
  '`source_tier_attempted`',
  '`tier_skip_rationale`',
  '`review_status`',
  '`promotion_status`',
];
ensure(
  includesAll(gapInventoryFields),
  'gap inventory required fields are complete',
  `gap inventory is missing required fields: ${gapInventoryFields.filter((term) => !contract.includes(term)).join(', ')}`
);

const requiredArtifactSections = [
  'Lecture modules require:',
  'Image modules require:',
  'MCQ modules require',
  'Worked-example modules are required',
  'Worked examples must include:',
];
ensure(
  includesAll(requiredArtifactSections),
  'standard gap-closure artifact requirements are present',
  `contract is missing artifact requirement sections: ${requiredArtifactSections
    .filter((term) => !contract.includes(term))
    .join(', ')}`
);

const thermodynamicsTerms = [
  'Coverage = covered_topics / total_topics',
  'Depth = present_elements / required_elements',
  'Image Density = images_present / images_required',
  'Question Density = mcqs_present / mcqs_required',
  'Worked Example Density = examples_present / examples_required',
  'Educational Entropy',
  'Clinical Competency Realization Score (CCRS)',
];
ensure(
  includesAll(thermodynamicsTerms),
  'curriculum thermodynamics and CCRS metrics are present',
  `contract is missing thermodynamics metrics: ${thermodynamicsTerms
    .filter((term) => !contract.includes(term))
    .join(', ')}`
);

const completionTerms = [
  'ABPath Coverage = 100%',
  'Required Images = 100%',
  'Required MCQs = 100%',
  'Required Worked Examples = 100%',
  'Critical Gaps = 0',
  'Major Gaps = 0',
  'Educational Entropy approaches zero',
];
ensure(
  includesAll(completionTerms),
  'completion criteria are present',
  `contract is missing completion criteria: ${completionTerms.filter((term) => !contract.includes(term)).join(', ')}`
);

ensure(
  contract.includes('next_100_highest_priority_topics') && contract.includes('No topic may be skipped.'),
  'autonomous continuation requires next 100 topics and no skipped topics',
  'autonomous continuation must require next_100_highest_priority_topics and no skipped topics'
);

if (failures.length > 0) {
  console.error(`Curriculum realization contract validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`[CURRICULUM-REALIZATION-CONTRACT] Validation passed with ${passes.length} checks.`);
