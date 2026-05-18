#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();

const contractPath = path.join(root, 'src/content/contracts/pthfndrDidacticsLearningUxContract.json');
const tutorialsPath = path.join(root, 'src/components/DidacticTutorials.tsx');
const lecturesPath = path.join(root, 'src/components/DidacticLectures.tsx');
const headerPath = path.join(root, 'src/components/Header.tsx');
const sidebarPath = path.join(root, 'src/components/Sidebar.tsx');
const appPath = path.join(root, 'src/App.tsx');
const stateStoragePath = path.join(root, 'src/utils/viewStateStorage.ts');
const sectionNavPath = path.join(root, 'src/hooks/useSectionNavigation.ts');

const reportJsonPath = path.join(root, 'reports/didactics_learning_ux_report.json');
const reportMdPath = path.join(root, 'reports/didactics_learning_ux_report.md');

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const tutorialsTsx = fs.readFileSync(tutorialsPath, 'utf8');
const lecturesTsx = fs.readFileSync(lecturesPath, 'utf8');
const headerTsx = fs.readFileSync(headerPath, 'utf8');
const sidebarTsx = fs.readFileSync(sidebarPath, 'utf8');
const appTsx = fs.readFileSync(appPath, 'utf8');
const stateStorageTs = fs.readFileSync(stateStoragePath, 'utf8');
const sectionNavTs = fs.readFileSync(sectionNavPath, 'utf8');

const failures = [];
const passes = [];

const ensure = (condition, passMessage, failMessage) => {
  if (condition) {
    passes.push(passMessage);
  } else {
    failures.push(failMessage);
  }
};

const writeReport = (jsonPath, mdPath, payload) => {
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + '\n');

  const md = [
    '# Didactics Learning UX Report',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    `- Passes: ${payload.passes.length}`,
    `- Failures: ${payload.failures.length}`,
    '',
    '## Passes',
    '',
    ...(payload.passes.length ? payload.passes.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Failures',
    '',
    ...(payload.failures.length ? payload.failures.map((item) => `- ${item}`) : ['- None']),
    '',
  ];
  fs.writeFileSync(mdPath, md.join('\n'));
};

ensure(
  contract.productSurface === '/didactics',
  'Contract targets /didactics.',
  'Learning UX contract does not target /didactics.',
);

ensure(
  headerTsx.includes('Go to previous view') && headerTsx.includes('Go to next view'),
  'Header exposes explicit back/forward controls.',
  'Header is missing explicit back/forward navigation controls.',
);

ensure(
  sectionNavTs.includes('window.history.back()') && sectionNavTs.includes('window.history.forward()'),
  'Section navigation uses browser history for resilient movement.',
  'Section navigation is missing browser-history back/forward behavior.',
);

ensure(
  tutorialsTsx.includes('returnToTutorialLibrary'),
  'Tutorials open as destination views with a clear return path.',
  'Tutorial destination view is missing a clear return control.',
);

ensure(
  tutorialsTsx.includes('ABPath scope') && tutorialsTsx.includes('Study sequence'),
  'Tutorial destination view exposes immediate context framing.',
  'Tutorial destination view is missing immediate context framing fields.',
);

ensure(
  tutorialsTsx.includes('Subject progress') &&
    tutorialsTsx.includes('Accuracy') &&
    tutorialsTsx.includes('Questions remaining'),
  'Tutorial quick-check surface exposes visible feedback and reward loops.',
  'Tutorial quick-check surface is missing visible feedback or reward-loop metrics.',
);

ensure(
  tutorialsTsx.includes('Faculty review required before trusting this key.'),
  'Incorrect-answer flow can raise discrepancy feedback.',
  'Incorrect-answer flow is missing discrepancy-feedback messaging.',
);

ensure(
  tutorialsTsx.includes('writeSessionState<TutorialViewState>') &&
    lecturesTsx.includes('writeSessionState<LectureViewState>') &&
    stateStorageTs.includes('sessionStorage'),
  'Tutorial and lecture routes preserve prior state across resume flow.',
  'Route state persistence for tutorial and lecture views is incomplete.',
);

ensure(
  lecturesTsx.includes('Lecture learning paths') &&
    lecturesTsx.includes('Resume topic') &&
    lecturesTsx.includes('Open') &&
    lecturesTsx.includes('Back'),
  'Lecture destinations use concise path framing with an immediate return action.',
  'Lecture destination surface still relies on legacy phrasing.',
);

ensure(
  sidebarTsx.includes('Study') &&
    sidebarTsx.includes('Curriculum') &&
    sidebarTsx.includes('Images') &&
    sidebarTsx.includes('Sign-Out'),
  'Persistent navigation remains stable and labeled.',
  'Persistent navigation is missing required stable primary destinations.',
);

ensure(
  headerTsx.includes('Focus View') || appTsx.includes('focusMode'),
  'The app communicates focused working-state context.',
  'The app is missing focused working-state context messaging.',
);

ensure(
  tutorialsTsx.includes('rounded-xl border border-slate-200 bg-slate-50') &&
    lecturesTsx.includes('rounded-xl border border-slate-200 bg-slate-50'),
  'Didactics routes use chunked grouped panels rather than unstructured text walls.',
  'Didactics routes may be missing chunked grouped panel structure.',
);

const payload = {
  generatedAt: new Date().toISOString(),
  contractVersion: contract.version,
  passes,
  failures,
};

writeReport(reportJsonPath, reportMdPath, payload);

if (failures.length > 0) {
  console.error(`[DIDACTICS-UX] Validation failed with ${failures.length} issue(s).`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`[DIDACTICS-UX] Validation passed with ${passes.length} checks.`);
