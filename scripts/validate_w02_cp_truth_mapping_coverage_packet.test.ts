import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/w02_cp_truth_mapping_coverage_packet.json') as {
  tranche: string;
  coverage: {
    cpDomainValidatedRows: number;
    cpGovernedRows: number;
    cpCrosswalkRows: number;
    cpRootCount: number;
    roots: Record<string, number>;
    sourceTypes: Record<string, number>;
  };
  reviewability: {
    missingReviewOwnerCount: number;
    unmappedValidatedCpCount: number;
    duplicateShadowCount: number;
  };
  driftRisks: {
    governedExceptionCount: number;
    crosswalkRowsWithoutExplicitReviewStatus: number;
  };
  completionGate: {
    targetedMappingCoverageGreen: boolean;
    staleWhen: string[];
  };
};

describe('W02 CP truth mapping coverage packet', () => {
  it('freezes targeted CP mapping coverage across reviewed roots and source types', () => {
    expect(packet.tranche).toBe('T06 W02 CP Truth');
    expect(packet.coverage.cpDomainValidatedRows).toBe(285);
    expect(packet.coverage.cpGovernedRows).toBe(23);
    expect(packet.coverage.cpCrosswalkRows).toBe(262);
    expect(packet.coverage.cpRootCount).toBe(6);
    expect(packet.coverage.roots).toMatchObject({
      'Blood Banking/Transfusion Medicine': 123,
      'Chemical Pathology': 63,
      'Hematopathology for Clinical Pathology': 39,
      'Management and Informatics': 16,
      'Medical Microbiology': 43,
      'Chemical Pathology + Blood Banking/Transfusion Medicine': 1,
    });
    expect(packet.coverage.sourceTypes).toEqual({
      crosswalk: 262,
      'cp-governance': 10,
      'interactive-cp': 13,
    });
  });

  it('keeps the reviewed CP truth set reviewable and drift-bounded', () => {
    expect(packet.reviewability.missingReviewOwnerCount).toBe(0);
    expect(packet.reviewability.unmappedValidatedCpCount).toBe(0);
    expect(packet.reviewability.duplicateShadowCount).toBe(6);
    expect(packet.driftRisks.governedExceptionCount).toBe(13);
    expect(packet.driftRisks.crosswalkRowsWithoutExplicitReviewStatus).toBe(262);
    expect(packet.completionGate.targetedMappingCoverageGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
