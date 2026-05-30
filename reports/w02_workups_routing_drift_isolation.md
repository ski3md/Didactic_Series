# W02 Workups and Routing Drift Isolation Packet

Generated: 2026-05-30T04:16:29.363Z

Tranche: T09 W02 Workups and Routing
Step: W02-L4_WORKUPS_ROUTING-C09
Status: isolated

## Baseline Authority

- Source-link normalization groups: 7
- Visible cluster count: 7
- CP root count: 6
- Unsupported route guard: Unimplemented CP topics must not fall back heuristically to unrelated algorithm routes.
- Workups rule locked: yes

## Guardrails

- Do not touch: CP source-link normalization
- Do not touch: CP root counts
- Do not touch: source-truth mappings
- Do not touch: the executable Workups routing rule
- Unsupported CP topics must not route heuristically: yes
- Workups label cannot become a generic CTA: yes
- CP source-link and root counts remain untouched: yes
- Source-truth mappings remain read-only: yes

## Risk Register

### W02-WR-C09-R01_UNSUPPORTED_CP_TOPIC_HEURISTIC

- Title: Unsupported Clinical Pathology topics must not route heuristically
- Drift signal: An unimplemented CP topic resolves to the nearest live algorithm through partial-token matching instead of returning null.
- Isolation rule: Keep unsupported CP topics unrouted until an owned algorithm record or exact guarded alias is added with proof.
- Guarded files: src/utils/algorithmCatalog.ts, src/utils/algorithmCatalog.test.ts, src/content/algorithms/algorithms.normalized.json
- Targeted proof: `npm run test -- src/utils/algorithmCatalog.test.ts`, `npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts`

### W02-WR-C09-R02_WORKUPS_LABEL_GENERIC_CTA

- Title: Workups label cannot become a generic CTA
- Drift signal: `Workups` appears as generic launch, teaser, fallback, or marketing copy rather than the governed diagnostic-workup lane label.
- Isolation rule: Use `Workups` only when it truthfully names the active diagnostic-workup workspace and bench-facing routing rule.
- Guarded files: src/components/AlgorithmNavigator.tsx, docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md, src/content/contracts/pthfndrDidacticsLearningUxContract.json, scripts/validate_didactics_learning_ux.cjs
- Targeted proof: `npm run didactics:ux:validate`, `npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts`

### W02-WR-C09-R03_CP_SOURCE_LINK_ROOT_COUNT_DRIFT

- Title: CP source-link and root-count proof must remain untouched
- Drift signal: The T07/T08 source-link normalization groups, visible cluster count, or CP root count change during T09 route work.
- Isolation rule: Do not alter CP source-link normalization, learner source-link wording, visible cluster count, or CP root count inside T09.
- Guarded files: reports/w02_workups_routing_baseline_packet.json, reports/w02_learner_ux_closeout_packet.json, reports/w02_content_parity_closeout_packet.json
- Targeted proof: `npx vitest run scripts/validate_w02_workups_routing_baseline_packet.test.ts`, `npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts`

### W02-WR-C09-R04_SOURCE_TRUTH_MAPPING_MUTATION

- Title: Source-truth mappings stay outside this route drift tranche
- Drift signal: Validated mappings, mapping validators, or normalized algorithm source truth change while isolating route drift.
- Isolation rule: Treat mapping/source-truth files as read-only for T09 C09; regenerate upstream proof before any intentional change.
- Guarded files: src/content/tutorials/validatedMappingsManifest.json, scripts/validate_validated_mappings_manifest.cjs, src/content/algorithms/algorithms.normalized.json
- Targeted proof: `node scripts/validate_validated_mappings_manifest.cjs`, `npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts`

## Targeted Proof

- `node scripts/generate_w02_workups_routing_drift_isolation.cjs`
- `npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts`
- `git diff --check`

## Completion Gate

- Isolated risk ids: W02-WR-C09-R01_UNSUPPORTED_CP_TOPIC_HEURISTIC, W02-WR-C09-R02_WORKUPS_LABEL_GENERIC_CTA, W02-WR-C09-R03_CP_SOURCE_LINK_ROOT_COUNT_DRIFT, W02-WR-C09-R04_SOURCE_TRUTH_MAPPING_MUTATION
- Ready for C10 when: C09 packet exists, its focused validation passes, and no guarded source-truth or CP count files were edited.
