import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/cp_governed_promotion_packet.json') as {
  summary: {
    promoteCount: number;
    groupedRootCount: number;
    roots: Record<string, number>;
  };
  groupedQueue: Record<string, Array<{ id: string; reviewAction: string; rationale: string }>>;
};

describe('cp governed promotion packet', () => {
  it('captures the current governed-promotion queue and root grouping', () => {
    expect(packet.summary.promoteCount).toBe(5);
    expect(packet.summary.groupedRootCount).toBe(2);
    expect(packet.summary.roots).toEqual({
      'Hematopathology for Clinical Pathology': 3,
      'Medical Microbiology': 2,
    });
  });

  it('keeps review action and rationale on every governed-promotion row', () => {
    const rows = Object.values(packet.groupedQueue).flat();
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row.reviewAction.length).toBeGreaterThan(0);
      expect(row.rationale.length).toBeGreaterThan(0);
    }
  });
});
