# Corpus Realization Contract

## Purpose
This contract governs how Didactic Series uses the workstation corpus as its primary source of truth for enrichment.

The goal is to realize local materials into governed didactics assets without defaulting to ad hoc web search.

## Core Rule
Prefer local corpus evidence first.

The repo should consume SKI-CORTEX-produced manifests, indexes, and capsules before searching online.

Online search is a gap-filler only when:
- no local asset exists
- the local asset is stale
- provenance is missing
- the topic requires an updated external standard

## Required Workflow
Every corpus-realization run should follow this order:
1. inventory local workstation materials
2. build or refresh a corpus manifest
3. index the corpus locally
4. map assets to Didactic Series targets
5. preserve provenance and review status
6. promote only after human review

## Required Outputs
Corpus realization should produce local, reviewable artifacts such as:
- corpus manifest
- local-first index
- didactics asset registry
- enrichment queue or report

## Promotion Rule
Generated mappings are not teaching truth.

Every generated mapping remains `unreviewed` until explicitly promoted.

Promotion should be visible and durable, with source path, mapping rationale, and destination recorded.

## Governance Rules
- treat the workstation corpus as the primary source of truth
- preserve provenance for every reused item
- surface duplicates, gaps, and missing destinations
- do not overwrite reviewed teaching assets with unreviewed generated output
- keep the contract local to Didactic Series and do not embed SKI-CORTEX engine logic here
- the regulated image vault is the external-disk corpus at `/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/Didactic_Series`; consume it through the generated manifest, index, asset registry, and realization report
- feed the learning loop back through the context-weaver and reasoning ledger so reviewed promotions, rejected matches, and provenance gaps stay durable and auditable

## Final Rule
Didactic Series may enrich from the workstation corpus first, but only reviewed material may become authoritative curriculum content.
