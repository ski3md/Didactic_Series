# W02 CP Truth Baseline Packet

Generated: 2026-05-29T21:27:01.299Z

Tranche: T06 W02 CP Truth

## Baseline

- Raw crosswalk tutorials: 493
- Raw crosswalk mapped rows: 493
- Manifest total rows: 493
- Reviewed-for-promotion rows: 487
- Not-yet-reviewed rows: 6
- CP reviewed rows: 285
- CP governed tutorials: 13
- CP governed modules: 7
- Source fingerprint: c684605d093a1ab14ee41f8fd0db31993ef91c8218da1f9ef044c5c35c25b11e

## Reconciliation Gap

- Raw vs reviewed gap: 6
- Not-yet-reviewed ids: blood-banking-transfusion-medicine, clinical-practice, paroxysmal-nocturnal-hemoglobinuria, anemia-in-oncology-patients, cell-and-tissue-therapy, hla-antigens-and-alleles
- CP governed exception count: 13
- CP governed exception ids: respiratory-viruses, topic-mb-3-a, topic-mol-1, topic-mol-2, topic-mol-3, cp-micro-methods-ast-studio, cp-flow-heme-studio, cp-dat-transfusion-studio, cp-mgmt-break-even-studio, cp-mgmt-reagent-rental-studio, cp-mgmt-productivity-studio, cp-chemical-path-endocrine-studio, cp-immune-lipid-studio

## Execution

- Completed step ids: W02-L1_CP_TRUTH-C01, W02-L1_CP_TRUTH-C02, W02-L1_CP_TRUTH-C03, W02-L1_CP_TRUTH-C04, W02-L1_CP_TRUTH-C05, W02-L1_CP_TRUTH-C06, W02-L1_CP_TRUTH-C07, W02-L1_CP_TRUTH-C08, W02-L1_CP_TRUTH-C09, W02-L1_CP_TRUTH-C10
- Proof commands: `npm run cp:precision:validate`, `node scripts/validate_validated_mappings_manifest.cjs`, `npx vitest run scripts/validate_w02_cp_truth_baseline_packet.test.ts scripts/validate_w02_cp_truth_duplicate_shadow_packet.test.ts scripts/validate_w02_cp_truth_mapping_coverage_packet.test.ts scripts/validate_w02_cp_truth_closeout_packet.test.ts scripts/validate_w02_cp_truth_checks.test.ts scripts/validate_full_1000_execution_ledger.test.ts`, `git diff --check`

## Completion Gate

- Baseline green: yes
- stale when: the crosswalk, validated manifest, or CP governance report changes without regenerating this packet
- stale when: the reviewed-versus-raw row counts change without regenerating this packet
- stale when: the tranche ledger status or completed step list changes without regenerating this packet
