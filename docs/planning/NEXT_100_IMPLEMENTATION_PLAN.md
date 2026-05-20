# Next 100 Implementation Plan

A derived execution plan for the next 100 steps, using waves W01 and W02 from the 1000-change planning program and preserving the same five stable work lanes.

## Program Boundary

- Source program: `src/content/planning/next_1000_major_changes.json`
- Included waves: `W01`, `W02`
- Total planned steps: 100
- Execution shape: 10 tranches x 10 steps each

## Implementation Rules

- Work in wave order: finish W01 before W02 unless an explicit prerequisite says otherwise.
- Inside each wave, land L1, then L2, then L3, then L4, then L5.
- Treat each lane-wave pair as one bounded tranche of 10 steps.
- Do not mix source-truth files with learner-UX files unless the tranche owns both.
- Close every tranche with its lane proof commands before opening the next tranche.

## Wave Order

- **W01 Freeze the current truth baseline**: Lock the current CP and AP teaching truth before more promotion work lands.
- **W02 Reconcile raw mappings with reviewed mappings**: Close the gap between raw source matches and reviewed teaching matches.

## Lane Order Per Wave

- 1. **CP Truth**: CP truth, ABPath anchors, source mapping, and review status
- 2. **Content Parity**: Tutorials, curriculum, studio content, and content parity
- 3. **Learner UX**: Learner wording, navigation, study flow, and reference-page clarity
- 4. **Workups and Routing**: Workups, diagnostic paths, route behavior, and workup tests
- 5. **Contracts and Proof**: Contracts, checks, reports, proof files, and release evidence

## Immediate Next Tranches

- `T01` This lane settles the reviewed CP and AP teaching truth for freeze the current truth baseline.
- `T02` This lane brings the learner-facing content into line with the reviewed truth for freeze the current truth baseline.
- `T03` This lane makes the study experience clearer and calmer for freeze the current truth baseline.

## Tranche Map

### T01 W01 CP Truth

- Goal: This lane settles the reviewed CP and AP teaching truth for freeze the current truth baseline.
- Step window: W01-L1_CP_TRUTH-C01 -> W01-L1_CP_TRUTH-C10
- Tranche size: 10 planned changes
- Required files: `src/content/tutorials/tutorialAbpathSpecCrosswalk.json`, `src/content/tutorials/validatedMappingsManifest.json`, `reports/validated_mappings_manifest.json`, `reports/cp_precision_governance_report.json`
- Do not touch: `src/components`, `src/hooks`, `public/cp-studios`
- Proof commands: `npm run cp:precision:validate`, `node scripts/validate_validated_mappings_manifest.cjs`, `git diff --check`
- Prerequisites: W01-L1_CP_TRUTH-C01, W01-L1_CP_TRUTH-C02, W01-L1_CP_TRUTH-C03, W01-L1_CP_TRUTH-C04, W01-L1_CP_TRUTH-C05, W01-L1_CP_TRUTH-C06, W01-L1_CP_TRUTH-C07, W01-L1_CP_TRUTH-C08, W01-L1_CP_TRUTH-C09
- Planned outputs: BOARD_PREP_ASSET (4), FACULTY_REVIEW_PACKET (3), LEARNER_COPY (1), PRODUCT_POSITIONING_ASSET (1), SPONSOR_PACKET_ASSET (1)

### T02 W01 Content Parity

- Goal: This lane brings the learner-facing content into line with the reviewed truth for freeze the current truth baseline.
- Step window: W01-L2_CONTENT_PARITY-C01 -> W01-L2_CONTENT_PARITY-C10
- Tranche size: 10 planned changes
- Required files: `src/content/tutorials/clinicalPathInteractiveTutorials.json`, `src/content/curriculum/activeCurriculum.ts`, `src/utils/tutorialLibraryCatalog.ts`, `reports/content_consumption_journey_evaluation.json`
- Do not touch: `scripts/validate_didactics_learning_ux.cjs`, `src/components/AlgorithmNavigator.tsx`
- Proof commands: `npm run cp:precision:validate`, `npm run test -- src/utils/tutorialLibraryCatalog.test.ts`, `git diff --check`
- Prerequisites: W01-L1_CP_TRUTH-C04, W01-L2_CONTENT_PARITY-C01, W01-L2_CONTENT_PARITY-C02, W01-L2_CONTENT_PARITY-C03, W01-L2_CONTENT_PARITY-C04, W01-L2_CONTENT_PARITY-C05, W01-L2_CONTENT_PARITY-C06, W01-L2_CONTENT_PARITY-C07, W01-L2_CONTENT_PARITY-C08, W01-L2_CONTENT_PARITY-C09
- Planned outputs: BOARD_PREP_ASSET (4), DEMO_ARTIFACT (1), FACULTY_REVIEW_PACKET (1), LEARNER_COPY (3), SPONSOR_PACKET_ASSET (1)

### T03 W01 Learner UX

- Goal: This lane makes the study experience clearer and calmer for freeze the current truth baseline.
- Step window: W01-L3_LEARNER_UX-C01 -> W01-L3_LEARNER_UX-C10
- Tranche size: 10 planned changes
- Required files: `src/components/Home.tsx`, `src/components/PathologyCurriculum.tsx`, `src/components/ReferenceLibrary.tsx`, `src/components/CompetencyMatrix.tsx`
- Do not touch: `src/content/tutorials/tutorialAbpathSpecCrosswalk.json`, `reports/validated_mappings_manifest.json`
- Proof commands: `npm run didactics:ux:validate`, `npm run test -- src/components/Home.test.tsx src/components/PathologyCurriculum.test.tsx`, `git diff --check`
- Prerequisites: W01-L1_CP_TRUTH-C04, W01-L2_CONTENT_PARITY-C04, W01-L3_LEARNER_UX-C01, W01-L3_LEARNER_UX-C02, W01-L3_LEARNER_UX-C03, W01-L3_LEARNER_UX-C04, W01-L3_LEARNER_UX-C05, W01-L3_LEARNER_UX-C06, W01-L3_LEARNER_UX-C07, W01-L3_LEARNER_UX-C08, W01-L3_LEARNER_UX-C09
- Planned outputs: DEMO_ARTIFACT (2), FACULTY_REVIEW_PACKET (1), LEARNER_COPY (5), PRODUCT_POSITIONING_ASSET (1), SPONSOR_PACKET_ASSET (1)

### T04 W01 Workups and Routing

- Goal: This lane keeps workups and route behavior dependable for freeze the current truth baseline.
- Step window: W01-L4_WORKUPS_ROUTING-C01 -> W01-L4_WORKUPS_ROUTING-C10
- Tranche size: 10 planned changes
- Required files: `src/components/AlgorithmNavigator.tsx`, `src/utils/algorithmCatalog.ts`, `src/utils/algorithmNavigatorNavigation.ts`, `src/content/algorithms/algorithms.normalized.json`
- Do not touch: `src/content/tutorials/validatedMappingsManifest.json`, `scripts/validate_validated_mappings_manifest.cjs`
- Proof commands: `npm run didactics:ux:validate`, `npm run test -- src/utils/algorithmCatalog.test.ts src/utils/studyDestinationResolver.test.ts`, `git diff --check`
- Prerequisites: W01-L1_CP_TRUTH-C05, W01-L2_CONTENT_PARITY-C05, W01-L4_WORKUPS_ROUTING-C01, W01-L4_WORKUPS_ROUTING-C02, W01-L4_WORKUPS_ROUTING-C03, W01-L4_WORKUPS_ROUTING-C04, W01-L4_WORKUPS_ROUTING-C05, W01-L4_WORKUPS_ROUTING-C06, W01-L4_WORKUPS_ROUTING-C07, W01-L4_WORKUPS_ROUTING-C08, W01-L4_WORKUPS_ROUTING-C09
- Planned outputs: BOARD_PREP_ASSET (4), DEMO_ARTIFACT (2), FACULTY_REVIEW_PACKET (1), LEARNER_COPY (1), PRODUCT_POSITIONING_ASSET (1), SPONSOR_PACKET_ASSET (1)

### T05 W01 Contracts and Proof

- Goal: This lane turns the landed work into proof bundles and review-ready records for freeze the current truth baseline.
- Step window: W01-L5_CONTRACTS_VALIDATORS-C01 -> W01-L5_CONTRACTS_VALIDATORS-C10
- Tranche size: 10 planned changes
- Required files: `docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md`, `docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md`, `src/content/contracts/pthfndrDidacticsLearningUxContract.json`, `scripts/validate_didactics_learning_ux.cjs`
- Do not touch: `public/cp-studios`, `src/content/tutorials/clinicalPathInteractiveTutorials.json`
- Proof commands: `npm run didactics:ux:validate`, `npm run resource:contracts:validate`, `git diff --check`
- Prerequisites: W01-L1_CP_TRUTH-C06, W01-L2_CONTENT_PARITY-C06, W01-L3_LEARNER_UX-C06, W01-L4_WORKUPS_ROUTING-C06, W01-L5_CONTRACTS_VALIDATORS-C01, W01-L5_CONTRACTS_VALIDATORS-C02, W01-L5_CONTRACTS_VALIDATORS-C03, W01-L5_CONTRACTS_VALIDATORS-C04, W01-L5_CONTRACTS_VALIDATORS-C05, W01-L5_CONTRACTS_VALIDATORS-C06, W01-L5_CONTRACTS_VALIDATORS-C07, W01-L5_CONTRACTS_VALIDATORS-C08, W01-L5_CONTRACTS_VALIDATORS-C09
- Planned outputs: FACULTY_REVIEW_PACKET (5), MANUSCRIPT_ASSET (2), PRODUCT_POSITIONING_ASSET (1), SPONSOR_PACKET_ASSET (2)

### T06 W02 CP Truth

- Goal: This lane settles the reviewed CP and AP teaching truth for reconcile raw mappings with reviewed mappings.
- Step window: W02-L1_CP_TRUTH-C01 -> W02-L1_CP_TRUTH-C10
- Tranche size: 10 planned changes
- Required files: `src/content/tutorials/tutorialAbpathSpecCrosswalk.json`, `src/content/tutorials/validatedMappingsManifest.json`, `reports/validated_mappings_manifest.json`, `reports/cp_precision_governance_report.json`
- Do not touch: `src/components`, `src/hooks`, `public/cp-studios`
- Proof commands: `npm run cp:precision:validate`, `node scripts/validate_validated_mappings_manifest.cjs`, `git diff --check`
- Prerequisites: W01-L1_CP_TRUTH-C10, W02-L1_CP_TRUTH-C01, W02-L1_CP_TRUTH-C02, W02-L1_CP_TRUTH-C03, W02-L1_CP_TRUTH-C04, W02-L1_CP_TRUTH-C05, W02-L1_CP_TRUTH-C06, W02-L1_CP_TRUTH-C07, W02-L1_CP_TRUTH-C08, W02-L1_CP_TRUTH-C09
- Planned outputs: BOARD_PREP_ASSET (4), FACULTY_REVIEW_PACKET (3), LEARNER_COPY (1), PRODUCT_POSITIONING_ASSET (1), SPONSOR_PACKET_ASSET (1)

### T07 W02 Content Parity

- Goal: This lane brings the learner-facing content into line with the reviewed truth for reconcile raw mappings with reviewed mappings.
- Step window: W02-L2_CONTENT_PARITY-C01 -> W02-L2_CONTENT_PARITY-C10
- Tranche size: 10 planned changes
- Required files: `src/content/tutorials/clinicalPathInteractiveTutorials.json`, `src/content/curriculum/activeCurriculum.ts`, `src/utils/tutorialLibraryCatalog.ts`, `reports/content_consumption_journey_evaluation.json`
- Do not touch: `scripts/validate_didactics_learning_ux.cjs`, `src/components/AlgorithmNavigator.tsx`
- Proof commands: `npm run cp:precision:validate`, `npm run test -- src/utils/tutorialLibraryCatalog.test.ts`, `git diff --check`
- Prerequisites: W01-L2_CONTENT_PARITY-C10, W02-L1_CP_TRUTH-C04, W02-L2_CONTENT_PARITY-C01, W02-L2_CONTENT_PARITY-C02, W02-L2_CONTENT_PARITY-C03, W02-L2_CONTENT_PARITY-C04, W02-L2_CONTENT_PARITY-C05, W02-L2_CONTENT_PARITY-C06, W02-L2_CONTENT_PARITY-C07, W02-L2_CONTENT_PARITY-C08, W02-L2_CONTENT_PARITY-C09
- Planned outputs: BOARD_PREP_ASSET (4), DEMO_ARTIFACT (1), FACULTY_REVIEW_PACKET (1), LEARNER_COPY (3), SPONSOR_PACKET_ASSET (1)

### T08 W02 Learner UX

- Goal: This lane makes the study experience clearer and calmer for reconcile raw mappings with reviewed mappings.
- Step window: W02-L3_LEARNER_UX-C01 -> W02-L3_LEARNER_UX-C10
- Tranche size: 10 planned changes
- Required files: `src/components/Home.tsx`, `src/components/PathologyCurriculum.tsx`, `src/components/ReferenceLibrary.tsx`, `src/components/CompetencyMatrix.tsx`
- Do not touch: `src/content/tutorials/tutorialAbpathSpecCrosswalk.json`, `reports/validated_mappings_manifest.json`
- Proof commands: `npm run didactics:ux:validate`, `npm run test -- src/components/Home.test.tsx src/components/PathologyCurriculum.test.tsx`, `git diff --check`
- Prerequisites: W01-L3_LEARNER_UX-C10, W02-L1_CP_TRUTH-C04, W02-L2_CONTENT_PARITY-C04, W02-L3_LEARNER_UX-C01, W02-L3_LEARNER_UX-C02, W02-L3_LEARNER_UX-C03, W02-L3_LEARNER_UX-C04, W02-L3_LEARNER_UX-C05, W02-L3_LEARNER_UX-C06, W02-L3_LEARNER_UX-C07, W02-L3_LEARNER_UX-C08, W02-L3_LEARNER_UX-C09
- Planned outputs: DEMO_ARTIFACT (2), FACULTY_REVIEW_PACKET (1), LEARNER_COPY (5), PRODUCT_POSITIONING_ASSET (1), SPONSOR_PACKET_ASSET (1)

### T09 W02 Workups and Routing

- Goal: This lane keeps workups and route behavior dependable for reconcile raw mappings with reviewed mappings.
- Step window: W02-L4_WORKUPS_ROUTING-C01 -> W02-L4_WORKUPS_ROUTING-C10
- Tranche size: 10 planned changes
- Required files: `src/components/AlgorithmNavigator.tsx`, `src/utils/algorithmCatalog.ts`, `src/utils/algorithmNavigatorNavigation.ts`, `src/content/algorithms/algorithms.normalized.json`
- Do not touch: `src/content/tutorials/validatedMappingsManifest.json`, `scripts/validate_validated_mappings_manifest.cjs`
- Proof commands: `npm run didactics:ux:validate`, `npm run test -- src/utils/algorithmCatalog.test.ts src/utils/studyDestinationResolver.test.ts`, `git diff --check`
- Prerequisites: W01-L4_WORKUPS_ROUTING-C10, W02-L1_CP_TRUTH-C05, W02-L2_CONTENT_PARITY-C05, W02-L4_WORKUPS_ROUTING-C01, W02-L4_WORKUPS_ROUTING-C02, W02-L4_WORKUPS_ROUTING-C03, W02-L4_WORKUPS_ROUTING-C04, W02-L4_WORKUPS_ROUTING-C05, W02-L4_WORKUPS_ROUTING-C06, W02-L4_WORKUPS_ROUTING-C07, W02-L4_WORKUPS_ROUTING-C08, W02-L4_WORKUPS_ROUTING-C09
- Planned outputs: BOARD_PREP_ASSET (4), DEMO_ARTIFACT (2), FACULTY_REVIEW_PACKET (1), LEARNER_COPY (1), PRODUCT_POSITIONING_ASSET (1), SPONSOR_PACKET_ASSET (1)

### T10 W02 Contracts and Proof

- Goal: This lane turns the landed work into proof bundles and review-ready records for reconcile raw mappings with reviewed mappings.
- Step window: W02-L5_CONTRACTS_VALIDATORS-C01 -> W02-L5_CONTRACTS_VALIDATORS-C10
- Tranche size: 10 planned changes
- Required files: `docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md`, `docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md`, `src/content/contracts/pthfndrDidacticsLearningUxContract.json`, `scripts/validate_didactics_learning_ux.cjs`
- Do not touch: `public/cp-studios`, `src/content/tutorials/clinicalPathInteractiveTutorials.json`
- Proof commands: `npm run didactics:ux:validate`, `npm run resource:contracts:validate`, `git diff --check`
- Prerequisites: W01-L5_CONTRACTS_VALIDATORS-C10, W02-L1_CP_TRUTH-C06, W02-L2_CONTENT_PARITY-C06, W02-L3_LEARNER_UX-C06, W02-L4_WORKUPS_ROUTING-C06, W02-L5_CONTRACTS_VALIDATORS-C01, W02-L5_CONTRACTS_VALIDATORS-C02, W02-L5_CONTRACTS_VALIDATORS-C03, W02-L5_CONTRACTS_VALIDATORS-C04, W02-L5_CONTRACTS_VALIDATORS-C05, W02-L5_CONTRACTS_VALIDATORS-C06, W02-L5_CONTRACTS_VALIDATORS-C07, W02-L5_CONTRACTS_VALIDATORS-C08, W02-L5_CONTRACTS_VALIDATORS-C09
- Planned outputs: FACULTY_REVIEW_PACKET (5), MANUSCRIPT_ASSET (2), PRODUCT_POSITIONING_ASSET (1), SPONSOR_PACKET_ASSET (2)

## Implementation Closeout Standard

- End each tranche with lane proof commands, a bounded commit, and a merge-ready repo state packet.
- Do not open the next tranche until the current tranche is either committed or intentionally restored.
- If a tranche discovers cross-lane drift, stop and spawn a new tranche instead of widening scope in place.
