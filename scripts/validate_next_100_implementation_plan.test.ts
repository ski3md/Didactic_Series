import { createRequire } from 'module';
import path from 'path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const currentFilePath = require('url').fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);
const plan = require('../src/content/planning/next_100_implementation_plan.json') as {
  total_steps: number;
  tranche_count: number;
  target_waves: string[];
  tranches: Array<{
    id: string;
    wave: string;
    lane: string;
    tranche_step_count: number;
    step_ids: string[];
    proof_commands: string[];
  }>;
};
const markdown = require('fs').readFileSync(
  path.resolve(currentDir, '../docs/planning/NEXT_100_IMPLEMENTATION_PLAN.md'),
  'utf8',
);

describe('next 100 implementation plan assets', () => {
  it('stays bounded to the first 100 steps and two opening waves', () => {
    expect(plan.total_steps).toBe(100);
    expect(plan.target_waves).toEqual(['W01', 'W02']);
    expect(plan.tranche_count).toBe(10);
  });

  it('keeps ten bounded tranches with ten steps each', () => {
    expect(plan.tranches).toHaveLength(10);
    for (const tranche of plan.tranches) {
      expect(tranche.tranche_step_count).toBe(10);
      expect(tranche.step_ids).toHaveLength(10);
      expect(tranche.proof_commands.length).toBeGreaterThan(0);
    }
  });

  it('renders the required implementation-plan sections', () => {
    expect(markdown).toContain('## Program Boundary');
    expect(markdown).toContain('## Wave Order');
    expect(markdown).toContain('## Immediate Next Tranches');
    expect(markdown).toContain('## Tranche Map');
  });
});
