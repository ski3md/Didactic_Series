# W02 CP Truth Mapping Coverage Packet

Generated: 2026-05-29T21:27:01.521Z

Tranche: T06 W02 CP Truth

## Coverage

- CP-domain validated rows: 285
- CP-governed rows: 23
- CP crosswalk rows: 262
- CP root count: 6
- Roots: Blood Banking/Transfusion Medicine (123), Chemical Pathology (63), Hematopathology for Clinical Pathology (39), Management and Informatics (16), Medical Microbiology (43), Chemical Pathology + Blood Banking/Transfusion Medicine (1)
- Source types: crosswalk: 262, cp-governance: 10, interactive-cp: 13

## Reviewability

- Missing review owner/action rows: 0
- Unmapped validated CP rows: 0
- Duplicate-shadow rows: 6

## Drift Risks

- Governed exception count: 13
- Crosswalk CP rows without explicit review status: 262
- Source fingerprint: c684605d093a1ab14ee41f8fd0db31993ef91c8218da1f9ef044c5c35c25b11e

## Execution

- Completed step ids: W02-L1_CP_TRUTH-C01, W02-L1_CP_TRUTH-C02, W02-L1_CP_TRUTH-C03, W02-L1_CP_TRUTH-C04, W02-L1_CP_TRUTH-C05, W02-L1_CP_TRUTH-C06, W02-L1_CP_TRUTH-C07, W02-L1_CP_TRUTH-C08, W02-L1_CP_TRUTH-C09, W02-L1_CP_TRUTH-C10
- Proof commands: `npm run cp:precision:validate`, `node scripts/validate_validated_mappings_manifest.cjs`, `npx vitest run scripts/validate_w02_cp_truth_mapping_coverage_packet.test.ts scripts/validate_w02_cp_truth_checks.test.ts`, `git diff --check`

## Completion Gate

- Targeted mapping coverage green: yes
- stale when: the validated mappings manifest changes without regenerating this packet
- stale when: the CP governance report changes without regenerating this packet
- stale when: the T06 completed step list changes without regenerating this packet
