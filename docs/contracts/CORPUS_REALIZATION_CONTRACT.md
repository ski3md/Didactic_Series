# Corpus Realization Contract

## Purpose
This contract governs how Didactic Series uses the workstation corpus as its primary source of truth for enrichment.

The goal is to realize local materials into governed didactics assets without defaulting to ad hoc web search.

After ABPath coverage evaluation, this contract also governs Curriculum Realization Mode: systematic gap closure until ABPath AP/CP specifications, required images, required MCQs, worked examples, and learner navigation requirements are satisfied.

## Core Rule
Prefer local corpus evidence first.

The repo should consume SKI-CORTEX-produced manifests, indexes, and capsules before searching online.

The system must never immediately crawl the internet.

Online search is a gap-filler only when:
- no local asset exists
- the local asset is stale
- provenance is missing
- the topic requires an updated external standard
- all cheaper/local acquisition tiers have been attempted or intentionally skipped with written rationale

## Local Data Infrastructure Registry

Before creating new curriculum material, rebuilding a corpus from scratch, or searching online, the agent must check the local data infrastructure that is already attached to this workstation.

Authoritative local lookup order:

1. System architecture inventory: `/Users/ski_mini/SystemArchitectureInventory`.
   - Use the latest `SYSTEM_SOURCE_OF_TRUTH.md` and `system_inventory.json` as the machine-level map for storage, GitHub roots, local tools, Ollama, Python, and repo inventory before manually rediscovering paths.
2. Didactic Series repo-local content: checked-in curriculum, generated manifests, asset registries, topic maps, contract outputs, and review queues.
3. Primary external HD: `/Volumes/DB_External`.
   - High-value subroots include `/Volumes/DB_External/Runtime`, `/Volumes/DB_External/Knowledge`, `/Volumes/DB_External/Datasets`, `/Volumes/DB_External/ExternalOffice`, `/Volumes/DB_External/ProjectArtifacts`, `/Volumes/DB_External/Archives`, and `/Volumes/DB_External/Ollama`.
4. Secondary external HD / cold corpus: `/Volumes/Elements`.
   - High-value subroots include `/Volumes/Elements/Projects`, `/Volumes/Elements/Archive`, `/Volumes/Elements/Backups`, `/Volumes/Elements/Incoming_Unsorted`, `/Volumes/Elements/To_Classify`, `/Volumes/Elements/Cold_Repos`, and `/Volumes/Elements/Ontology_Theory`.
5. NAS/network mounts: discover from the system architecture inventory and currently mounted volumes with `/Volumes`, `mount`, or `df`; use an operator-provided NAS path when supplied.
   - Do not assume a NAS path.
   - Do not mount, unmount, sync, delete, or reorganize NAS content without explicit operator approval.
   - If no NAS is visible, record `nas_unavailable` and continue with repo-local and external-HD tiers.
6. Previously indexed local knowledge base: SKI-CORTEX manifests, local indexes, semantic-governance reports, reasoning ledgers, topic graphs, flashcard repositories, prior generated content, and governed capsules.

Every realization, gap-closure, or enrichment run must record local infrastructure search evidence before new generation or web acquisition.

Minimum evidence fields:

- `infrastructure_tier_attempted`
- `path_checked`
- `mounted`
- `result_count`
- `gap_status`
- `skip_rationale`

If an existing local evidence packet, manifest, checkpoint, capsule, image inventory, or topic map already answers the need, the agent must reference it instead of recreating it.

## Knowledge Acquisition Hierarchy

Every coverage, gap-closure, crawler, generator, or enrichment run must follow this source order:

1. Existing curriculum content: current lectures, slide decks, PDFs, notes, flashcards, question banks, tutorials, workups, image references, and reviewed didactics assets.
2. Local hard-drive corpus: PowerPoint, PDF, DOCX, TXT, Markdown, HTML, CSV, JSON, images, video transcripts, audio transcripts, NAS paths, external drives, research directories, board-prep directories, WHO archives, Oakstone exports, PathPresenter exports, and personal notes.
3. Previously indexed local knowledge base: SKI-CORTEX manifests, local indexes, asset registries, reasoning ledgers, topic graphs, flashcard repositories, prior generated content, and governed capsules.
4. Internal ontology/library: entity database, ABPath topic graph, morphology/immunophenotype graph, diagnostic algorithms, WHO/CAP/AJCC local crosswalks, and internal terminology normalization.
5. Open-access online sources: NCBI Bookshelf, PubMed, CDC, NIH, WHO public materials, CAP public materials, ASCP educational resources, Pathology Outlines, LibreTexts, and other openly accessible sources with provenance.
6. Licensed sources: WHO Blue Books, ExpertPath, UpToDate, Oakstone, StatDx, RadPrimer, PathPresenter, or other licensed resources only when license/access is available and use is permitted.
7. Human escalation: create a content request when no adequate source can be found or when promotion requires expert review.

Skipping a tier requires an explicit `tier_skip_rationale`.

## Required Corpus Workflow
Every corpus-realization run should follow this order before online acquisition:
1. inventory local workstation materials
2. build or refresh a corpus manifest
3. index the corpus locally
4. map assets to Didactic Series targets
5. preserve provenance and review status
6. promote only after human review

## ABPath Coverage Evaluation Phase

Before gap closure, produce or refresh a Coverage Matrix that scores:

- full ABPath AP/CP mapping
- content coverage
- image coverage
- MCQ coverage
- worked-example coverage
- UX/navigation coverage

Coverage scoring must remain machine-readable and must not promote generated findings as teaching truth.

## Gap Inventory Phase

Create a machine-readable gap inventory for every missing or under-realized ABPath topic.

Required fields:

- `gap_id`
- `abpath_section`
- `abpath_topic`
- `current_status`
- `severity`
- `educational_artifact_needed`
- `estimated_tokens`
- `estimated_images`
- `estimated_mcqs`
- `estimated_effort`
- `source_tier_attempted`
- `tier_skip_rationale`
- `review_status`
- `promotion_status`

Gap severities should support at least `critical`, `major`, `minor`, and `superseded`.

## Curriculum Realization Objective

The system must compute:

- Current Coverage
- Desired Coverage
- Coverage Deficit
- Aspirational State

The aspirational state is complete board-certification-grade pathology curriculum coverage across:

- 100% ABPath AP
- 100% ABPath CP
- Molecular integration
- WHO integration
- CAP integration
- AJCC integration
- Image library
- MCQ bank
- Worked-example bank
- Diagnostic algorithms
- Clinical correlation

The objective is a resident-facing curriculum that can support board preparation without requiring external resources, while preserving provenance, review status, and escalation boundaries.

## Standard Gap-Closure Artifacts

Every discovered gap must be filled, queued, or escalated with standardized artifacts.

Lecture modules require:

- Definition
- Epidemiology
- Clinical Presentation
- Gross
- Histology
- Cytology
- IHC
- Molecular
- Differential
- Pitfalls
- Management
- Prognosis

Image modules require:

- Gross
- Low Power
- Medium Power
- High Power

Image modules should also include cytology, IHC, or molecular diagrams when applicable.

MCQ modules require at least 5 board-style questions per topic. Advanced topics should target 10-20 questions when scope and source evidence support it.

Worked-example modules are required for Clinical Chemistry, Coagulation, Statistics, Informatics, Molecular Diagnostics, Transfusion Medicine, Lab Management, Physiology, and Biochemistry.

Worked examples must include:

- Formula
- Variables
- Units
- Calculation
- Interpretation
- Pitfalls

## Quality Validation

Every generated or realized artifact must be reviewed against:

- Accuracy: WHO, ICC, CAP, AJCC, ABPath, and local source provenance when applicable.
- Educational utility: board preparation and resident learning value.
- Diagnostic utility: differential diagnosis, workup, and report-level consequence.
- Visual utility: image usefulness for recognition, comparison, and diagnostic calibration.

Unreviewed generated artifacts remain `review-queue` material and must not be labeled as authoritative teaching truth.

## Curriculum Thermodynamics Engine

Gap-closure reports should calculate:

- Coverage = covered_topics / total_topics
- Depth = present_elements / required_elements
- Image Density = images_present / images_required
- Question Density = mcqs_present / mcqs_required
- Worked Example Density = examples_present / examples_required

Educational Entropy should be represented as a weighted deficit summary:

Educational Entropy =

- Missing Content
- Missing Images
- Missing MCQs
- Missing Examples
- Navigation Friction

Goal: Educational Entropy approaches zero.

Clinical Competency Realization Score (CCRS) should be computed when required inputs are available:

CCRS =

- 0.30 Coverage
- 0.20 Depth
- 0.15 Image Adequacy
- 0.15 MCQ Adequacy
- 0.10 Worked Examples
- 0.10 Retrieval Speed

## Autonomous Continuation

After each realization run, generate or refresh `next_100_highest_priority_topics`.

No topic may be skipped. A topic may only be:

- realized
- queued
- superseded with rationale
- blocked with source/risk rationale
- escalated to human review

## Completion Criteria

The curriculum is complete only when:

- ABPath Coverage = 100%
- Required Images = 100%
- Required MCQs = 100%
- Required Worked Examples = 100%
- Critical Gaps = 0
- Major Gaps = 0
- Educational Entropy approaches zero

## Required Outputs
Corpus realization should produce local, reviewable artifacts such as:
- corpus manifest
- local-first index
- didactics asset registry
- enrichment queue or report
- Coverage Matrix
- Gap Inventory
- Curriculum Realization Objective
- Curriculum Thermodynamics report
- `next_100_highest_priority_topics`
- content requests for human escalation

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
