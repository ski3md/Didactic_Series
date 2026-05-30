import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const reportPath = path.join(repoRoot, 'reports/abpath_material_expansion_queue.md');
const apSpecPath = path.join(repoRoot, 'src/content/syllabus/syllabus.normalized.json');
const cpSpecPath = path.join(repoRoot, 'src/content/downloads_imports/raw/cp_content_specification_11_11_25.raw.json');

interface ExpansionEntry {
  id: string;
  domain: 'AP' | 'CP';
  materialKind: 'header' | 'subheader' | 'subject' | 'topic' | 'subtopic' | 'set';
  title: string;
  path: string[];
  categoryId: string;
  subject: string;
  difficulty: string;
  source: {
    sourcePath: string;
    rawSourcePath: string;
    sourceTopicId: string;
    sourceLine: number | null;
  };
  generator: {
    tool: string;
    profile: string;
    requiredMaterialSet: string[];
  };
  expansionStatus: {
    reviewStatus: string;
    promotionStatus: string;
    gapPlanPriority: string | null;
    gapPlanPhase: string | null;
  };
}

interface ExpansionQueue {
  version: string;
  guardrails: string[];
  totals: {
    entries: number;
    domains: Record<string, number>;
    materialKinds: Record<string, number>;
    reviewStatus: Record<string, number>;
    promotionStatus: Record<string, number>;
  };
  entries: ExpansionEntry[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function countCpSpecRows(roots: Array<{ children?: unknown[] }>): number {
  let count = 0;

  function walk(node: { children?: unknown[] }) {
    count += 1;
    for (const child of node.children || []) walk(child as { children?: unknown[] });
  }

  for (const root of roots) walk(root);
  return count;
}

describe('ABPath material expansion queue', () => {
  const queue = readJson<ExpansionQueue>(queuePath);
  const apSpec = readJson<Array<unknown>>(apSpecPath);
  const cpSpec = readJson<{ SYLLABUS_DATA: Array<{ children?: unknown[] }> }>(cpSpecPath);

  it('covers the local AP and CP ABPath specification sources', () => {
    const expectedApCount = apSpec.length;
    const expectedCpCount = countCpSpecRows(cpSpec.SYLLABUS_DATA);

    expect(queue.version).toBe('abpath-material-expansion-queue.v1');
    expect(queue.totals.entries).toBe(queue.entries.length);
    expect(queue.totals.domains.AP).toBe(expectedApCount);
    expect(queue.totals.domains.CP).toBe(expectedCpCount);
    expect(queue.entries.length).toBe(expectedApCount + expectedCpCount);
  });

  it('represents all generator hierarchy layers requested for bulk expansion', () => {
    for (const kind of ['header', 'subheader', 'subject', 'topic', 'subtopic']) {
      expect(queue.totals.materialKinds[kind]).toBeGreaterThan(0);
    }

    const requiredSetLabels = new Set(queue.entries.flatMap((entry) => entry.generator.requiredMaterialSet));
    expect(requiredSetLabels.size).toBeGreaterThan(6);
    expect(requiredSetLabels).toContain('faculty review checklist');
  });

  it('uses collision-safe queue entry identifiers', () => {
    const ids = queue.entries.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps generated material unreviewed until explicit promotion', () => {
    expect(queue.totals.reviewStatus.unreviewed).toBe(queue.entries.length);
    expect(queue.totals.promotionStatus['generation-queue']).toBe(queue.entries.length);

    for (const entry of queue.entries) {
      expect(entry.expansionStatus.reviewStatus).toBe('unreviewed');
      expect(entry.expansionStatus.promotionStatus).toBe('generation-queue');
      expect(entry.generator.tool).toBe('scripts/generate_abpath_material_expansion_queue.cjs');
      expect(entry.generator.requiredMaterialSet.length).toBeGreaterThanOrEqual(6);
      expect(entry.source.sourcePath).toMatch(/^src\/content\//);
      expect(entry.source.rawSourcePath).toMatch(/^src\/content\//);
    }
  });

  it('preserves guardrails and a reviewer-readable report', () => {
    expect(queue.guardrails.join(' ')).toContain('unreviewed');
    expect(queue.guardrails.join(' ')).toContain('source-truth mappings');
    expect(fs.readFileSync(reportPath, 'utf8')).toContain('ABPath Material Expansion Queue');
  });
});
