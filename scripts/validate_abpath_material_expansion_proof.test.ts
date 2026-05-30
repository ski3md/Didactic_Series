import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const proofPath = path.join(repoRoot, 'reports/abpath_material_expansion_proof.json');
const proofMarkdownPath = path.join(repoRoot, 'reports/abpath_material_expansion_proof.md');

interface ExpansionQueue {
  version: string;
  generatedAt: string;
  guardrails: string[];
  totals: {
    entries: number;
    domains: Record<string, number>;
    materialKinds: Record<string, number>;
    reviewStatus: Record<string, number>;
    promotionStatus: Record<string, number>;
    requiredMaterialSetItems: number;
  };
  domains: Array<{
    domain: 'AP' | 'CP';
    subject: string;
    count: number;
  }>;
  entries: Array<{
    domain: 'AP' | 'CP';
    expansionStatus: {
      reviewStatus: string;
      promotionStatus: string;
    };
  }>;
}

interface ExpansionProof {
  version: string;
  source: {
    queue: string;
    queueVersion: string;
    queueGeneratedAt: string;
    queueSha256: string;
  };
  queueTotals: {
    entries: number;
    domains: Record<string, number>;
    materialKinds: Record<string, number>;
    requiredMaterialSetItems: number;
  };
  domainCoverage: {
    totals: Record<string, number>;
    subjectCountByDomain: Record<string, number>;
    subjects: Array<{
      domain: 'AP' | 'CP';
      subject: string;
      entries: number;
    }>;
  };
  reviewStatuses: {
    counts: Record<string, number>;
    allUnreviewed: boolean;
  };
  promotionStatuses: {
    counts: Record<string, number>;
    allInGenerationQueue: boolean;
  };
  promotionGuardrails: string[];
  staleWhen: string[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

describe('ABPath material expansion proof', () => {
  const queue = readJson<ExpansionQueue>(queuePath);
  const proof = readJson<ExpansionProof>(proofPath);
  const markdown = fs.readFileSync(proofMarkdownPath, 'utf8');

  it('summarizes queue totals and AP/CP coverage without changing queue truth', () => {
    const subjectCounts = queue.domains.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.domain] = (acc[entry.domain] || 0) + 1;
      return acc;
    }, {});

    expect(proof.version).toBe('abpath-material-expansion-proof.v1');
    expect(proof.source.queue).toBe('src/content/materials/abpathMaterialExpansionQueue.json');
    expect(proof.source.queueVersion).toBe(queue.version);
    expect(proof.source.queueGeneratedAt).toBe(queue.generatedAt);
    expect(proof.source.queueSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(proof.queueTotals).toMatchObject({
      entries: queue.totals.entries,
      domains: queue.totals.domains,
      materialKinds: queue.totals.materialKinds,
      requiredMaterialSetItems: queue.totals.requiredMaterialSetItems,
    });
    expect(proof.domainCoverage.totals).toEqual(queue.totals.domains);
    expect(proof.domainCoverage.subjectCountByDomain).toEqual(subjectCounts);
    expect(proof.domainCoverage.subjects).toHaveLength(queue.domains.length);
  });

  it('keeps review status, promotion guardrails, and stale conditions explicit', () => {
    expect(proof.reviewStatuses.counts).toEqual(queue.totals.reviewStatus);
    expect(proof.reviewStatuses.allUnreviewed).toBe(true);
    expect(proof.promotionStatuses.counts).toEqual(queue.totals.promotionStatus);
    expect(proof.promotionStatuses.allInGenerationQueue).toBe(true);
    expect(proof.promotionGuardrails.join(' ')).toContain('does not promote queue entries');
    expect(proof.promotionGuardrails.join(' ')).toContain('source-truth mappings');
    expect(proof.staleWhen).toEqual(
      expect.arrayContaining([
        expect.stringContaining('abpathMaterialExpansionQueue.json changes'),
        expect.stringContaining('any queue entry moves out of unreviewed generation-queue status'),
      ]),
    );
    expect(markdown).toContain('ABPath Material Expansion Proof');
    expect(markdown).toContain('## AP/CP Domain Coverage');
    expect(markdown).toContain('## Stale When');
  });
});
