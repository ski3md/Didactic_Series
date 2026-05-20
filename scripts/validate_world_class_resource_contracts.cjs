#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const worldContract = JSON.parse(fs.readFileSync(path.join(root, 'src/content/contracts/worldClassFreeResourceContract.json'), 'utf8'));
const cpContract = JSON.parse(fs.readFileSync(path.join(root, 'src/content/clinical_pathology/cpContentContracts.json'), 'utf8'));
const journeyReport = JSON.parse(fs.readFileSync(path.join(root, 'reports/content_consumption_journey_evaluation.json'), 'utf8'));
const learningUxContract = JSON.parse(fs.readFileSync(path.join(root, 'src/content/contracts/pthfndrDidacticsLearningUxContract.json'), 'utf8'));

const failures = [];
const learningUxGateLabel = worldContract.globalGates?.learningUxGateLabel || 'learning UX';
const summarizeAssessmentDeficits = (domain) => {
  const minimums = domain.contractParameters?.minimums || {};
  const deficits = [];
  if ((domain.availableTutorialCount || 0) < (minimums.tutorials || 0)) {
    deficits.push('tutorials');
  }
  if ((domain.availableMcqCount || 0) < (minimums.mcqs || 0)) {
    deficits.push('mcqs');
  }
  if ((domain.availableFlashcardCount || 0) < (minimums.flashcards || 0)) {
    deficits.push('flashcards');
  }
  return deficits;
};

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

const requiredGlobalGates = ['scope', 'source anchors', 'learner level', 'asset readiness', 'assessment evidence', 'remediation path', 'trust/provenance', learningUxGateLabel];
for (const gate of requiredGlobalGates) {
  if (!worldContract.globalGates?.requiredRouteContracts?.includes(gate)) {
    failures.push(`World contract missing required route gate: ${gate}`);
  }
}
if (!worldContract.globalGates?.learningUxRule) {
  failures.push('World contract is missing learningUxRule.');
}
if (worldContract.globalGates?.learningUxContractVersion !== learningUxContract.version) {
  failures.push(
    `World contract learning UX version drift: expected ${learningUxContract.version}, found ${worldContract.globalGates?.learningUxContractVersion || 'missing'}.`
  );
}
if (worldContract.globalGates?.learningUxContractSurface !== learningUxContract.productSurface) {
  failures.push(
    `World contract learning UX surface drift: expected ${learningUxContract.productSurface}, found ${worldContract.globalGates?.learningUxContractSurface || 'missing'}.`
  );
}
if (!worldContract.globalGates?.learningUxRule?.includes(learningUxContract.productSurface)) {
  failures.push(`World contract learningUxRule must explicitly reference ${learningUxContract.productSurface}.`);
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
  if (domain.sourceAnchorCount < domain.contractParameters.minimums.sourceAnchors && !(domain.contractWarnings || []).length) {
    failures.push(`${domain.domainId} is source-thin but has no contract warning.`);
  }
  if (!domain.sourceRealizationMode) {
    failures.push(`${domain.domainId} is missing sourceRealizationMode.`);
  }
  if (!domain.sourceAnchorBasis) {
    failures.push(`${domain.domainId} is missing sourceAnchorBasis.`);
  }
  if (!domain.representativeAnchorBasis) {
    failures.push(`${domain.domainId} is missing representativeAnchorBasis.`);
  }
  if (!domain.tutorialCountBasis) {
    failures.push(`${domain.domainId} is missing tutorialCountBasis.`);
  }
  if (typeof domain.availableInteractiveTutorialCount !== 'number') {
    failures.push(`${domain.domainId} is missing availableInteractiveTutorialCount.`);
  }
  if (typeof domain.availableGovernedTutorialRowCount !== 'number') {
    failures.push(`${domain.domainId} is missing availableGovernedTutorialRowCount.`);
  }
  const assessmentDeficits = summarizeAssessmentDeficits(domain);
  if (domain.sourceRealizationMode === 'native-spec-root') {
    if (domain.sourceAnchorCount < domain.contractParameters.minimums.sourceAnchors) {
      if (domain.buildoutStatus !== 'source-thin scaffold') {
        failures.push(`${domain.domainId} is source-thin but is not marked source-thin scaffold.`);
      }
    } else if (domain.buildoutStatus !== 'promotion-ready seed depth') {
      failures.push(`${domain.domainId} has mature native source depth but is not marked promotion-ready seed depth.`);
    }
  } else if (domain.sourceRealizationMode === 'synthetic-governed-recovery') {
    if (!(domain.contractWarnings || []).length) {
      failures.push(`${domain.domainId} is synthetic-governed-recovery but has no contract warnings.`);
    }
    if (domain.tutorialCountBasis !== 'interactive-tutorial-records') {
      failures.push(`${domain.domainId} synthetic tutorialCountBasis must reflect interactive tutorial records.`);
    }
    if (domain.availableTutorialCount !== domain.availableInteractiveTutorialCount) {
      failures.push(`${domain.domainId} availableTutorialCount must equal availableInteractiveTutorialCount for synthetic domains.`);
    }
    if (domain.availableGovernedTutorialRowCount < domain.availableInteractiveTutorialCount) {
      failures.push(`${domain.domainId} governed tutorial row count cannot be lower than interactive tutorial count.`);
    }
    if (!domain.algorithmCountBasis) {
      failures.push(`${domain.domainId} synthetic domain is missing algorithmCountBasis.`);
    }
    if (typeof domain.declaredAlgorithmTopicCount !== 'number') {
      failures.push(`${domain.domainId} synthetic domain is missing declaredAlgorithmTopicCount.`);
    }
    if (typeof domain.availableAlgorithmRouteCount !== 'number') {
      failures.push(`${domain.domainId} synthetic domain is missing availableAlgorithmRouteCount.`);
    }
    if (
      domain.declaredAlgorithmTopicCount > domain.availableAlgorithmRouteCount &&
      !(domain.contractWarnings || []).some((warning) => String(warning).includes('Algorithm coverage remains declared-only'))
    ) {
      failures.push(`${domain.domainId} must declare algorithm coverage gap when curriculum algorithm topics exceed implemented routes.`);
    }
    if (domain.sourceAnchorCount >= domain.contractParameters.minimums.sourceAnchors && assessmentDeficits.length > 0) {
      if (domain.buildoutStatus !== 'governed recovery scaffold') {
        failures.push(`${domain.domainId} is recovery-derived with assessment deficits but is not marked governed recovery scaffold.`);
      }
    }
    if (assessmentDeficits.length === 0 && domain.sourceAnchorCount >= domain.contractParameters.minimums.sourceAnchors) {
      if (domain.buildoutStatus !== 'promotion-ready seed depth') {
        failures.push(`${domain.domainId} is recovery-derived and assessment-complete but is not marked promotion-ready seed depth.`);
      }
    }
  } else {
    failures.push(`${domain.domainId} has unrecognized sourceRealizationMode: ${domain.sourceRealizationMode}`);
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
