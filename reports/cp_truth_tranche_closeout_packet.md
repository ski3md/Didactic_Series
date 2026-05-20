# CP Truth Tranche Closeout Packet

Generated: 2026-05-20T11:11:05.604Z

Tranche: T01 W01 CP Truth

## Baseline

- CP-governed tutorials: 13
- CP-governed modules: 7
- Validated tutorials: 487
- Governance-pending tutorials: 0
- Source fingerprint: `c1d6ff9c18b2ac0d5d6b7fef5010d47090c304968213f4d64d339fc55d65bf18`

## Queue

- Total governed exceptions: 13
- Reviewer action required: 8
- Promote under governed anchor: 5
- Roots represented: 6

## Execution

- Top priority root: Management and Informatics
- Proof commands: `npm run cp:precision:validate`, `npx vitest run scripts/validate_cp_truth_baseline_outputs.test.ts`, `git diff --check`

## Completion Gate

- Baseline green: yes
- stale when: the source fingerprint no longer matches the current CP truth handoff summary
- stale when: the root count no longer matches the current CP root execution checklist
- stale when: the top priority root changes without regenerating this manifest
