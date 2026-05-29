import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const packetPath = path.join(root, 'reports/w02_cp_truth_duplicate_shadow_packet.json');

describe('W02 CP truth duplicate shadow packet', () => {
  const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));

  it('freezes the six duplicate-shadow rows against validated canonical pairs', () => {
    expect(packet.tranche).toBe('T06 W02 CP Truth');
    expect(packet.summary.duplicateShadowCount).toBe(6);
    expect(packet.summary.canonicalValidatedCount).toBe(6);
    expect(packet.summary.sourceMapReviewCount).toBe(0);
    expect(packet.summary.allDuplicatesHaveCanonicalValidatedPair).toBe(true);
    expect(packet.actionBuckets.safeDuplicateExclusions).toEqual([
      'blood-banking-transfusion-medicine',
      'clinical-practice',
      'paroxysmal-nocturnal-hemoglobinuria',
      'anemia-in-oncology-patients',
      'cell-and-tissue-therapy',
      'hla-antigens-and-alleles',
    ]);
    expect(packet.actionBuckets.sourceMapReviewRequired).toEqual([]);
  });

  it('keeps the proof bundle and step state aligned to T06', () => {
    expect(packet.execution.completedStepIds).toEqual([
      'W02-L1_CP_TRUTH-C01',
      'W02-L1_CP_TRUTH-C02',
      'W02-L1_CP_TRUTH-C03',
      'W02-L1_CP_TRUTH-C04',
      'W02-L1_CP_TRUTH-C05',
    ]);
    expect(packet.execution.proofCommands).toEqual([
      'npm run cp:precision:validate',
      'node scripts/validate_validated_mappings_manifest.cjs',
      'npx vitest run scripts/validate_w02_cp_truth_duplicate_shadow_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ]);
    expect(packet.completionGate.duplicateShadowQueueUnderstood).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
