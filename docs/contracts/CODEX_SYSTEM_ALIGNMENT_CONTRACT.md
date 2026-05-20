# Codex System Alignment Contract

## Purpose

This contract captures the Codex-level operating expectations and user-specific personalizations that should remain durable inside Didactic Series.

The goal is not to restate every global Codex instruction.
The goal is to pin the system-level rules that materially affect how work should be executed in this repo.

## Imported System Contracts

Didactic Series already imports the following higher-order contracts and must keep obeying them:

- `/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/SKI-CORTEX/contracts/dirty_repo_negotiation_contract.md`
- `/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/SKI-CORTEX/contracts/openclaw_parallel_execution_contract.md`
- `/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/SKI-CORTEX/contracts/universal_cli_first_token_optimization_contract.md`
- `docs/contracts/SEMANTIC_DIRTINESS_SYNTHESIS_CONTRACT.md`
- `docs/contracts/CORPUS_REALIZATION_CONTRACT.md`

This contract is additive.
It does not replace those files.

## Dirty Repo Operating Rule

If the repo is dirty:

- start in OBSERVE mode
- classify and bound work before mutation
- do not widen scope into opportunistic cleanup
- keep edits tied to the active blocker or explicitly requested slice
- prefer serial validation for shared generated artifacts and validators

## Repo-Native Execution Rule

When the user says `proceed`, `implement`, or otherwise signals forward motion:

- continue into the next concrete repo slice
- prefer code, contracts, tests, validators, and generated artifacts over discussion-only notes
- keep the implementation narrow and local to this repo
- do not stop at a plan if the next executable step is clear

## Autonomous Execution Rule

When the user grants ongoing execution permission for a Didactic Series task:

- treat that permission as persistent authorization for directly related analysis, planning, implementation, validation, refinement, testing, documentation, export generation, cleanup, and artifact production
- continue through logically connected repo steps without repeatedly asking for `proceed`, `continue`, or equivalent confirmations
- prefer the next conservative non-destructive step automatically when uncertainty is low to moderate
- pause only for destructive actions, irreversible mutations, missing credentials or secrets, materially changed legal or risk posture, truly ambiguous branch decisions, required external approval, or policy-bound clarification
- when blocked, report the exact blocker and the minimum missing input needed to resume
- preserve deterministic CLI-first execution, auditability, rollback awareness, and proof-producing behavior while continuing autonomously

## Truth-First Content Rule

When pathology content, ABPath mappings, or governance anchors are involved:

- source/spec truth beats UI polish
- fix mis-anchored mappings before polishing labels
- prefer validated-manifest or governance-pending behavior over speculative promotion
- preserve durable provenance and review status for promoted teaching assets

## Public Text Rule

Rendered learner-facing text is a truth surface.

Therefore:

- treat visible copy as a governed contract surface
- avoid framework jargon, internal routing language, and vague labels on public pages
- make route labels, headings, and visible state agree
- update validators and contracts when a durable public rename is intentional

The governed `Workups` workspace label is allowed only when it truthfully names the diagnostic-workup lane.
Do not reuse `Workups` as a generic CTA, teaser label, or fallback public route hint.

## Evidence-First Status Rule

When answering what remains, what changed, or what the next blocker is:

- answer from current repo artifacts, validators, reports, and contracts first
- do not guess from memory when local evidence exists
- distinguish green gates from unresolved drift or dirty-state noise

## Validation Rule

For shared generators and validators:

- validate serially when outputs are shared
- do not trust parallel generator/validator results against changing artifacts
- prefer the narrowest lane-relevant verification first
- if a validator fails, identify whether the problem is a true product drift, a stale test expectation, or a validator bug

## OpenClaw Execution Rule

If OpenClaw is used for Didactic Series work:

- treat OpenClaw as a local execution surface, not as the canonical truth owner
- keep Codex as the repo mutation, validation, and integration authority unless explicitly reassigned
- use OpenClaw only for bounded subtasks or local interactive execution where the acceptance surface is already defined
- check runtime health before trusting an OpenClaw lane
- do not accept unstaged or unvalidated OpenClaw output as final repo truth
- preserve proof, validation, and fallback behavior when OpenClaw is unavailable or unhealthy

## Parallel Lane Rule

When Codex and OpenClaw are both active against Didactic Series:

- assign explicit file ownership per lane before mutation
- keep Codex as the merge, contract, validator, and promotion authority
- use OpenClaw only for bounded subtasks with a named acceptance surface
- do not allow overlapping writes without an explicit integrator pass
- prefer delta correction over full regeneration when only one artifact surface fails

## CLI-First Rule

When both terminal proof and browser-like automation are possible:

- use CLI discovery and validation first
- use browser or local automation only for last-mile interaction or UX confirmation
- avoid browser-first exploration when repo evidence can answer the question

## Long-Running Artifact Rule

If a review, journey analysis, or governance plan is meant to stay useful as the repo evolves:

- keep it as a maintained repo artifact
- pair it with update and verification scaffolding where feasible
- avoid one-off memo behavior when the repo already has a contract or report surface for that concern

## Final Rule

Codex work in Didactic Series should be:

- truth-first
- contract-aware
- validator-backed
- narrow in scope
- autonomous when direction is already clear
- forward-moving when direction is clear

If these priorities conflict, prefer repo truth and reversible execution over speed.
