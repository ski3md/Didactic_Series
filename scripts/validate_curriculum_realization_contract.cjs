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
