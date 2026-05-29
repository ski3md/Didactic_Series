import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const readText = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readJson = <T>(relativePath: string): T => JSON.parse(readText(relativePath)) as T;

type ValidatedManifest = {
  rows: Array<{
    id: string;
    key: string;
    track: string;
    abpathDomain: string;
    abpathPrimaryPath: string;
    validatedForPromotion: boolean;
    canonicalForId: boolean;
    canonicalSourceKey: string;
    reviewOwner?: string;
    reviewAction?: string;
    conflictFlags?: string[];
  }>;
};

type DuplicateShadowPacket = {
  summary: {
    duplicateShadowCount: number;
    sourceMapReviewCount: number;
  };
  duplicatePairs: Array<{
    id: string;
    shadowTrack: string;
    canonicalTrack: string;
    shadowDomain: string;
    canonicalDomain: string;
    shadowPath: string;
    canonicalPath: string;
    requiresSourceMapReview: boolean;
  }>;
};

const expectedDuplicateIds = [
  'blood-banking-transfusion-medicine',
  'clinical-practice',
  'paroxysmal-nocturnal-hemoglobinuria',
  'anemia-in-oncology-patients',
  'cell-and-tissue-therapy',
  'hla-antigens-and-alleles',
];

describe('W02 CP truth repeatable checks', () => {
  const tutorialsTsx = readText('src/components/DidacticTutorials.tsx');
  const tutorialCatalogTs = readText('src/utils/tutorialLibraryCatalog.ts');
  const duplicatePacket = readJson<DuplicateShadowPacket>('reports/w02_cp_truth_duplicate_shadow_packet.json');
  const manifest = readJson<ValidatedManifest>('reports/validated_mappings_manifest.json');

  it('locks public reviewed-source wording before board-mastery framing', () => {
    const officialIndex = tutorialsTsx.indexOf('Official ABPath Scope');
    const reviewedIndex = tutorialsTsx.indexOf('Reviewed source decision');
    const ruleIndex = tutorialsTsx.indexOf('Review rule');
    const boardIndex = tutorialsTsx.indexOf('Board-Mastery Teaching Focus');

    expect(officialIndex).toBeGreaterThanOrEqual(0);
    expect(reviewedIndex).toBeGreaterThan(officialIndex);
    expect(ruleIndex).toBeGreaterThan(reviewedIndex);
    expect(boardIndex).toBeGreaterThan(ruleIndex);
    expect(tutorialsTsx).toContain('CP 2026 source');
  });

  it('derives the public reviewed-source decision from the validated manifest row', () => {
    expect(tutorialCatalogTs).toContain('sourceTruth');
    expect(tutorialCatalogTs).toContain('Study this lesson under');
    expect(tutorialCatalogTs).toContain('reviewAction');
    expect(tutorialCatalogTs).toContain('reviewOwner');
  });

  it('keeps duplicate-shadow rows aligned to their canonical CP source decisions', () => {
    expect(duplicatePacket.summary.duplicateShadowCount).toBe(6);
    expect(duplicatePacket.summary.sourceMapReviewCount).toBe(0);
    expect(duplicatePacket.duplicatePairs.map((pair) => pair.id)).toEqual(expectedDuplicateIds);
    expect(duplicatePacket.duplicatePairs.every((pair) => pair.requiresSourceMapReview === false)).toBe(true);
    expect(duplicatePacket.duplicatePairs.every((pair) => pair.shadowTrack === pair.canonicalTrack)).toBe(true);
    expect(duplicatePacket.duplicatePairs.every((pair) => pair.shadowDomain === pair.canonicalDomain)).toBe(true);
    expect(duplicatePacket.duplicatePairs.every((pair) => pair.shadowPath === pair.canonicalPath)).toBe(true);
  });

  it('keeps validated CP rows reviewable with an owner and action', () => {
    const validatedCpRows = manifest.rows.filter((row) => row.validatedForPromotion && row.abpathDomain === 'CP');
    expect(validatedCpRows.length).toBeGreaterThan(0);
    expect(validatedCpRows.every((row) => row.reviewOwner && row.reviewAction)).toBe(true);
  });
});
