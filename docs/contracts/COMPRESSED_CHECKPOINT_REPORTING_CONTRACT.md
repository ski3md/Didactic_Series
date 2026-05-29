# Compressed Checkpoint Reporting Contract

## Purpose

This contract makes concise checkpoint reporting durable for Didactic Series work.

It exists because verbose tool-by-tool narration is token-heavy and usually does not improve decision quality.

## Scope

This contract applies to:

- progress updates during a task
- status checks
- workflow polling
- closeouts
- repeated `proceed` turns inside an established tranche

It does not replace required repo-state, validation, promotion, or merge-path closeout sections.
It compresses how those sections are populated.

## Default Reporting Rule

Report decision state, not command narration.

Use this compact checkpoint shape:

```text
CHECKPOINT:
- tranche:
- completed:
- proof:
- commit:
- workflow:
- blocker:
- next:
```

Omit fields that are not relevant.

## Progress Update Rule

During execution, send updates only when one of these changes:

- tranche state changes
- validation passes or fails
- commit or push succeeds
- workflow status changes
- blocker appears
- repo state becomes dirty, conflicted, or uncertain

Do not narrate routine preflight, staging, sleep, polling, or generator commands unless their output changes the decision state.

## Workflow Polling Rule

When waiting for GitHub workflows:

- say which workflows are pending once
- do not repeat sleep/poll status unless a workflow changes state
- final report must name pass/fail status for Security, Pages, and Push
- if a workflow fails, report the failing workflow URL and the first actionable failure cause

## Proceed Turn Rule

When the user says `proceed` inside an established lane:

- continue the next safe bounded tranche
- do not restate the roadmap
- do not narrate intent before every command
- produce a checkpoint only after meaningful state changes

## Closeout Compression Rule

Final closeout must remain contract-compliant, but concise.

Required closeout content:

- repo state
- promotion state
- terminal status
- proof commands and status
- merge path
- guardrails
- next safe action
- recommendation

Avoid:

- tool-by-tool chronology
- duplicate command descriptions
- repeated workflow polling text
- implementation mechanics that are not evidence or a remaining decision

## Failure Reporting Rule

If something fails, report in this compact form:

```text
ISSUE:
RECOGNIZED FAILURE TYPE:
EVIDENCE:
CURRENT STATUS:
NEXT SAFE ACTION:
```

Do not use vague labels such as `weird`, `tooling issue`, or `looks stuck`.

## Persistence Rule

This contract must remain imported by repo operating docs so future agents inherit it.

Required import surfaces:

- `AGENTS.md`
- `docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md`

If either surface is rewritten, preserve this contract import.
