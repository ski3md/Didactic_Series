import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/cp_reviewer_action_packet.json') as {
  summary: {
    reviewerActionCount: number;
    groupedRootCount: number;
    roots: Record<string, number>;
  };
  groupedQueue: Record<string, Array<{ id: string; reviewAction: string; rationale: string }>>;
};

describe('cp reviewer action packet', () => {
  it('captures the current reviewer-action queue and root grouping', () => {
    expect(packet.summary.reviewerActionCount).toBe(8);
    expect(packet.summary.groupedRootCount).toBe(6);
    expect(packet.summary.roots).toEqual({
      'Blood Banking/Transfusion Medicine': 1,
      'Chemical Pathology': 1,
      'Chemical Pathology + Blood Banking/Transfusion Medicine': 1,
      'Hematopathology for Clinical Pathology': 1,
      'Management and Informatics': 3,
      'Medical Microbiology': 1,
    });
  });

  it('keeps review action and rationale on every queued row', () => {
    const rows = Object.values(packet.groupedQueue).flat();
    expect(rows).toHaveLength(8);
    for (const row of rows) {
      expect(/Complete CP governance review before promotion\./.test(row.reviewAction)).toBe(true);
      expect(row.rationale.length).toBeGreaterThan(0);
    }
  });
});
