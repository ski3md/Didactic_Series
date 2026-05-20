import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const cpGovernanceReport = require('../reports/cp_precision_governance_report.json') as {
  tutorialCount: number;
  moduleCount: number;
  failureCount: number;
  baselineSnapshot?: Record<string, unknown>;
};
const validatedManifest = require('../reports/validated_mappings_manifest.json') as {
  summary: {
    validatedRowCount: number;
    governancePendingRowCount: number;
  };
  baselineSnapshot?: Record<string, unknown>;
};

describe('cp truth baseline outputs', () => {
  it('keeps a compact governance baseline snapshot', () => {
    expect(cpGovernanceReport.baselineSnapshot).toBeTruthy();
    expect(cpGovernanceReport.baselineSnapshot?.tutorialsValidated).toBe(cpGovernanceReport.tutorialCount);
    expect(cpGovernanceReport.baselineSnapshot?.modulesValidated).toBe(cpGovernanceReport.moduleCount);
    expect(cpGovernanceReport.baselineSnapshot?.failureCount).toBe(cpGovernanceReport.failureCount);
    expect(cpGovernanceReport.baselineSnapshot?.precisionModes).toBeTruthy();
    expect(cpGovernanceReport.baselineSnapshot?.officialRoots).toBeTruthy();
  });

  it('keeps a compact validated-manifest baseline snapshot', () => {
    expect(validatedManifest.baselineSnapshot).toBeTruthy();
    expect(validatedManifest.baselineSnapshot?.validatedTutorialCount).toBe(
      validatedManifest.summary.validatedRowCount,
    );
    expect(validatedManifest.baselineSnapshot?.governancePendingTutorialCount).toBe(
      validatedManifest.summary.governancePendingRowCount,
    );
    expect(validatedManifest.baselineSnapshot?.sourceFingerprint).toBeTruthy();
  });
});
