#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const worldContract = JSON.parse(fs.readFileSync(path.join(root, 'src/content/contracts/worldClassFreeResourceContract.json'), 'utf8'));
const cpContract = JSON.parse(fs.readFileSync(path.join(root, 'src/content/clinical_pathology/cpContentContracts.json'), 'utf8'));
const journeyReport = JSON.parse(fs.readFileSync(path.join(root, 'reports/content_consumption_journey_evaluation.json'), 'utf8'));

const failures = [];

if (journeyReport.journeys?.length !== 7) {
  failures.push(`Expected 7 journey evaluations, found ${journeyReport.journeys?.length ?? 0}.`);
}

for (const journey of journeyReport.journeys || []) {
  if (!journey.pathway?.length) failures.push(`${journey.id} missing pathway.`);
  if ((journey.deterministicGates || []).length < 3) failures.push(`${journey.id} has fewer than 3 deterministic gates.`);
  for (const section of ['observedStrengths', 'observedWeaknesses', 'opportunities', 'threats']) {
    if ((journey[section] || []).length < 2) failures.push(`${journey.id} has insufficient ${section}.`);
  }
}

const requiredGlobalGates = ['scope', 'source anchors', 'learner level', 'asset readiness', 'assessment evidence', 'remediation path', 'trust/provenance'];
for (const gate of requiredGlobalGates) {
  if (!worldContract.globalGates?.requiredRouteContracts?.includes(gate)) {
    failures.push(`World contract missing required route gate: ${gate}`);
  }
}

if (worldContract.journeyContracts?.length !== 7) {
  failures.push('World contract does not mirror all 7 journey contracts.');
}

if ((cpContract.domains || []).length < 4) {
  failures.push(`Expected at least 4 CP domains, found ${cpContract.domains?.length ?? 0}.`);
}

for (const domain of cpContract.domains || []) {
  if (domain.sourceAnchorCount < domain.contractParameters.minimums.sourceAnchors) {
    failures.push(`${domain.domainId} has insufficient source anchors.`);
  }
  if (domain.sourceAnchorCount < 10 && !(domain.contractWarnings || []).length) {
    failures.push(`${domain.domainId} is source-thin but has no contract warning.`);
  }
  if (domain.sourceAnchorCount >= 10 && domain.buildoutStatus !== 'promotion-ready seed depth') {
    failures.push(`${domain.domainId} has mature source depth but is not marked promotion-ready seed depth.`);
  }
  if ((domain.contractParameters.requiredAssets || []).length < 5) {
    failures.push(`${domain.domainId} has too few required CP assets.`);
  }
  if ((domain.contractParameters.safetyCriticalActions || []).length < 3) {
    failures.push(`${domain.domainId} has too few safety-critical actions.`);
  }
  if (!domain.promotionGate?.includes('safety actions')) {
    failures.push(`${domain.domainId} promotion gate does not include safety actions.`);
  }
}

if (failures.length) {
  console.error(`World-class resource contract validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`World-class resource contract validation passed: ${journeyReport.journeys.length} journeys, ${cpContract.domains.length} CP domains.`);
