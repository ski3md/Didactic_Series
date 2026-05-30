import { describe, expect, it } from 'vitest';
import rawAlgorithms from '../content/algorithms/algorithms.raw.json';
import normalizedAlgorithms from '../content/algorithms/algorithms.normalized.json';
import { didacticAlgorithms, resolveDidacticAlgorithmIntent, resolveDidacticAlgorithmRoutes } from './algorithmCatalog.ts';
import { buildAlgorithmStudyTree } from './studyCatalogScopes.ts';

describe('algorithm catalog Clinical Pathology surfacing', () => {
  it('assigns management and informatics algorithms to focused pattern families', () => {
    const cpMiEntries = didacticAlgorithms.filter((entry) => entry.subspecialtyLabel === 'Clinical Pathology');
    const patternFamilies = Object.fromEntries(cpMiEntries.map((entry) => [entry.id, entry.patternFamily]));

    expect(patternFamilies['cp-mi-qc-failure-response']).toBe('QC Failure Response');
    expect(patternFamilies['cp-mi-validation-verification-triage']).toBe('Validation vs Verification');
    expect(patternFamilies['cp-mi-lis-workflow-redesign']).toBe('LIS and Workflow Safety');
    expect(patternFamilies['cp-mi-finance-aware-assay-planning']).toBe('Assay Planning and Finance');
  });

  it('builds four distinct Clinical Pathology algorithm subtopics for the MI first-wave routes', () => {
    const tree = buildAlgorithmStudyTree(didacticAlgorithms);
    const cpSubtopics = tree.subtopicsByRoot['Clinical Pathology'] ?? [];

    expect(cpSubtopics.map((scope) => scope.label)).toEqual([
      'Anemia and Red Cell Triage',
      'Assay Planning and Finance',
      'AST Interpretation and Stewardship',
      'Bleeding and Coagulation Triage',
      'LIS and Workflow Safety',
      'Microbiology Specimen Quality',
      'Organism Identification Workflow',
      'QC Failure Response',
      'Specimen and Result Workflow',
      'Transfusion Compatibility and Crossmatch',
      'Transfusion Reaction Triage',
      'Validation vs Verification',
    ]);
  });

  it('resolves management and informatics curriculum topics to direct algorithm intents', () => {
    expect(resolveDidacticAlgorithmIntent('QC failure response', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-mi-qc-failure-response',
      category: 'Clinical Pathology',
      patternFamily: 'QC Failure Response',
    });

    expect(resolveDidacticAlgorithmIntent('LIS workflow redesign', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-mi-lis-workflow-redesign',
      category: 'Clinical Pathology',
      patternFamily: 'LIS and Workflow Safety',
    });
  });

  it('resolves new CP foundations algorithm topics to direct algorithm intents', () => {
    expect(resolveDidacticAlgorithmIntent('anemia workup', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-foundations-anemia-workup',
      category: 'Clinical Pathology',
      patternFamily: 'Anemia and Red Cell Triage',
    });

    expect(resolveDidacticAlgorithmIntent('hemolysis triage', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-foundations-anemia-workup',
      category: 'Clinical Pathology',
      patternFamily: 'Anemia and Red Cell Triage',
    });

    expect(resolveDidacticAlgorithmIntent('coagulation test interpretation', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-foundations-bleeding-diatathesis-triage',
      category: 'Clinical Pathology',
      patternFamily: 'Bleeding and Coagulation Triage',
    });

    expect(resolveDidacticAlgorithmIntent('specimen quality triage', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-micro-specimen-quality-triage',
      category: 'Clinical Pathology',
      patternFamily: 'Microbiology Specimen Quality',
    });

    expect(resolveDidacticAlgorithmIntent('AST interpretation', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-micro-ast-interpretation',
      category: 'Clinical Pathology',
      patternFamily: 'AST Interpretation and Stewardship',
    });

    expect(resolveDidacticAlgorithmIntent('organism identification workflow', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-micro-organism-identification-workflow',
      category: 'Clinical Pathology',
      patternFamily: 'Organism Identification Workflow',
    });
  });

  it('resolves transfusion curriculum topics to direct algorithm intents', () => {
    expect(resolveDidacticAlgorithmIntent('transfusion reaction triage', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-transfusion-reaction-triage',
      category: 'Clinical Pathology',
      patternFamily: 'Transfusion Reaction Triage',
    });

    expect(resolveDidacticAlgorithmIntent('crossmatch workup', 'Clinical Pathology')).toMatchObject({
      selectedId: 'cp-transfusion-crossmatch-workup',
      category: 'Clinical Pathology',
      patternFamily: 'Transfusion Compatibility and Crossmatch',
    });
  });

  it('returns only implemented algorithm routes when a module mixes live and buildout topics', () => {
    const routes = resolveDidacticAlgorithmRoutes(
      ['anemia workup', 'validation-versus-verification triage', 'not yet implemented topic'],
      'Clinical Pathology'
    );

    expect(routes).toHaveLength(2);
    expect(routes.map((route) => route.requestedTopic)).toEqual([
      'anemia workup',
      'validation-versus-verification triage',
    ]);
  });

  it('resolves every W02 Clinical Pathology route family through representative bench-facing aliases', () => {
    const routeMatrix = [
      ['qc troubleshooting', 'cp-mi-qc-failure-response', 'QC Failure Response'],
      ['verification pathway', 'cp-mi-validation-verification-triage', 'Validation vs Verification'],
      ['lab information system workflow', 'cp-mi-lis-workflow-redesign', 'LIS and Workflow Safety'],
      ['reagent rental', 'cp-mi-finance-aware-assay-planning', 'Assay Planning and Finance'],
      ['red cell triage', 'cp-foundations-anemia-workup', 'Anemia and Red Cell Triage'],
      ['hemostasis triage', 'cp-foundations-bleeding-diatathesis-triage', 'Bleeding and Coagulation Triage'],
      ['bench selection workflow', 'cp-foundations-specimen-to-result-workflow', 'Specimen and Result Workflow'],
      ['hemolytic transfusion reaction', 'cp-transfusion-reaction-triage', 'Transfusion Reaction Triage'],
      ['compatibility workup', 'cp-transfusion-crossmatch-workup', 'Transfusion Compatibility and Crossmatch'],
      ['gram stain specimen triage', 'cp-micro-specimen-quality-triage', 'Microbiology Specimen Quality'],
      ['ast stewardship', 'cp-micro-ast-interpretation', 'AST Interpretation and Stewardship'],
      ['maldi tof workflow', 'cp-micro-organism-identification-workflow', 'Organism Identification Workflow'],
    ] as const;

    routeMatrix.forEach(([query, selectedId, patternFamily]) => {
      expect(resolveDidacticAlgorithmIntent(query, 'Clinical Pathology')).toMatchObject({
        selectedId,
        category: 'Clinical Pathology',
        patternFamily,
      });
    });
  });

  it('does not heuristically misroute unimplemented Clinical Pathology topics', () => {
    expect(resolveDidacticAlgorithmIntent('critical chemistry result triage', 'Clinical Pathology')).toBeNull();
    expect(resolveDidacticAlgorithmIntent('endocrine-metabolic interpretation', 'Clinical Pathology')).toBeNull();
    expect(resolveDidacticAlgorithmIntent('QC and method issue triage', 'Clinical Pathology')).toBeNull();
  });

  it('keeps raw and normalized algorithm artifacts coupled for route aliases', () => {
    const rawProjection = rawAlgorithms.map((entry) => ({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      summary: entry.summary,
      routeAliases: entry.routeAliases ?? [],
    }));
    const normalizedProjection = normalizedAlgorithms.map((entry) => ({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      summary: entry.summary,
      routeAliases: entry.routeAliases ?? [],
    }));

    expect(normalizedProjection).toEqual(rawProjection);
  });
});
