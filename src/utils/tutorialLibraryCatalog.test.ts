import { describe, expect, it } from 'vitest';
import { toAbpathScopeFromManifestRow, validateDidacticGovernanceManifest } from './tutorialLibraryCatalog.ts';
import type { ValidatedMappingManifestRow, ValidatedMappingsManifest } from '../types.ts';

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
