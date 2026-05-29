# W02 CP Truth Duplicate Shadow Packet

Generated: 2026-05-29T04:37:12.511Z

Tranche: T06 W02 CP Truth

## Summary

- Duplicate-shadow rows: 6
- Canonical validated pairs: 6
- Source-map review required: 0
- All duplicates have canonical validated pairs: yes

## Action Buckets

- Safe duplicate exclusions: blood-banking-transfusion-medicine, clinical-practice, paroxysmal-nocturnal-hemoglobinuria, anemia-in-oncology-patients, cell-and-tissue-therapy, hla-antigens-and-alleles
- Source-map review required: none

## Duplicate Pairs

- blood-banking-transfusion-medicine
  - shadow: src/content/tutorials/tutorials.normalized.json::blood-banking-transfusion-medicine
  - canonical: src/content/downloads_imports/normalized/tutorials.normalized.json::blood-banking-transfusion-medicine
  - review required: no
  - mismatch notes: none
- clinical-practice
  - shadow: src/content/tutorials/tutorials.normalized.json::clinical-practice
  - canonical: src/content/downloads_imports/normalized/tutorials.normalized.json::clinical-practice
  - review required: no
  - mismatch notes: none
- paroxysmal-nocturnal-hemoglobinuria
  - shadow: src/content/tutorials/tutorials.normalized.json::paroxysmal-nocturnal-hemoglobinuria
  - canonical: src/content/downloads_imports/normalized/tutorials.normalized.json::paroxysmal-nocturnal-hemoglobinuria
  - review required: no
  - mismatch notes: none
- anemia-in-oncology-patients
  - shadow: src/content/tutorials/tutorials.normalized.json::anemia-in-oncology-patients
  - canonical: src/content/downloads_imports/normalized/tutorials.normalized.json::anemia-in-oncology-patients
  - review required: no
  - mismatch notes: none
- cell-and-tissue-therapy
  - shadow: src/content/tutorials/tutorials.normalized.json::cell-and-tissue-therapy
  - canonical: src/content/downloads_imports/normalized/tutorials.normalized.json::cell-and-tissue-therapy
  - review required: no
  - mismatch notes: none
- hla-antigens-and-alleles
  - shadow: src/content/tutorials/tutorials.normalized.json::hla-antigens-and-alleles
  - canonical: src/content/downloads_imports/normalized/tutorials.normalized.json::hla-antigens-and-alleles
  - review required: no
  - mismatch notes: none

## Execution

- Completed step ids: W02-L1_CP_TRUTH-C01, W02-L1_CP_TRUTH-C02, W02-L1_CP_TRUTH-C03
- Proof commands: `npm run cp:precision:validate`, `node scripts/validate_validated_mappings_manifest.cjs`, `npx vitest run scripts/validate_w02_cp_truth_duplicate_shadow_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts`, `git diff --check`

## Completion Gate

- Duplicate-shadow queue understood: yes
- stale when: the validated mappings manifest changes without regenerating this packet
- stale when: the T06 completed step list changes without regenerating this packet
- stale when: any duplicate-shadow row loses its canonical validated pair without regenerating this packet
