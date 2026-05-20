import { describe, expect, it } from 'vitest';
import {
  getImmunophenotypeBranch,
  getOperationalState,
  getPathologyCognition,
  getReasoningProgression,
  getUncertaintyState,
} from './pathologyCognition.ts';

describe('pathologyCognition', () => {
  it('classifies uncertainty states with plain-language labels', () => {
    expect(getUncertaintyState('Favored adenocarcinoma pattern').label).toBe('Favored pattern');
    expect(getUncertaintyState('Atypical basaloid proliferation').label).toBe('Suspicious pattern');
    expect(getUncertaintyState('Cannot exclude metastatic disease').label).toBe('Cannot exclude');
    expect(getUncertaintyState('Broad spindle cell differential with mimic set').label).toBe('Differential only');
    expect(getUncertaintyState('Granulomatous reaction pattern').label).toBe('Descriptive first');
  });

  it('classifies operational states deterministically', () => {
    expect(getOperationalState('Frozen section impression').label).toBe('Frozen pending permanent');
    expect(getOperationalState('KRAS mutation testing pending').label).toBe('Molecular pending');
    expect(getOperationalState('PAX8 and CK7 immunostains pending').label).toBe('Ancillary pending');
    expect(getOperationalState('Compare differential versus mimic').label).toBe('Differential open');
    expect(getOperationalState('QA discordance review').label).toBe('QA flagged');
  });

  it('returns immunophenotype branches for morphology families that need them', () => {
    expect(getImmunophenotypeBranch('Small round blue cell tumor')?.markers).toContain('NKX2.2');
    expect(getImmunophenotypeBranch('Clear cell renal neoplasm')?.markers).toContain('PAX8');
    expect(getImmunophenotypeBranch('Spindle cell lesion')?.markers).toContain('STAT6');
    expect(getImmunophenotypeBranch('Papillary lesion')?.markers).toContain('WT1');
    expect(getImmunophenotypeBranch('Basaloid neoplasm')?.markers).toContain('p40');
    expect(getImmunophenotypeBranch('Mucinous lesion')).toBeUndefined();
  });

  it('builds a five-step reasoning progression from morphology to wording', () => {
    const progression = getReasoningProgression('Small round blue cell tumor with CK7 immunostain pending');

    expect(progression.map((step) => step.key)).toEqual(['pattern', 'compartment', 'differential', 'ancillary', 'wording']);
    expect(progression[0]?.guidance).toContain('small round blue cell pattern');
    expect(progression[3]?.guidance).toContain('lineage-defining immunophenotype');
  });

  it('bundles cognition helpers into one reusable payload', () => {
    const cognition = getPathologyCognition(
      'Spindle cell neoplasm',
      'Broad differential with mimics',
      'STAT6 and keratin stains pending',
    );

    expect(cognition.uncertaintyState.label).toBe('Differential only');
    expect(cognition.operationalState.label).toBe('Ancillary pending');
    expect(cognition.immunophenotypeBranch?.markers).toContain('MUC4');
    expect(cognition.reasoningProgression).toHaveLength(5);
  });
});
