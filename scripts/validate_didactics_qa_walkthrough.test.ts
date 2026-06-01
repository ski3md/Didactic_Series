import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  buildWalkthrough,
  inspectAdminCard,
  scanForbiddenPublicLabels,
} = require('./generate_didactics_qa_walkthrough.cjs') as {
  buildWalkthrough: () => {
    routeCoverage: Array<{
      key: string;
      route: string;
      publicLabel: string;
      appSwitchPresent: boolean;
      existingValidatorSignal: boolean;
    }>;
    publicLabelRisk: {
      riskLevel: string;
      forbiddenPublicLabelHits: Array<{ phrase: string; hits: string[] }>;
    };
    imageMediaRisk: {
      riskLevel: string;
      supplementalReferenceImages: number;
      signoutImages: number;
      riskSummary: string;
    };
    adminCardRisk: {
      riskLevel: string;
      routeGuardedForAdmins: boolean;
      lazyAdminView: boolean;
      importsSummaryOnly: boolean;
      fullQueueImportDetected: boolean;
      noPromotionControlsCopyPresent: boolean;
      queueEntriesSummarized: number;
      unreviewedQueueEntries: number;
      riskSummary: string;
    };
    topNextCorrections: Array<{ priority: string; area: string; correction: string }>;
    validationBasis: { notClaimed: string[] };
  };
  inspectAdminCard: () => {
    riskLevel: string;
    routeGuardedForAdmins: boolean;
    lazyAdminView: boolean;
    importsSummaryOnly: boolean;
    fullQueueImportDetected: boolean;
    noPromotionControlsCopyPresent: boolean;
  };
  scanForbiddenPublicLabels: (surfaceTexts: Array<{ surface: string; text: string }>) => Array<{ phrase: string; hits: string[] }>;
};

describe('didactics QA walkthrough', () => {
  it('covers the required reviewer QA surfaces without claiming browser proof', () => {
    const report = buildWalkthrough();

    expect(report.routeCoverage.map((route) => route.key)).toEqual(
      expect.arrayContaining(['curriculum', 'tutorials', 'workups', 'reference'])
    );
    expect(report.routeCoverage.every((route) => route.appSwitchPresent)).toBe(true);
    expect(report.routeCoverage.every((route) => route.existingValidatorSignal)).toBe(true);

    expect(report.publicLabelRisk.riskLevel).toMatch(/low|review/);
    expect(report.imageMediaRisk.supplementalReferenceImages).toBeGreaterThan(0);
    expect(report.imageMediaRisk.signoutImages).toBeGreaterThan(0);

    expect(report.adminCardRisk.routeGuardedForAdmins).toBe(true);
    expect(report.adminCardRisk.lazyAdminView).toBe(true);
    expect(report.adminCardRisk.importsSummaryOnly).toBe(true);
    expect(report.adminCardRisk.fullQueueImportDetected).toBe(false);
    expect(report.adminCardRisk.noPromotionControlsCopyPresent).toBe(true);
    expect(report.adminCardRisk.queueEntriesSummarized).toBeGreaterThan(0);
    expect(report.adminCardRisk.unreviewedQueueEntries).toBe(report.adminCardRisk.queueEntriesSummarized);

    expect(report.topNextCorrections.map((item) => item.area)).toEqual(
      expect.arrayContaining(['browser proof', 'image/media', 'ABPath admin', 'public labels'])
    );
    expect(report.validationBasis.notClaimed).toContain('No browser-rendered PASS claimed by this generator.');
  });

  it('flags public-label drift and admin full-queue import regressions in focused helper checks', () => {
    expect(
      scanForbiddenPublicLabels([
        {
          surface: 'sample',
          text: 'Open Didactic Algorithms before routing-system review.',
        },
      ])
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ phrase: 'Didactic Algorithms', hits: ['sample'] }),
        expect.objectContaining({ phrase: 'routing-system', hits: ['sample'] }),
      ])
    );

    const admin = inspectAdminCard();
    expect(admin.fullQueueImportDetected).toBe(false);
  });
});
