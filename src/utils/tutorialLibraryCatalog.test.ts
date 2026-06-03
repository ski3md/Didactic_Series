import { describe, expect, it } from 'vitest';
import {
  findBestTutorialMatch,
  getTutorialMappedImageSupport,
  toAbpathScopeFromManifestRow,
  validateDidacticGovernanceManifest,
} from './tutorialLibraryCatalog.ts';
import type { DidacticTutorialRecord } from './tutorialLibraryCatalog.ts';
import type { ValidatedMappingManifestRow, ValidatedMappingsManifest } from '../types.ts';

const buildMiniTutorial = (overrides: Partial<DidacticTutorialRecord>): DidacticTutorialRecord => ({
  id: 'tutorial',
  title: 'Base tutorial',
  summary: 'Summary text',
  body: 'Detailed body content',
  lane: 'mixed',
  laneLabel: 'Tutorial Library',
  track: 'surgical-path',
  trackLabel: 'Surgical Pathology',
  promotionState: 'canonical',
  promotionLabel: 'Canonical',
  sourceRepo: 'board_prep',
  sourceLabel: 'Board Prep Library',
  topicChips: [],
  tags: [],
  mcqCount: 0,
  flashcardCount: 0,
  mcqs: [],
  flashcards: [],
  ...overrides,
});

describe('toAbpathScopeFromManifestRow', () => {
  it('derives CP scope from the validated manifest row instead of raw crosswalk text', () => {
    const row: ValidatedMappingManifestRow = {
      id: 'topic-mol-1',
      title: 'Case Tutorial: Molecular Techniques (PCR, FISH, NGS)',
      file: 'src/content/downloads_imports/normalized/tutorials.normalized.json',
      track: 'clinical-path',
      sourceType: 'cp-governance',
      abpathDomain: 'CP',
      sourceAnchorExists: true,
      validatedForPromotion: true,
      governancePending: false,
      promotionStatus: 'validated',
      abpathRoot: 'Hematopathology for Clinical Pathology',
      abpathPrimaryPath: 'Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Molecular Testing',
      abpathSpecVersion: 'CP_2026_04_10',
      abpathPrecisionMode: 'nearest-valid-deep',
      abpathAnchorConfidence: 'moderate',
      abpathReviewStatus: 'confirmed',
      abpathExamRisk: 'high-yield',
      abpathTestableTask: ['recognize', 'interpret', 'select-next-test', 'troubleshoot'],
      nearestValidReason: 'workflow concept distributed across multiple spec nodes',
      reviewOwner: 'CP governance review',
      reviewAction: 'Keep molecular methods teaching subordinate to the validated CP testing anchor.',
      conflictFlags: ['molecular-remap-reviewed'],
    };

    const scope = toAbpathScopeFromManifestRow(row);

    expect(scope).toEqual({
      domain: 'CP',
      root: 'Hematopathology for Clinical Pathology',
      primaryPath: 'Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Molecular Testing',
      title: 'Molecular Testing',
      confidence: 'medium',
      source: 'ABPath Clinical Pathology Content Specifications CP/2026/04/10',
      sourceLine: null,
    });
  });

  it('keeps Lung Primary rows from leaking under the Breast public topic', () => {
    const row: ValidatedMappingManifestRow = {
      id: 'ap-lung-primary',
      title: 'AP: Lung Primary',
      file: 'src/content/tutorials/tutorials.normalized.json',
      track: 'surgical-path',
      sourceType: 'crosswalk',
      abpathDomain: 'AP',
      sourceAnchorExists: true,
      validatedForPromotion: true,
      governancePending: false,
      promotionStatus: 'validated',
      canonicalForId: true,
      canonicalSourceKey: 'src/content/tutorials/tutorials.normalized.json::ap-lung-primary',
      abpathRoot: 'Breast',
      abpathPrimaryPath: 'Breast > Lung Primary > Carcinoma',
      conflictFlags: [],
    };

    const scope = toAbpathScopeFromManifestRow(row);

    expect(scope?.root).toBe('Lung Primary');
    expect(scope?.primaryPath).toBe('Breast > Lung Primary > Carcinoma');
  });
});

describe('validateDidacticGovernanceManifest', () => {
  it('accepts a manifest whose summary and routing sets are row-derived', () => {
    const row: ValidatedMappingManifestRow = {
      key: 'src/content/tutorials/clinicalPathInteractiveTutorials.json::cp-dat-transfusion-studio',
      id: 'cp-dat-transfusion-studio',
      title: 'DAT and Hemolytic Transfusion Reaction Studio',
      file: 'src/content/tutorials/clinicalPathInteractiveTutorials.json',
      track: 'clinical-path',
      sourceType: 'interactive-cp',
      abpathDomain: 'CP',
      sourceAnchorExists: true,
      validatedForPromotion: true,
      governancePending: false,
      promotionStatus: 'validated',
      canonicalForId: true,
      canonicalSourceKey: 'src/content/tutorials/clinicalPathInteractiveTutorials.json::cp-dat-transfusion-studio',
      abpathRoot: 'Transfusion Medicine for Clinical Pathology',
      abpathPrimaryPath:
        'Transfusion Medicine for Clinical Pathology > Adverse Effects of Transfusion > Hemolytic Transfusion Reactions',
      abpathSpecVersion: 'CP_2026_04_10',
      abpathPrecisionMode: 'literal',
      abpathAnchorConfidence: 'high',
      abpathReviewStatus: 'confirmed',
      abpathExamRisk: 'high-yield',
      abpathTestableTask: ['recognize', 'interpret', 'manage-critical-result'],
      reviewOwner: 'CP governance review',
      reviewAction: 'Promote under transfusion-medicine governance.',
      conflictFlags: [],
    };

    const manifest: ValidatedMappingsManifest = {
      generatedAt: '2026-05-18T00:00:00.000Z',
      sourceFingerprint: 'abc123',
      source: {
        crosswalk: 'src/content/tutorials/tutorialAbpathSpecCrosswalk.json',
        cpGovernanceReport: 'reports/cp_precision_governance_report.json',
        cpModules: 'src/content/clinical_pathology/cpGovernanceModules.json',
        cpInteractiveTutorials: 'src/content/tutorials/clinicalPathInteractiveTutorials.json',
        tutorialLabelValidation: 'reports/tutorial_label_validation.json',
      },
      summary: {
        totalRows: 1,
        canonicalRowCount: 1,
        validatedRowCount: 1,
        governancePendingRowCount: 0,
        excludedRowCount: 0,
        clinicalPathValidatedCount: 1,
        cpDomainValidatedCount: 1,
      },
      tutorialKeysValidated: [row.key],
      tutorialIdsValidated: [row.id],
      blockedTutorialKeys: [],
      blockedTutorialIds: [],
      rows: [row],
    };

    expect(validateDidacticGovernanceManifest(manifest)).toBe(manifest);
  });

  it('throws when the manifest key lists drift away from canonical rows', () => {
    const row: ValidatedMappingManifestRow = {
      key: 'src/content/tutorials/tutorials.normalized.json::ap-breast',
      id: 'ap-breast',
      title: 'AP: Breast Pathology',
      file: 'src/content/tutorials/tutorials.normalized.json',
      track: 'surgical-path',
      sourceType: 'crosswalk',
      abpathDomain: 'AP',
      sourceAnchorExists: true,
      validatedForPromotion: true,
      governancePending: false,
      promotionStatus: 'validated',
      canonicalForId: true,
      canonicalSourceKey: 'src/content/tutorials/tutorials.normalized.json::ap-breast',
      abpathRoot: 'Breast Topics for Anatomic Pathology Residents',
      abpathPrimaryPath: 'Breast Topics for Anatomic Pathology Residents > Benign Breast',
      conflictFlags: [],
    };

    const manifest: ValidatedMappingsManifest = {
      generatedAt: '2026-05-18T00:00:00.000Z',
      sourceFingerprint: 'abc123',
      summary: {
        totalRows: 1,
        canonicalRowCount: 1,
        validatedRowCount: 1,
        governancePendingRowCount: 0,
        excludedRowCount: 0,
        clinicalPathValidatedCount: 0,
        cpDomainValidatedCount: 0,
      },
      tutorialKeysValidated: ['src/content/tutorials/tutorials.normalized.json::wrong-key'],
      tutorialIdsValidated: [row.id],
      blockedTutorialKeys: [],
      blockedTutorialIds: [],
      rows: [row],
    };

    expect(() => validateDidacticGovernanceManifest(manifest)).toThrow(/manifest drift detected/i);
  });
});

describe('getTutorialMappedImageSupport', () => {
  it('returns existing curriculum-mapped image support for surgical pathology tutorials', () => {
    const support = getTutorialMappedImageSupport('ap-soft-tissue-bone');

    expect(support).toBeDefined();
    expect(support?.moduleTitles).toContain('Spindle Cell Differential');
    expect((support?.images.length ?? 0) > 0).toBe(true);
    expect(support?.images[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      src: expect.any(String),
    });
  });

  it('matches query terms inside a constrained track selection', () => {
    const clinicalTutorial = buildMiniTutorial({
      id: 'clinical-niftp',
      title: 'NIFTP interpretation review',
      summary: 'clinical pathology example',
      track: 'clinical-path',
      trackLabel: 'Clinical Pathology',
      lane: 'lab-studio',
      laneLabel: 'Clinical Pathology',
    });
    const surgicalTutorial = buildMiniTutorial({
      id: 'surgical-niftp',
      title: 'NIFTP interpretation review',
      summary: 'surgical pathology example',
      track: 'surgical-path',
      trackLabel: 'Surgical Pathology',
      lane: 'core-patterns',
      laneLabel: 'Core Pattern Tutorials',
    });

    const match = findBestTutorialMatch([surgicalTutorial, clinicalTutorial], ['NIFTP'], {
      track: 'clinical-path',
    });

    expect(match?.id).toBe('clinical-niftp');
  });

  it('fails closed instead of linking an unrelated first tutorial when no query terms match', () => {
    const firstTutorial = buildMiniTutorial({
      id: 'first-tutorial',
      title: 'Papillary thyroid carcinoma review',
      summary: 'Thyroid surgical pathology teaching.',
    });
    const secondTutorial = buildMiniTutorial({
      id: 'second-tutorial',
      title: 'Direct antiglobulin test studio',
      summary: 'Transfusion medicine teaching.',
      track: 'clinical-path',
      trackLabel: 'Clinical Pathology',
    });

    const match = findBestTutorialMatch([firstTutorial, secondTutorial], ['renal transplant flow cytometry']);

    expect(match).toBeUndefined();
  });

  it('can resolve a related tutorial from a later query term when the first term is broad', () => {
    const thyroidTutorial = buildMiniTutorial({
      id: 'thyroid-review',
      title: 'Papillary thyroid carcinoma review',
      summary: 'Thyroid surgical pathology teaching.',
    });
    const datTutorial = buildMiniTutorial({
      id: 'dat-studio',
      title: 'DAT and Hemolytic Transfusion Reaction Studio',
      summary: 'Transfusion medicine teaching.',
      track: 'clinical-path',
      trackLabel: 'Clinical Pathology',
    });

    const match = findBestTutorialMatch([thyroidTutorial, datTutorial], ['bench workflow', 'DAT and Hemolytic Transfusion Reaction Studio'], {
      track: 'clinical-path',
    });

    expect(match?.id).toBe('dat-studio');
  });
});
