import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/cp_governed_exception_reviewer_packet.json') as {
  summary: {
    exceptionCount: number;
    byPrecisionMode: Record<string, number>;
  };
  rows: Array<{
    id: string;
    abpathPrecisionMode: string;
    rationale: string;
  }>;
};

describe('cp governed exception reviewer packet', () => {
  it('captures the current governed CP exception queue', () => {
    expect(packet.summary.exceptionCount).toBe(13);
    expect(packet.summary.byPrecisionMode).toEqual({
      'cross-domain-governed': 2,
      'nearest-valid-deep': 11,
    });
  });

  it('keeps rationale on every reviewer-packet row', () => {
    expect(packet.rows).toHaveLength(13);
    for (const row of packet.rows) {
      expect(row.rationale.length).toBeGreaterThan(0);
      expect(['cross-domain-governed', 'nearest-valid-deep']).toContain(row.abpathPrecisionMode);
    }
  });
});
