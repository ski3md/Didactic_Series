# LLM Handoff Instructions

Last updated: 2026-05-14

Use this file as the first-stop instruction set when a future LLM resumes work in this repository.

## Operating Rules

1. Start by reading `README.md`, this file, and `git status --short --branch`.
2. Treat existing uncommitted changes as user work. Do not revert or overwrite them unless the user explicitly asks.
3. Prefer the active Vite app under `src/`. The root-level `App.tsx`, `components/`, and older image-manifest scripts are legacy surfaces unless the requested task clearly targets them.
4. Keep content promotion routed through registries, view-model utilities, and normalized content files. Do not mutate raw imported JSON as a shortcut.
5. For images, preserve provenance and rights metadata. Do not copy copyrighted app-bundle image binaries into the repo without a licensed export or explicit written permission.
6. Use `rg`/`rg --files` for repository search and keep edits closely scoped.

## Current Product Direction

This repo is `P@thfndr`, a React/TypeScript/Vite pathology education platform. It is no longer just a granulomatous lung teaching module. The current direction is a reusable pathology learning shell with:

- active curriculum navigation
- didactic lectures and tutorials
- syllabus exploration
- image-backed sign-out simulation workflows
- breast, GU, neuropathology, and broader specialty case expansion

The active roadmap is in:

- `NEXT_100_ACTIVE_APP_STEPS.md`
- `CURRENT_STATE_MASTER_ROADMAP.md`
- `src/content/planning/tranche_6_active_tutorials_syllabus_execution_report.md`
- `BREAST_SIGNOUT_GAME_SWOT_EVALUATION.md`

The most recent completed roadmap tranche added active-app tutorial and syllabus shells. The next architectural gap called out in the planning docs is algorithm-specific routing plus continued sign-out simulation refinement.

## Dirty Worktree At Handoff

As of this handoff, `main` has uncommitted changes. Preserve them.

Modified tracked files:

- `package.json`
- `src/components/BreastSignoutMasterclass.tsx`
- `src/components/GUSignOutSims.tsx`
- `src/content/signout_sims/jh_neuro_atlas_deconstruction.json`

Untracked files:

- `scripts/crawl_entity_histology_images.cjs`
- `scripts/import_jh_neuro_atlas_metadata.cjs`
- `src/content/images/entity_histology_webcrawl_candidates.json`
- `src/content/images/entity_histology_webcrawl_pmc_gap_candidates.json`
- `src/content/images/entity_histology_webcrawl_pmc_gap_seeds.json`
- `src/content/images/entity_histology_webcrawl_seeds.json`
- `src/content/neuro/`

## What Was Being Built

### 1. Sign-out simulation UX

`src/components/BreastSignoutMasterclass.tsx` and `src/components/GUSignOutSims.tsx` were changed from defaulting immediately into the first case to using directory-first navigation:

- learners first land on a case directory
- selecting a case opens the case workspace
- back buttons return to specialty or case directories
- case state resets on open/back
- breast cases now use panels for `Evidence`, `Reasoning`, `Report`, and `Checklist`

When resuming, verify these UI changes compile and make sense in the browser. Watch for state assumptions where code previously expected `selectedCase` to always exist.

### 2. Johns Hopkins Neuro Atlas metadata import

`scripts/import_jh_neuro_atlas_metadata.cjs` imports local metadata from:

`/Applications/JH Neuro Atlas.app/Wrapper/JHNeuroAtlas.app/neuro_atlas_db_v021_en.db`

It writes:

- `src/content/neuro/jh_neuro_atlas_entity_manifest.json`
- `src/content/neuro/jh_neuro_atlas_entity_manifest.summary.json`

The summary currently reports:

- 179 diagnoses
- 894 images
- 56 features
- 100 quiz questions
- 9 diagnosis nodes
- 16 feature nodes
- 145 stains
- 10 modalities
- 103 entities with images
- 57 entities with questions

Important policy: this import mirrors metadata for local curriculum mapping only. It must not copy licensed JH app image binaries into this repo.

### 3. Entity histology web crawling

`scripts/crawl_entity_histology_images.cjs` crawls candidate histology images for entity names from the Stainbrain-derived service content. It can search Wikimedia Commons and PMC Open Access, score candidates, and write review manifests under `src/content/images/`.

Current generated manifests include both broad candidates and a smaller PMC-gap run. Treat these as review queues, not approved assets.

Likely commands:

```bash
npm run images:crawl-entity-histology -- --dry-run
npm run images:crawl-entity-histology -- --sources=pmc --output-prefix=pmc_gap
```

Network access may be required for live crawls. Candidate records still need pathologist review and license review before promotion.

## Added Package Scripts

`package.json` currently adds:

```json
"images:crawl-entity-histology": "node scripts/crawl_entity_histology_images.cjs",
"neuro:import-jh-atlas-metadata": "node scripts/import_jh_neuro_atlas_metadata.cjs"
```

Before committing, confirm `package-lock.json` does not need an update. These script-only changes usually do not require lockfile churn.

## Validation Checklist

Run these before considering the current work done:

```bash
npm run build
npm run test
npm run signout:validate-sims
npm run signout:validate-ux
```

For image/content pipeline changes, also run the relevant subset:

```bash
npm run images:validate-local
npm run images:validate-rendered
npm run neuro:import-jh-atlas-metadata
```

If `sqlite3` is missing or the JH app is not installed at the expected path, the neuro import cannot run on that machine. Document that as an environment limitation rather than changing the import contract.

## Likely Next Steps

1. Compile-check the current dirty worktree and fix any TypeScript issues caused by nullable `selectedCase`.
2. Browser-check the sign-out directory flows: breast, GU, and each specialty that uses `GUSignOutSims`.
3. Add or update focused tests for directory-first navigation and case reset behavior.
4. Decide whether generated webcrawl manifests should be committed now or reduced to smaller seed/review files.
5. Wire approved neuro metadata into a learner-facing neuropathology atlas/sign-out surface only after confirming the rights policy and UX target.
6. Continue the roadmap gap from tranche 6: algorithm-specific routing in the active `src/` app.

## Quality Bar

- Do not add a marketing landing page when building app functionality.
- Keep sign-out simulation experiences slide/evidence-first and workflow-oriented: observation, differential, ancillary choice, report language, checklist.
- Keep visual assets inspectable and attributable. Avoid vague placeholders where pathology learning depends on actual visual evidence.
- Keep generated content clearly marked as generated, staged, or needing review until promoted.
