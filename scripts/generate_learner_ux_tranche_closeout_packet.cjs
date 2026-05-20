#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportPath = path.join(root, 'reports/didactics_learning_ux_report.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const homePath = path.join(root, 'src/components/Home.tsx');
const referencePath = path.join(root, 'src/components/ReferenceLibrary.tsx');
const competencyPath = path.join(root, 'src/components/CompetencyMatrix.tsx');
const outJsonPath = path.join(root, 'reports/learner_ux_tranche_closeout_packet.json');
const outMdPath = path.join(root, 'reports/learner_ux_tranche_closeout_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readText = (filePath) => fs.readFileSync(filePath, 'utf8');
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const countMatches = (text, pattern) => (text.match(pattern) || []).length;

const appearsInOrder = (text, patterns) => {
  let cursor = 0;
  for (const pattern of patterns) {
    const matcher = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
    matcher.lastIndex = cursor;
    const match = matcher.exec(text);
    if (!match) {
      return false;
    }
    cursor = match.index + Math.max(match[0].length, 1);
  }
  return true;
};

const report = readJson(reportPath);
const ledger = readJson(ledgerPath);
const homeTsx = readText(homePath);
const referenceTsx = readText(referencePath);
const competencyTsx = readText(competencyPath);
const tranche = ledger.tranches.find((entry) => entry.id === 'T03');

if (!tranche) {
  throw new Error('Missing T03 tranche in full_1000_execution_ledger.json');
}

const referencePasses = report.passes.filter((entry) => entry.startsWith('Reference Library'));
const homeStartHereCount = countMatches(homeTsx, />Start here</g);
const competencyReferenceButtonCount =
  (competencyTsx.includes('Review standards') ? 1 : 0) + (competencyTsx.includes('Open reference page') ? 1 : 0);

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T03 W01 Learner UX',
  source: {
    uxReport: 'reports/didactics_learning_ux_report.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
    ownedSurfaces: [
      'src/components/Home.tsx',
      'src/components/ReferenceLibrary.tsx',
      'src/components/CompetencyMatrix.tsx',
    ],
  },
  validator: {
    passCount: report.passes.length,
    failureCount: report.failures.length,
    referencePassCount: referencePasses.length,
  },
  learnerFlow: {
    home: {
      masterclassStartHereCount: homeStartHereCount,
      hasSecondaryRoutes: /Secondary routes/.test(homeTsx),
      hasClinicalPathTutorialRoute: /Clinical pathology tutorials/.test(homeTsx),
    },
    referenceLibrary: {
      hasStartHere: />Start here</.test(referenceTsx),
      hasReviewChoiceTitle: /Choose the kind of review you want/.test(referenceTsx),
      opensWithStudyFraming: appearsInOrder(referenceTsx, [
        /Start here/,
        /Choose the kind of review you want/,
        /Study and sign-out calibration/,
      ]),
      guidanceOrderIsStable: appearsInOrder(referenceTsx, [
        /Diagnostic focus/,
        /Review approach/,
        /What to recognize/,
      ]),
    },
    competencyMatrix: {
      hasLearnerFocus: /Learner focus/.test(competencyTsx),
      referenceButtonCount: competencyReferenceButtonCount,
      hasReferenceGuideTitle: /Review source standards and scoring guides when you need them/.test(competencyTsx),
      filterPrompts: {
        search: />Search</.test(competencyTsx),
        domain: />Domain</.test(competencyTsx),
        readyNowOnly: /Ready now only/.test(competencyTsx),
      },
    },
  },
  execution: {
    completedStepIds: tranche.completionEvidence.completedStepIds,
    proofCommands: [
      'npm run didactics:ux:validate',
      'npm run test -- src/components/Home.test.tsx',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts scripts/validate_learner_ux_tranche_closeout_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    baselineGreen:
      report.failures.length === 0 &&
      homeStartHereCount === 1 &&
      competencyReferenceButtonCount === 2 &&
      referencePasses.length >= 6 &&
      appearsInOrder(referenceTsx, [/Diagnostic focus/, /Review approach/, /What to recognize/]),
    staleWhen: [
      'the didactics learner UX report changes without regenerating this packet',
      'the owned learner UX surfaces lose their governed Start here, reference, or filter signals without regenerating this packet',
      'the tranche ledger status or completed step list changes without regenerating this packet',
    ],
  },
};

const md = [
  '# Learner UX Tranche Closeout Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  '',
  '## Validator',
  '',
  `- Pass count: ${payload.validator.passCount}`,
  `- Failure count: ${payload.validator.failureCount}`,
  `- Reference-library pass count: ${payload.validator.referencePassCount}`,
  '',
  '## Learner Flow',
  '',
  `- Home masterclass Start here count: ${payload.learnerFlow.home.masterclassStartHereCount}`,
  `- Home has secondary routes: ${payload.learnerFlow.home.hasSecondaryRoutes ? 'yes' : 'no'}`,
  `- Home has Clinical Pathology tutorial route: ${payload.learnerFlow.home.hasClinicalPathTutorialRoute ? 'yes' : 'no'}`,
  `- Reference Library Start here: ${payload.learnerFlow.referenceLibrary.hasStartHere ? 'yes' : 'no'}`,
  `- Reference Library review-choice title: ${payload.learnerFlow.referenceLibrary.hasReviewChoiceTitle ? 'yes' : 'no'}`,
  `- Reference Library opens with study framing: ${payload.learnerFlow.referenceLibrary.opensWithStudyFraming ? 'yes' : 'no'}`,
  `- Reference Library guidance order stable: ${payload.learnerFlow.referenceLibrary.guidanceOrderIsStable ? 'yes' : 'no'}`,
  `- Competency Matrix learner focus: ${payload.learnerFlow.competencyMatrix.hasLearnerFocus ? 'yes' : 'no'}`,
  `- Competency Matrix reference buttons: ${payload.learnerFlow.competencyMatrix.referenceButtonCount}`,
  `- Competency Matrix reference guide title: ${payload.learnerFlow.competencyMatrix.hasReferenceGuideTitle ? 'yes' : 'no'}`,
  `- Competency Matrix filter prompts: search=${payload.learnerFlow.competencyMatrix.filterPrompts.search ? 'yes' : 'no'}, domain=${payload.learnerFlow.competencyMatrix.filterPrompts.domain ? 'yes' : 'no'}, ready-now-only=${payload.learnerFlow.competencyMatrix.filterPrompts.readyNowOnly ? 'yes' : 'no'}`,
  '',
  '## Execution',
  '',
  `- Completed step ids: ${payload.execution.completedStepIds.join(', ')}`,
  `- Proof commands: ${payload.execution.proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
  '',
  '## Completion Gate',
  '',
  `- Baseline green: ${payload.completionGate.baselineGreen ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((entry) => `- stale when: ${entry}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[LEARNER-UX-CLOSEOUT] Wrote closeout packet for ${payload.tranche}.`);
