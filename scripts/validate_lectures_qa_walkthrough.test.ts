import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const reportPath = path.join(repoRoot, 'reports/lectures_qa_walkthrough.json');
const markdownPath = path.join(repoRoot, 'reports/lectures_qa_walkthrough.md');
const contractPath = path.join(repoRoot, 'src/content/lectures/lectureAbpathContracts.json');
const curatedPath = path.join(repoRoot, 'src/content/lectures/lectures.normalized.json');
const guWhoPath = path.join(repoRoot, 'src/content/lectures/gu_who_complete_lectures.normalized.json');
const downloadsPath = path.join(repoRoot, 'src/content/downloads_imports/normalized/lectures.normalized.json');
const customPath = path.join(repoRoot, 'src/content/lectures/customLectures.ts');

interface LectureQaReport {
  version: string;
  lectureCounts: {
    promotedTotal: number;
    bySource: {
      curatedNormalized: number;
      customLocal: number;
      guWhoComplete: number;
      corePrinciplesImport: number;
    };
    rawContentGaps: {
      lecturesWithNoRawObjectives: number;
      lecturesWithNoRawSlides: number;
      lecturesWithNoRawQuestions: number;
    };
  };
  abpathCoverage: {
    contractLectures: number;
    promotedLectureCount: number;
    lecturesWithContracts: number;
    lecturesMeetingTabContract: number;
    lecturesMeetingAnchorMinimum: number;
    warningCount: number;
    warnings: Array<{ lectureId: string; warnings: string[] }>;
    promotedLecturesWithoutContract: string[];
    contractsWithoutPromotedLecture: string[];
  };
  navigationSignals: {
    positiveSignals: string[];
    missingSignals: string[];
    currentUxReportFailures: string[];
  };
  brokenMissingRisks: Array<{ category: string; affectedLectures?: string[] }>;
  learnerWordingRoutingRisks: Array<{ category: string; signal: string }>;
  topNextCorrections: Array<{ priority: number; action: string }>;
  reviewBoundary: { allowedWriteScope: string[]; guardrails: string[] };
}

const readJson = <T>(filePath: string): T => JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;

const customLectureCount = () => {
  const source = fs.readFileSync(customPath, 'utf8');
  return (source.match(/\n\s*\{\n\s*id:\s*'[^']+'/g) || []).length;
};

describe('lectures QA walkthrough report', () => {
  const report = readJson<LectureQaReport>(reportPath);
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  const contracts = readJson<{ lectures: unknown[] }>(contractPath);
  const curated = readJson<unknown[]>(curatedPath);
  const guWho = readJson<unknown[]>(guWhoPath);
  const corePrinciples = readJson<Array<{ sourceRepo?: string }>>(downloadsPath).filter(
    (lecture) => lecture.sourceRepo === 'ioc-next-app',
  );

  it('summarizes the current promoted lecture corpus and ABPath contract coverage', () => {
    const expectedTotal = curated.length + customLectureCount() + guWho.length + corePrinciples.length;

    expect(report.version).toBe('lectures-qa-walkthrough.v1');
    expect(report.lectureCounts.promotedTotal).toBe(expectedTotal);
    expect(report.lectureCounts.bySource).toEqual({
      curatedNormalized: curated.length,
      customLocal: customLectureCount(),
      guWhoComplete: guWho.length,
      corePrinciplesImport: corePrinciples.length,
    });
    expect(report.abpathCoverage.contractLectures).toBe(contracts.lectures.length);
    expect(report.abpathCoverage.promotedLectureCount).toBe(expectedTotal);
    expect(report.abpathCoverage.lecturesWithContracts).toBe(expectedTotal);
    expect(report.abpathCoverage.promotedLecturesWithoutContract).toEqual([]);
    expect(report.abpathCoverage.contractsWithoutPromotedLecture).toEqual([]);
    expect(report.abpathCoverage.lecturesMeetingTabContract).toBe(contracts.lectures.length);
    expect(report.abpathCoverage.lecturesMeetingAnchorMinimum).toBe(contracts.lectures.length);
  });

  it('keeps reviewer risks explicit without treating augmentation scaffolds as reviewed teaching truth', () => {
    expect(report.lectureCounts.rawContentGaps.lecturesWithNoRawSlides).toBeGreaterThan(0);
    expect(report.lectureCounts.rawContentGaps.lecturesWithNoRawObjectives).toBeGreaterThan(0);
    expect(report.brokenMissingRisks.map((risk) => risk.category)).toEqual(
      expect.arrayContaining([
        'fallback-scaffold-dependence',
        'objective-source-gap',
        'retrieval-practice-source-gap',
        'contract-warning',
      ]),
    );
    expect(report.abpathCoverage.warningCount).toBe(3);
    expect(report.abpathCoverage.warnings.map((warning) => warning.lectureId)).toEqual(
      expect.arrayContaining([
        'renal_mass_eval',
        'ioc-overview-gynecologic-oncology',
        'ioc-overview-urologic-oncology',
      ]),
    );
    expect(report.reviewBoundary.guardrails.join(' ')).toContain('does not mutate runtime components');
    expect(report.reviewBoundary.guardrails.join(' ')).toContain('not automatically promoted teaching truth');
  });

  it('captures navigation and learner-wording route risks in reviewer-readable outputs', () => {
    expect(report.navigationSignals.missingSignals).toEqual([]);
    expect(report.navigationSignals.positiveSignals).toEqual(
      expect.arrayContaining([
        'lecture selection writes study destination',
        'lecture workspace consumes query/session intent',
        'landing copy exposes Current review and Next action',
      ]),
    );
    expect(report.navigationSignals.currentUxReportFailures).toEqual([]);
    expect(report.learnerWordingRoutingRisks.map((risk) => risk.category)).toEqual(
      expect.arrayContaining([
        'learner-contract-wording-risk',
        'routing-label-scope-risk',
        'taxonomy-contract-risk',
      ]),
    );
    expect(report.topNextCorrections[0]?.action).toContain('ABPath contract warnings');
    expect(markdown).toContain('# Lectures QA Walkthrough');
    expect(markdown).toContain('## ABPath Contract Coverage');
    expect(markdown).toContain('## Top Next Corrections');
  });
});
