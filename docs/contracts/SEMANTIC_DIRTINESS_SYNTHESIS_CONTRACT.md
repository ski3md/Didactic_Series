# Semantic Dirtiness Synthesis Contract

## Purpose
This contract governs how dirty Didactic Series repository state is converted into a concise, reviewable, non-mutating cleanup intelligence artifact.
The goal is not to clean the repository automatically.
The goal is to make repository dirtiness understandable, classifiable, reviewable, reversible, and safe.

## Core Principle
Raw dirty state is not an action plan.
Every dirty file must pass through semantic synthesis before any cleanup, restore, staging, deletion, or mutation is allowed.

## Authority Model
### Observe Authority
Allowed:
- read git status
- read file metadata
- classify changed paths
- group related files
- estimate risk
- generate reports
- generate proposed commands

Forbidden:
- delete files
- restore files
- stage files
- commit files
- run git clean
- run git checkout
- rewrite source
- modify configuration
- mutate generated truth artifacts

### Plan Authority
Allowed:
- produce cleanup_summary.md
- produce cleanup_plan.json
- produce proposed_actions.md
- produce rollback_matrix.md
- produce risk_heatmap.json
- label actions as SAFE, REVIEW, DANGEROUS, or BLOCKED

Forbidden:
- executing proposed cleanup
- assuming generated means disposable
- downgrading high-risk files without evidence
- suppressing unknown files

### Apply Authority
Apply mode is forbidden unless a reviewed cleanup_plan.json exists.
Apply mode may only operate on entries labeled SAFE.
Apply mode must never touch:
- source files
- components
- hooks
- lecture and syllabus source material
- package manifests
- lockfiles
- build outputs
- image annotation outputs
- unknown files

## Required Buckets
Every dirty path must be assigned exactly one bucket:
1. SAFE_GENERATED_ARTIFACT
2. RUNTIME_CACHE_OR_LOG
3. REVIEW_NEEDED_SOURCE_CHANGE
4. CONFIG_OR_DEPENDENCY_CHANGE
5. GOVERNANCE_OR_CONTRACT_CHANGE
6. SECURITY_OR_AUTH_CHANGE
7. RUNTIME_BOUNDARY_CHANGE
8. SKI_BOT_OR_AGENT_CORE_CHANGE
9. UNKNOWN
10. BLOCKED_HIGH_RISK

## Didactic-specific policy anchors
- `dist/` and `assets/` are generated build artifacts.
- `annotated_images/` is generated annotation output.
- `.playwright-mcp/` and `node_modules/` are runtime/cache surfaces.
- `docs/` contains editorial source and contract material.
- `components/`, `hooks/`, `App.tsx`, and `index.tsx` are source surfaces and require review before mutation.
- `LICENSE`, `README.md`, and roadmap files are repository truth, not disposable cleanup.

## Risk Labels
Each proposed action must receive one risk label:
### SAFE
Read-only verification or cleanup of clearly disposable generated artifacts.
### REVIEW
Potentially valid work product requiring human review before mutation.
### DANGEROUS
Action could destroy meaningful work, alter runtime behavior, or impair provenance.
### BLOCKED
Action is forbidden under dirty-repo conditions.

## Final Rule
The system may make the repo understandable.
It may not make the repo clean until a reviewed, bounded, reversible, SAFE-only apply plan exists.
