# Repo Hygiene Architecture

## Purpose

This document defines the long-term storage boundaries for Didactic Series after the preservation checkpoint.

The goal is not merely a clean `git status`. The goal is a repo that stays durable, reproducible, and low-noise while preserving meaningful product and governance work.

## Storage Classes

### 1. Canonical tracked artifact

Keep tracked when the file is primary truth for:
- application behavior
- public didactics content
- governance contracts
- fixtures and tests
- validator/runtime truth

Examples:
- `src/`
- required `public/` learner-facing assets
- `docs/contracts/`
- tracked manifests used directly by runtime or validators

### 2. Generated tracked artifact

Keep tracked when the file is generated, but currently serves as authoritative or expensive-to-recreate truth.

Requirements:
- regeneration source is identifiable
- consumer is identifiable
- replacement/removal would require a deliberate migration

Examples:
- validated mappings manifest
- CP governance reports
- provenance manifests used by drift validation

### 3. Release artifact

Do not track in the main repo flow. Generate on demand for deployment or release packaging.

Examples:
- `dist/`
- deployment bundles
- preview outputs

### 4. Ignored local-only artifact

Do not track when the file is machine-local, session-local, or operational scratch state.

Examples:
- `.cortex/`
- local proof bundles
- session notes
- runtime caches
- temporary screenshots
- perf traces

### 5. Archived proof bundle

Do not keep in normal tracked flow unless explicitly needed for historical or compliance reasons. Store separately or under a deliberate archival workflow.

Examples:
- one-off troubleshooting proof
- migration negotiation bundles
- transient audit captures

## Prospective Clutter Policy

Track:
- canonical source
- public assets
- contracts
- fixtures
- validator/runtime truth
- expensive generated outputs that still function as real system truth

Prefer to ignore or relocate:
- recurring logs
- caches
- temp files
- screenshots
- perf outputs
- machine-specific runtime state
- duplicate generated PDFs
- duplicate generated reports where one authoritative source plus regeneration is enough

## Decision Rules

Before adding a generated artifact to git, answer:

1. Is it currently consumed by runtime or validators?
2. Is it expensive enough to recreate that losing it would waste substantial work?
3. Does it encode meaningful governance or review state not captured elsewhere?
4. Is there already another tracked source of truth that makes this file redundant?

If the answer is:
- `yes` to 1, 2, or 3, it may stay tracked for now
- `yes` to 4, it should usually become regenerate-on-demand or local-only

## Next Cleanup Targets

### Local-only by default
- `.cortex/`
- future planning/proof/session folders

### Review for future regeneration
- large provenance outputs
- duplicate report mirrors
- generated CSV/Markdown views that can be derived from tracked JSON authority

### Keep stable unless a replacement path exists
- runtime-facing public teaching assets
- validator-backed governance manifests

## Enforcement Direction

Future cleanup passes should:
- add ignore rules before local clutter spreads
- preserve one authoritative generated artifact per governed truth surface
- replace duplicate tracked derivatives with regeneration commands where safe
- never remove a tracked generated artifact until its source-of-truth and verification path are explicit
