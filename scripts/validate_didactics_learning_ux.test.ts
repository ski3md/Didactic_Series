import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  collectPublicTopicLabels,
  evaluateHierarchySemantics,
  evaluateRefreshAndHistorySemantics,
  evaluateReferenceBoundarySemantics,
  evaluateReferenceRouteSemantics,
  evaluateWorkspaceRoutingSemantics,
  evaluateWorkspaceSemantics,
  findDuplicatePublicTopicLabels,
  toSlashVariantKey,
} = require('./validate_didactics_learning_ux.cjs') as {
  collectPublicTopicLabels: (input: {
    tutorialCatalog?: Array<Record<string, string>>;
    validatedManifest?: { rows?: Array<Record<string, string>> };
    algorithmCatalog?: Array<Record<string, string>>;
    curriculumCatalogText?: string;
  }) => Array<{ label: string; source: string }>;
  evaluateWorkspaceSemantics: (input: {
    appTsx?: string;
    headerTsx?: string;
    sidebarTsx?: string;
    workspaceNavTsx?: string;
    componentTexts?: Record<string, string>;
  }) => { passes: string[]; issues: string[] };
  evaluateWorkspaceRoutingSemantics: (input: {
    tutorialsTsx?: string;
    lecturesTsx?: string;
    algorithmsTsx?: string;
    sidebarTsx?: string;
    workspaceNavTsx?: string;
    lectureNavigationTs?: string;
    tutorialNavigationTs?: string;
    algorithmNavigationTs?: string;
  }) => { passes: string[]; issues: string[] };
  evaluateRefreshAndHistorySemantics: (input: {
    studyDestinationStateTs?: string;
    sectionNavTs?: string;
    tutorialsTsx?: string;
    lecturesTsx?: string;
    algorithmsTsx?: string;
  }) => { passes: string[]; issues: string[] };
  evaluateHierarchySemantics: (input: {
    tutorialsTsx?: string;
    lecturesTsx?: string;
    algorithmsTsx?: string;
    curriculumTsx?: string;
  }) => { passes: string[]; issues: string[] };
  evaluateReferenceBoundarySemantics: (input: {
    homeTsx?: string;
    mobileHeaderTsx?: string;
    sidebarTsx?: string;
    curriculumTsx?: string;
    lecturesTsx?: string;
    algorithmsTsx?: string;
  }) => { passes: string[]; issues: string[] };
  evaluateReferenceRouteSemantics: (input: {
    appTsx?: string;
    sectionNavTs?: string;
    referenceTsx?: string;
  }) => { passes: string[]; issues: string[] };
  findDuplicatePublicTopicLabels: (
    entries: Array<{ label: string; source: string }>
  ) => Array<{ normalizedKey: string; entries: Array<{ label: string; source: string }> }>;
  toSlashVariantKey: (label: string) => string | null;
};

describe('validate_didactics_learning_ux helpers', () => {
  it('normalizes slash-order variants to a shared key', () => {
    expect(toSlashVariantKey('Blood Banking / Transfusion Medicine')).toBe(
      'blood banking / transfusion medicine'
    );
    expect(toSlashVariantKey('Transfusion Medicine / Blood Banking')).toBe(
      'blood banking / transfusion medicine'
    );
    expect(toSlashVariantKey('Clinical Pathology')).toBeNull();
  });

  it('flags duplicate public topic labels when slash-format variants drift across surfaces', () => {
    const labels = collectPublicTopicLabels({
      tutorialCatalog: [
        { category: 'Blood Banking / Transfusion Medicine', abpathRootTopic: 'Chemical Pathology' },
      ],
      validatedManifest: {
        rows: [{ abpathRoot: 'Blood Banking/Transfusion Medicine' }],
      },
      algorithmCatalog: [{ category: 'Clinical Pathology' }],
      curriculumCatalogText: "subspecialty: 'Clinical Pathology'\nsubspecialty: 'Blood Banking / Transfusion Medicine'\n",
    });

    const duplicates = findDuplicatePublicTopicLabels(labels);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.normalizedKey).toBe('blood banking / transfusion medicine');
    expect(duplicates[0]?.entries.map((entry) => entry.label)).toEqual([
      'Blood Banking / Transfusion Medicine',
      'Blood Banking/Transfusion Medicine',
    ]);
  });

  it('accepts workspace semantics when header, routes, and landing resets agree', () => {
    const result = evaluateWorkspaceSemantics({
      appTsx: `
        <Header currentSection={displayedSection} />
        switch (currentSection) {
          case Section.PATHOLOGY_CURRICULUM: return <PathologyCurriculum />;
          case Section.DIDACTIC_LECTURES: return <DidacticLectures />;
          case Section.DIDACTIC_TUTORIALS: return <DidacticTutorials />;
          case Section.DIDACTIC_ALGORITHMS: return <AlgorithmNavigator />;
        }
      `,
      headerTsx: `
        const resolveHeaderTitle = (currentSection: Section): string => {
          switch (currentSection) {
            case Section.DIDACTIC_LECTURES:
              return 'Lectures';
            case Section.DIDACTIC_TUTORIALS:
              return 'Tutorials';
            case Section.DIDACTIC_ALGORITHMS:
              return 'Workups';
            default:
              return currentSection;
          }
        };
        const headerTitle = resolveHeaderTitle(currentSection);
        <h1>{headerTitle}</h1>
      `,
      sidebarTsx: `
        label: 'Curriculum'
        label: 'Lectures'
        pushStudyDestination('lectures', { kind: 'landing', previous: null })
        label: 'Tutorials'
        pushStudyDestination('tutorials', { kind: 'landing', previous: null })
        label: 'Workups'
        pushStudyDestination('algorithms', { kind: 'landing', previous: null })
      `,
      workspaceNavTsx: 'item.onActivate?.(); onSectionChange(item.section);',
      componentTexts: {
        curriculum: 'Start here Common diagnostic patterns Choose another module',
        lectures: 'Lectures Choose a teaching topic Current review: Lectures Next: open one topic Continue where you left off',
        tutorials: 'Tutorials Resume topic Current review: Tutorials Next: choose one major topic Open the reviewed topic instead',
        algorithms: 'Workups Choose a diagnostic workup Diagnostic areas Current review: Workups Next: open one diagnostic area',
      },
    });

    expect(result.issues).toEqual([]);
    expect(result.passes.length).toBeGreaterThan(8);
  });

  it('flags missing landing resets and missing workspace identity signals', () => {
    const result = evaluateWorkspaceSemantics({
      appTsx: `
        <Header currentSection={displayedSection} />
        switch (currentSection) {
          case Section.PATHOLOGY_CURRICULUM: return <PathologyCurriculum />;
          case Section.DIDACTIC_LECTURES: return <DidacticLectures />;
          case Section.DIDACTIC_TUTORIALS: return <DidacticTutorials />;
          case Section.DIDACTIC_ALGORITHMS: return <AlgorithmNavigator />;
        }
      `,
      headerTsx: '<h1>{currentSection}</h1>',
      sidebarTsx: `
        label: 'Curriculum'
        label: 'Lectures'
        label: 'Tutorials'
        pushStudyDestination('tutorials', { kind: 'landing', previous: null })
        label: 'Workups'
      `,
      workspaceNavTsx: 'onSectionChange(item.section);',
      componentTexts: {
        curriculum: 'Continue with',
        lectures: 'Overview cards only',
        tutorials: 'Tutorials',
        algorithms: 'Workups',
      },
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Workspace switcher does not clearly activate destination state before section change.'),
        expect.stringContaining('Lectures does not show a landing-state workspace reset in Sidebar using shared authority.'),
        expect.stringContaining('Workups does not show a landing-state workspace reset in Sidebar using shared authority.'),
        expect.stringContaining('Lectures main-panel component lacks a visible workspace identity signal.'),
        expect.stringContaining('Lectures landing is missing a compact current-review and next-step summary.'),
      ])
    );
  });

  it('flags headers that keep internal didactics labels instead of governed workspace names', () => {
    const result = evaluateWorkspaceSemantics({
      appTsx: `
        <Header currentSection={displayedSection} />
        switch (currentSection) {
          case Section.DIDACTIC_LECTURES: return <DidacticLectures />;
          case Section.DIDACTIC_TUTORIALS: return <DidacticTutorials />;
          case Section.DIDACTIC_ALGORITHMS: return <AlgorithmNavigator />;
        }
      `,
      headerTsx: `
        const headerTitle = currentSection;
        <h1>{headerTitle}</h1>
      `,
      sidebarTsx: `
        label: 'Lectures'
        pushStudyDestination('lectures', { kind: 'landing', previous: null })
        label: 'Tutorials'
        pushStudyDestination('tutorials', { kind: 'landing', previous: null })
        label: 'Workups'
        pushStudyDestination('algorithms', { kind: 'landing', previous: null })
      `,
      workspaceNavTsx: 'item.onActivate?.(); onSectionChange(item.section);',
      componentTexts: {
        lectures: 'Lectures Choose a teaching topic Resume last lecture',
        tutorials: 'Tutorials Resume topic Open the reviewed topic instead',
        algorithms: 'Workups Choose a diagnostic workup Diagnostic areas',
      },
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Header title is not clearly resolved through governed public workspace labels.'),
      ])
    );
  });

  it('accepts workspace query-routing semantics when each workspace restores and scopes its own route state', () => {
    const result = evaluateWorkspaceRoutingSemantics({
      tutorialsTsx: `
        const intent = consumeTutorialLibraryIntent();
        const restoredDestination = restoreStudyDestination('tutorials');
        setDestination(restoredDestination);
        setStudyDestinationActiveTab('tutorials', activeTab);
        if (intent?.query) { findBestTutorialMatch([],[intent.query]); }
        if (nextDestination?.workspace === 'tutorials') { setDestination(nextDestination); }
      `,
      lecturesTsx: `
        const intent = consumeLectureLibraryIntent();
        const restoredDestination = restoreStudyDestination('lectures');
        setDestination(restoredDestination);
        setStudyDestinationActiveTab('lectures', activeMode);
        if (intent.track) {
          pushStudyDestination('lectures', { kind: 'topic_overview', majorTopicId: matchingLecture.category || undefined });
        }
        if (nextDestination?.workspace === 'lectures') { setDestination(nextDestination); }
      `,
      algorithmsTsx: `
        setDestination(restoreStudyDestination('algorithms'));
        applyIntent(consumeAlgorithmNavigatorIntent());
        writeAlgorithmNavigatorState({ category: activeAlgorithmRoot, selectedId: selectedEntry?.id });
        if (intent.category) {
          pushStudyDestination('algorithms', {
            kind: intent.patternFamily ? 'subtopic_overview' : 'topic_overview',
            majorTopicId: intent.category,
            subtopicId: intent.patternFamily,
          });
        }
        if (nextDestination?.workspace === 'algorithms') { setDestination(nextDestination); }
      `,
      sidebarTsx: `
        readStudyDestination('lectures')
        pushStudyDestination('lectures', { kind: 'landing', previous: null })
        readStudyDestination('tutorials')
        pushStudyDestination('tutorials', { kind: 'landing', previous: null })
        readStudyDestination('algorithms')
        pushStudyDestination('algorithms', { kind: 'landing', previous: null })
      `,
      workspaceNavTsx: 'item.onActivate?.(); onSectionChange(item.section);',
      lectureNavigationTs: 'export interface LectureLibraryIntent { query?: string; }',
      tutorialNavigationTs: 'export interface TutorialLibraryIntent { query?: string; }',
      algorithmNavigationTs: 'export interface AlgorithmNavigatorIntent { query?: string; }',
    });

    expect(result.issues).toEqual([]);
    expect(result.passes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Lectures consumes its workspace-scoped routing intent.'),
        expect.stringContaining('Tutorials resolves query-routed intents into visible destination views.'),
        expect.stringContaining('Workups resolves routed intents into governed algorithm topic or subtopic views.'),
      ])
    );
  });

  it('flags workspace routing drift when query intents or workspace scoping go missing', () => {
    const result = evaluateWorkspaceRoutingSemantics({
      tutorialsTsx: `
        const restoredDestination = restoreStudyDestination('tutorials');
        setDestination(restoredDestination);
      `,
      lecturesTsx: `
        const intent = consumeLectureLibraryIntent();
        if (intent.track) { setActiveMode('overview'); }
      `,
      algorithmsTsx: `
        setDestination(restoreStudyDestination('algorithms'));
      `,
      sidebarTsx: `
        pushStudyDestination('lectures', { kind: 'landing', previous: null })
        pushStudyDestination('tutorials', { kind: 'landing', previous: null })
      `,
      workspaceNavTsx: 'onSectionChange(item.section);',
      lectureNavigationTs: 'export interface LectureLibraryIntent {}',
      tutorialNavigationTs: 'export interface TutorialLibraryIntent {}',
      algorithmNavigationTs: 'export interface AlgorithmNavigatorIntent {}',
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Tutorials does not consume its workspace-scoped routing intent.'),
        expect.stringContaining('Lectures does not restore its own study destination on load.'),
        expect.stringContaining('Tutorials does not clearly resolve query-routed intents into visible destination views.'),
        expect.stringContaining('Sidebar does not reset every didactics workspace to a fresh landing state before cross-workspace navigation.'),
        expect.stringContaining('Workspace switch clicks do not clearly activate routed workspace state before section selection changes.'),
      ])
    );
  });

  it('accepts refresh and back-forward semantics when routed destinations are preserved in history', () => {
    const result = evaluateRefreshAndHistorySemantics({
      studyDestinationStateTs: `
        const currentUrl = () => {
          return \`\${window.location.pathname}\${window.location.search}\${window.location.hash}\`;
        };
        export const readHistoryStudyDestination = (state, workspace) => {
          const candidate = state?.didacticsStudyDestination;
          if (workspace && candidate.workspace !== workspace) { return null; }
          return candidate;
        };
        export const replaceStudyDestination = (destination, options) => {
          const state = { ...(window.history.state || {}), didacticsStudyDestination: destination };
          window.history.replaceState(state, '', currentUrl());
          window.history.pushState(state, '', currentUrl());
        };
        export const restoreStudyDestination = (workspace) => {
          const fromHistory = readHistoryStudyDestination(window.history.state, workspace);
          if (fromHistory) { return fromHistory; }
          return readStudyDestination(workspace);
        };
      `,
      sectionNavTs: `
        if (browserStore.index <= 0 && !canGoBackWithinStudyWorkspace(currentSection)) { return; }
        window.history.back();
        window.history.forward();
      `,
      tutorialsTsx: `
        const handlePopState = (event: PopStateEvent) => {
          const nextDestination = event.state?.didacticsStudyDestination;
          if (nextDestination?.workspace === 'tutorials') {
            setDestination(nextDestination);
            setActiveTab(nextDestination.activeTab);
          }
        };
      `,
      lecturesTsx: `
        const handlePopState = (event: PopStateEvent) => {
          const nextDestination = event.state?.didacticsStudyDestination;
          if (nextDestination?.workspace === 'lectures') {
            setDestination(nextDestination);
            setActiveMode(nextDestination.activeTab as LecturePlayerMode);
          }
        };
      `,
      algorithmsTsx: `
        const handlePopState = (event: PopStateEvent) => {
          const nextDestination = event.state?.didacticsStudyDestination;
          if (nextDestination?.workspace === 'algorithms') {
            setDestination(nextDestination);
          }
        };
      `,
    });

    expect(result.issues).toEqual([]);
    expect(result.passes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('preserves pathname, query string, and hash'),
        expect.stringContaining('prefers browser history state before session fallback'),
        expect.stringContaining('Tutorials rehydrates only its own routed destination on browser popstate.'),
        expect.stringContaining('Back navigation stays enabled when a study workspace still has internal history'),
      ])
    );
  });

  it('flags refresh/history drift when query-preserving history restore signals disappear', () => {
    const result = evaluateRefreshAndHistorySemantics({
      studyDestinationStateTs: `
        const currentUrl = () => '/didactics/';
        export const restoreStudyDestination = (workspace) => readStudyDestination(workspace);
      `,
      sectionNavTs: `
        const goBack = () => {};
      `,
      tutorialsTsx: `
        const handlePopState = () => {};
      `,
      lecturesTsx: `
        const handlePopState = (event: PopStateEvent) => {
          const nextDestination = event.state?.didacticsStudyDestination;
          setDestination(nextDestination);
        };
      `,
      algorithmsTsx: `
        const handlePopState = () => {};
      `,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('does not clearly preserve pathname, query string, and hash'),
        expect.stringContaining('does not clearly write routed workspace state into browser history'),
        expect.stringContaining('does not clearly prefer browser history state before session fallback'),
        expect.stringContaining('Tutorials does not clearly rehydrate only its own routed destination on browser popstate.'),
        expect.stringContaining('Section navigation does not clearly delegate back and forward actions to browser history.'),
      ])
    );
  });

  it('accepts objective-first hierarchy when core framing and content appear before optional follow-up links', () => {
    const result = evaluateHierarchySemantics({
      tutorialsTsx: `
        <div>Major topic</div>
        <div>Scope: Blood Banking / Transfusion Medicine</div>
        <div>Next: open the first diagnostic focus</div>
        <button>Open Donor Evaluation</button>
        <div>Diagnostic focus</div>
        <div>Scope: Blood Banking / Transfusion Medicine > Donor Evaluation</div>
        <div>Next: open the first lesson</div>
        <button>Open Case Tutorial: Donor Eligibility and Screening</button>
        {activeTutorial && activeTab === 'tutorial' && <div>Diagnostic approach</div>}
        {tutorialObjectivesSection && <div>What to recognize</div>}
        {activeTutorial.interactiveAssets && <div>Related review</div>}
      `,
      lecturesTsx: `
        <div>Major topic</div>
        <div>Scope: Renal neoplasia</div>
        <div>Next: open the first review set</div>
        <button>Open Renal mass workup</button>
        <button>Back to lectures</button>
        <div>Faculty run sheet</div>
        <div>Signout sequence</div>
        <div>Lectures</div>
        <div>Scope: Renal mass evaluation · diagnostic approach</div>
        <div>Next: open the first lecture</div>
        <button>Open Renal Mass Evaluation</button>
      `,
      algorithmsTsx: `
        <div>Major topic</div>
        <div>Scope: QC failure response</div>
        <div>Next: open the first differential or workup</div>
        <button>Open QC failure response</button>
        <button>Back to workups</button>
        <div>Workups</div>
        <div>Scope: QC failure response</div>
        <div>Next: open the first workup</div>
        <button>Open QC Failure Response</button>
        <div>Diagnostic focus</div>
        <LectureAlgorithmPlayer />
        <div>Related review</div>
        <button>Open related tutorial</button>
      `,
      curriculumTsx: `
        {selectedModule.patternFamilies.length > 0 && <div>Common diagnostic patterns</div>}
        {selectedModule.cpGovernance && <div>Board-relevant focus</div>}
        {selectedModuleResolvedAlgorithms.length > 0 && <div>Initial workup</div>}
        {selectedModuleCompetency && <div>Diagnostic focus</div>}
      `,
    });

    expect(result.issues).toEqual([]);
    expect(result.passes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Tutorial detail keeps diagnostic framing'),
        expect.stringContaining('Tutorial topic overview exposes scope and a single obvious next action'),
        expect.stringContaining('Lecture topic overview exposes scope and a single obvious next action'),
        expect.stringContaining('Workup topic overview exposes scope and a single obvious next action'),
        expect.stringContaining('Tutorial subtopic overview exposes scope and a single obvious next action'),
        expect.stringContaining('Lecture subtopic overview exposes scope and a single obvious next action'),
        expect.stringContaining('Workup subtopic overview exposes scope and a single obvious next action'),
        expect.stringContaining('Algorithm detail places the workup before optional tutorial'),
        expect.stringContaining('Curriculum module pages present patterns, board focus, workup, and diagnostic focus'),
        expect.stringContaining('Lecture detail opens with an orientation block'),
      ])
    );
  });

  it('flags hierarchy drift when optional support appears before core content or objective framing disappears', () => {
    const result = evaluateHierarchySemantics({
      tutorialsTsx: `
        <button>Back to tutorials</button>
        <div>Major topic</div>
        <button>Back to topic</button>
        <div>Diagnostic focus</div>
        {activeTutorial.interactiveAssets && <div>Related review</div>}
        {activeTutorial && activeTab === 'tutorial' && <div>Diagnostic approach</div>}
        {tutorialObjectivesSection && <div>What to recognize</div>}
      `,
      lecturesTsx: `
        <div>Major topic</div>
        <button>Back to topic</button>
        <div>Signout sequence</div>
        <div>Faculty run sheet</div>
      `,
      algorithmsTsx: `
        <div>Major topic</div>
        <div>Start here</div>
        <button>Open related tutorial</button>
        <div>Diagnostic focus</div>
        <div>Related review</div>
        <LectureAlgorithmPlayer />
      `,
      curriculumTsx: `
        {selectedModuleResolvedAlgorithms.length > 0 && <div>Initial workup</div>}
        {selectedModule.patternFamilies.length > 0 && <div>Common diagnostic patterns</div>}
        {selectedModuleCompetency && <div>Diagnostic focus</div>}
      `,
    });

      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Tutorial topic overview does not clearly expose scope and a single obvious next action before the topic grid.'),
          expect.stringContaining('Lecture topic overview does not clearly expose scope and a single obvious next action before the review-set grid.'),
          expect.stringContaining('Workup topic overview does not clearly expose scope and a single obvious next action before the differential grid.'),
          expect.stringContaining('Tutorial subtopic overview does not clearly expose scope and a single obvious next action before the lesson list.'),
          expect.stringContaining('Lecture subtopic overview does not clearly expose scope and a single obvious next action before the lecture list.'),
          expect.stringContaining('Workup subtopic overview does not clearly expose scope and a single obvious next action before the workup list.'),
          expect.stringContaining('Algorithm detail does not clearly place the workup ahead of optional tutorial or review links.'),
          expect.stringContaining('Curriculum module pages do not clearly present patterns, board focus, workup, and diagnostic focus in a stable reasoning order.'),
          expect.stringContaining('Lecture detail does not clearly open with orientation before the signout sequence.'),
      ])
    );
  });

  it('accepts reference-boundary semantics when references open only from contextual study surfaces', () => {
    const result = evaluateReferenceBoundarySemantics({
      homeTsx: `
        <button onClick={() => openLectureLibrary()}>Open lectures</button>
        <button onClick={() => openTutorialLibrary(undefined, 'surgical-path')}>Case tutorials</button>
      `,
      mobileHeaderTsx: `
        handleNavClick(Section.PATHOLOGY_CURRICULUM)
        handleNavClick(Section.DIDACTIC_LECTURES)
        handleNavClick(Section.DIDACTIC_TUTORIALS)
        handleNavClick(Section.DIDACTIC_ALGORITHMS)
      `,
      sidebarTsx: `
        label="Study"
        label="Sign-Out"
      `,
      curriculumTsx: `
        setReferenceLibraryIntent({ moduleId: selectedModule.moduleId });
        onSectionChange(Section.REFERENCE_LIBRARY);
      `,
      lecturesTsx: `
        setReferenceLibraryIntent({ lectureId: selectedLecture.id });
        onSectionChange(Section.REFERENCE_LIBRARY);
      `,
      algorithmsTsx: `
        setReferenceLibraryIntent({ lectureId: selectedEntry?.lectureId });
        onSectionChange(Section.REFERENCE_LIBRARY);
      `,
    });

    expect(result.issues).toEqual([]);
    expect(result.passes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Learner-first navigation avoids direct Reference Library launches.'),
        expect.stringContaining('Reference Library remains reachable from curriculum, lecture, and workup context.'),
      ])
    );
  });

  it('flags reference-boundary drift when learner-first nav launches references directly or contextual routing disappears', () => {
    const result = evaluateReferenceBoundarySemantics({
      homeTsx: `
        <button onClick={() => onSectionChange(Section.REFERENCE_LIBRARY)}>Reference library</button>
      `,
      mobileHeaderTsx: `
        handleNavClick(Section.REFERENCE_LIBRARY)
      `,
      sidebarTsx: `
        <NavLink onClick={() => onSectionChange(Section.REFERENCE_LIBRARY)} />
      `,
      curriculumTsx: `
        setReferenceLibraryIntent({ moduleId: selectedModule.moduleId });
      `,
      lecturesTsx: `
        onSectionChange(Section.REFERENCE_LIBRARY);
      `,
      algorithmsTsx: `
        openTutorials();
      `,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Direct Reference Library launch still appears in learner-first navigation: Home, Sidebar.'),
        expect.stringContaining('Reference Library is missing contextual launch wiring from: Curriculum, Lectures, Workups.'),
      ])
    );
  });

  it('accepts reference-route semantics when the reference lane is query-routed and pathology-native', () => {
    const result = evaluateReferenceRouteSemantics({
      appTsx: `
        case Section.REFERENCE_LIBRARY: return <ReferenceLibrary user={user} />;
      `,
      sectionNavTs: `
        case Section.REFERENCE_LIBRARY:
          return 'reference';
        case 'reference':
          return Section.REFERENCE_LIBRARY;
        case Section.REFERENCE_LIBRARY: {
          const workspace = workspaceKeyForSection(section);
          return workspace ? \`\${basePath}/?workspace=\${workspace}\` : \`\${basePath}/\`;
        }
      `,
      referenceTsx: `
        <div>Diagnostic focus</div>
        <div>What to review</div>
        <div>What to show at sign-out</div>
        <div>Sign-out standards</div>
      `,
    });

    expect(result.issues).toEqual([]);
    expect(result.passes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Reference Library is rendered as a first-class didactics section in the app shell.'),
        expect.stringContaining('Reference Library has a route-backed workspace mapping through didactics navigation.'),
        expect.stringContaining('Reference Library copy avoids residual framework jargon on the public reference lane.'),
      ])
    );
  });

  it('flags reference-route drift when route wiring or public copy regresses into framework language', () => {
    const result = evaluateReferenceRouteSemantics({
      appTsx: `
        case Section.DIDACTIC_LECTURES: return <DidacticLectures />;
      `,
      sectionNavTs: `
        case Section.REFERENCE_LIBRARY:
          return 'reference';
      `,
      referenceTsx: `
        <div>Intent</div>
        <div>Mode</div>
        <div>Evidence</div>
        <div>Reference context for competency mapping</div>
      `,
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Reference Library is not clearly rendered as a first-class didactics section in the app shell.'),
        expect.stringContaining('Reference Library is missing a complete route-backed workspace mapping through didactics navigation.'),
      ])
    );
  });
});
