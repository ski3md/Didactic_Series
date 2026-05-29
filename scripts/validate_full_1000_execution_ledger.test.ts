import { createRequire } from 'module';
import path from 'path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const currentFilePath = require('url').fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const ledger = require('../src/content/planning/full_1000_execution_ledger.json') as {
  groupedPhases: Array<{ id: string; waves: string[] }>;
  trancheStatusCounts: { completed: number; in_progress: number; planned: number };
  tranches: Array<{
    id: string;
    status: string;
    statusBasis: string;
    completionEvidence: {
      completedStepIds: string[];
      remainingStepIds: string[];
    };
  }>;
  immediateNextSequence: string[];
};
const markdown = require('fs').readFileSync(
  path.resolve(currentDir, '../docs/planning/FULL_1000_EXECUTION_LEDGER.md'),
  'utf8',
);

describe('full 1000 execution ledger assets', () => {
  it('keeps the seven grouped phases aligned to the 20-wave roadmap', () => {
    expect(ledger.groupedPhases).toHaveLength(7);
    expect(ledger.groupedPhases[0]).toMatchObject({ id: 'G1', waves: ['W01', 'W02', 'W03'] });
    expect(ledger.groupedPhases[6]).toMatchObject({ id: 'G7', waves: ['W19', 'W20'] });
  });

  it('marks only the reconciled opening tranches as completed or in progress', () => {
    expect(ledger.trancheStatusCounts).toEqual({
      completed: 5,
      in_progress: 1,
      planned: 94,
    });

    const t01 = ledger.tranches.find((tranche) => tranche.id === 'T01');
    const t02 = ledger.tranches.find((tranche) => tranche.id === 'T02');
    const t03 = ledger.tranches.find((tranche) => tranche.id === 'T03');
    const t04 = ledger.tranches.find((tranche) => tranche.id === 'T04');
    const t05 = ledger.tranches.find((tranche) => tranche.id === 'T05');
    const t06 = ledger.tranches.find((tranche) => tranche.id === 'T06');

    expect(t01).toMatchObject({
      status: 'completed',
      statusBasis: 'exact_proof_bundle',
    });
    expect(t01?.completionEvidence.completedStepIds).toHaveLength(10);
    expect(t01?.completionEvidence.remainingStepIds).toHaveLength(0);

    expect(t02).toMatchObject({
      status: 'completed',
      statusBasis: 'exact_proof_bundle',
    });
    expect(t02?.completionEvidence.completedStepIds).toHaveLength(10);
    expect(t02?.completionEvidence.remainingStepIds).toHaveLength(0);

    expect(t03).toMatchObject({
      status: 'completed',
      statusBasis: 'exact_proof_bundle',
    });
    expect(t03?.completionEvidence.completedStepIds).toHaveLength(10);
    expect(t03?.completionEvidence.remainingStepIds).toHaveLength(0);

    expect(t04).toMatchObject({
      status: 'completed',
      statusBasis: 'exact_proof_bundle',
    });
    expect(t04?.completionEvidence.completedStepIds).toHaveLength(10);
    expect(t04?.completionEvidence.remainingStepIds).toHaveLength(0);

    expect(t05).toMatchObject({
      status: 'completed',
      statusBasis: 'exact_proof_bundle',
    });
    expect(t05?.completionEvidence.completedStepIds).toHaveLength(10);
    expect(t05?.completionEvidence.remainingStepIds).toHaveLength(0);
    expect(t06).toMatchObject({
      status: 'in_progress',
      statusBasis: 'exact_step_backfill',
    });
    expect(t06?.completionEvidence.completedStepIds).toEqual([
      'W02-L1_CP_TRUTH-C01',
      'W02-L1_CP_TRUTH-C02',
      'W02-L1_CP_TRUTH-C03',
      'W02-L1_CP_TRUTH-C04',
      'W02-L1_CP_TRUTH-C05',
      'W02-L1_CP_TRUTH-C06',
    ]);
    expect(t06?.completionEvidence.remainingStepIds).toHaveLength(4);
  });

  it('renders the required ledger sections and immediate next sequence', () => {
    expect(markdown).toContain('## Current State');
    expect(markdown).toContain('## Completion Definition');
    expect(markdown).toContain('## Grouped Phases');
    expect(markdown).toContain('## Immediate Next Sequence');
    expect(markdown).toContain('### T01 W01 CP Truth');
    expect(markdown).toContain('### T05 W01 Contracts and Proof');
    expect(ledger.immediateNextSequence).toHaveLength(5);
    expect(ledger.immediateNextSequence[0]).toBe('Freeze the W02 CP reviewed-versus-raw baseline.');
    expect(ledger.immediateNextSequence[1]).toBe(
      'Correct the duplicate-shadow source-map mismatches in T06 W02 CP Truth.',
    );
    expect(ledger.immediateNextSequence[2]).toBe(
      'Lock public reviewed-source wording and review-rule proof in T06 W02 CP Truth.',
    );
    expect(ledger.immediateNextSequence[3]).toBe(
      'Expand repeatable T06 truth checks before moving to W02 content parity.',
    );
    expect(ledger.immediateNextSequence[4]).toBe(
      'Add targeted W02 mapping coverage before refreshing reusable board-prep output.',
    );
  });
});
