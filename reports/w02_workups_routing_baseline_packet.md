# W02 Workups and Routing Baseline Packet

Generated: 2026-05-29T23:24:49.865Z

Tranche: T09 W02 Workups and Routing
Status: in_progress

## Authority

- T08 closed: yes
- T08 next tranche: T09 W02 Workups and Routing
- Guard: Do not alter CP source-link normalization, CP root counts, learner source-link wording, or source-truth mappings inside T09 without regenerating T07 and T08 proof.
- Source-link normalization groups: 7
- Visible cluster count: 7
- CP root count: 6

## Baseline

- Total algorithms: 14
- Clinical Pathology algorithms: 12
- Clinical Pathology route aliases: 36
- CP algorithm: cp-foundations-anemia-workup
- CP algorithm: cp-foundations-bleeding-diatathesis-triage
- CP algorithm: cp-foundations-specimen-to-result-workflow
- CP algorithm: cp-mi-finance-aware-assay-planning
- CP algorithm: cp-mi-lis-workflow-redesign
- CP algorithm: cp-mi-qc-failure-response
- CP algorithm: cp-mi-validation-verification-triage
- CP algorithm: cp-micro-ast-interpretation
- CP algorithm: cp-micro-organism-identification-workflow
- CP algorithm: cp-micro-specimen-quality-triage
- CP algorithm: cp-transfusion-crossmatch-workup
- CP algorithm: cp-transfusion-reaction-triage

## Route Source Links

- Preserve learner source-link wording: yes
- Preserve T07 source-link map: yes
- Preserve T08 learner wording: yes
- Route aliases carry CP operational language: yes

## Workup Parity

- CP route coverage green: yes
- Management and Informatics routes: 4
- Foundations routes: 3
- Transfusion routes: 2
- Microbiology routes: 3
- Unsupported route guard: Unimplemented CP topics must not fall back heuristically to unrelated algorithm routes.

## Execution

- Completed step ids: W02-L4_WORKUPS_ROUTING-C01, W02-L4_WORKUPS_ROUTING-C02, W02-L4_WORKUPS_ROUTING-C03
- Remaining step ids: W02-L4_WORKUPS_ROUTING-C04, W02-L4_WORKUPS_ROUTING-C05, W02-L4_WORKUPS_ROUTING-C06, W02-L4_WORKUPS_ROUTING-C07, W02-L4_WORKUPS_ROUTING-C08, W02-L4_WORKUPS_ROUTING-C09, W02-L4_WORKUPS_ROUTING-C10
- Proof commands: `npm run didactics:ux:validate`, `npm run test -- src/utils/algorithmCatalog.test.ts src/utils/studyDestinationResolver.test.ts`, `npx vitest run scripts/validate_w02_workups_routing_baseline_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts`, `git diff --check`

## Completion Gate

- Baseline green: yes
- stale when: T08 closeout changes without regenerating this packet
- stale when: algorithms.normalized.json changes without regenerating this packet
- stale when: algorithm routing tests change without regenerating this packet
