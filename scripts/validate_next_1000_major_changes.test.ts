import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  readProgram,
  renderProgramMarkdown,
  validateProgram,
  buildSummary,
} = require('./next_1000_major_changes_lib.cjs') as {
  readProgram: () => {
    records: Array<Record<string, unknown>>;
    waves: Array<Record<string, unknown>>;
    lanes: Array<Record<string, unknown>>;
  };
  renderProgramMarkdown: (program: Record<string, unknown>) => string;
  validateProgram: (program: Record<string, unknown>) => string[];
  buildSummary: (program: Record<string, unknown>) => {
    totalRecords: number;
    waveSummaries: Array<{
      id: string;
      recordCount: number;
      artifactCoverage: {
        learnerFacing: boolean;
        proofValidator: boolean;
        sponsorReviewer: boolean;
        demoProduct: boolean;
      };
    }>;
    laneSummaries: Array<{ id: string; recordCount: number }>;
  };
};

describe('next 1000 major changes planning assets', () => {
  const program = readProgram();

  it('keeps the expected 1000-record shape', () => {
    expect(program.records).toHaveLength(1000);
    expect(program.waves).toHaveLength(20);
    expect(program.lanes).toHaveLength(5);
  });

  it('passes the planning validator', () => {
    expect(validateProgram(program)).toEqual([]);
  });

  it('covers every wave and lane with the required counts', () => {
    const summary = buildSummary(program);

    expect(summary.totalRecords).toBe(1000);
    expect(summary.waveSummaries.every((wave) => wave.recordCount === 50)).toBe(true);
    expect(summary.laneSummaries.every((lane) => lane.recordCount === 200)).toBe(true);
  });

  it('gives every wave learner, proof, sponsor-review, and demo-product coverage', () => {
    const summary = buildSummary(program);

    for (const wave of summary.waveSummaries) {
      expect(wave.artifactCoverage.learnerFacing).toBe(true);
      expect(wave.artifactCoverage.proofValidator).toBe(true);
      expect(wave.artifactCoverage.sponsorReviewer).toBe(true);
      expect(wave.artifactCoverage.demoProduct).toBe(true);
    }
  });

  it('renders the required plain-language roadmap sections', () => {
    const markdown = renderProgramMarkdown(program);

    expect(markdown).toContain('## Productivity Outputs by Wave');
    expect(markdown).toContain('## Sponsor / Faculty / Reviewer-Ready Artifacts');
    expect(markdown).toContain('## Product Pipeline Reuse Map');
    expect(markdown.toLowerCase()).not.toContain('acceptance surface');
    expect(markdown.toLowerCase()).not.toContain('artifact factory');
    expect(markdown.toLowerCase()).not.toContain('synchrony gate');
  });
});
