# Lecture Content Migration Strategy

## Goal

Consolidate lecture-bearing educational content from pertinent repositories under `/Users/skim4/Documents/GitHub` into `/Users/skim4/Downloads/Didactic_Series` without importing unnecessary build artifacts, generated noise, or backend-only dependencies.

## Current Target State

Target repo: `/Users/skim4/Downloads/Didactic_Series`

- Current app is a Vite + React + TypeScript pathology module focused on granulomatous lung disease.
- Existing educational assets are mostly image-driven:
  - `src/data/caseMetadataRules.json`
  - `assets/images/granulomas/image_sources.json`
  - `src/assets/images/granulomas/...`
- The app imports `src/assets/data/image_manifest.json`, but that file is currently missing in the target tree.
- The target does not yet contain a normalized lecture/tutorial/syllabus content layer.

## Pertinent Source Repositories

### Tier 1: Structured lecture/tutorial sources

1. `/Users/skim4/Documents/GitHub/stainbrain printable`
- Primary lecture payload:
  - `public/data/lectures.json` with 2 lecture objects
  - `public/data/algorithms.json` with 2 diagnostic algorithm objects
  - `public/data/network.json` with 433 nodes, 56 links, 219 extended entries
- This is the cleanest structured lecture source discovered.
- Frontend dependency profile:
  - React 19, Vite 6, `react-markdown`, `remark-gfm`, `d3`, `dexie`, `zustand`, `lucide-react`, `uuid`

2. `/Users/skim4/Documents/GitHub/board_prep`
- Primary content payload:
  - `frontend/public/data/content_data.json` with 190 topic tutorial objects
  - `frontend/public/data/ap_spec.json` with 76 syllabus tree nodes
  - `data/parsed_syllabus.json` with 6698 parsed syllabus topics
  - `data/nested_specs/*.json` and `data/*.txt` as source syllabus material
- This is the richest source for tutorial, MCQ, flashcard, and syllabus-aligned study content.
- Important caution:
  - `runs/` is 1.9G and should be treated as raw generation output, not first-pass migration content.
- Dependency profile is much heavier than the target:
  - Frontend adds `react-markdown`, `remark-gfm`, `openseadragon`, `@tanstack/react-query`, `zustand`, `framer-motion`, `supabase`, etc.
  - Backend brings a large FastAPI stack and should not be merged unless live parsing APIs are required.

3. `/Users/skim4/Documents/GitHub/syllabus`
- Primary syllabus payload:
  - `data/ap_spec.txt`
  - `data/cp_spec.txt`
  - `data/parsed_topics.json`
  - `data/parsed_topics_v3.json` with 3863 topic objects
- This is the best clean source for canonical parsed syllabus topic metadata.
- Use this as the authoritative syllabus source unless board-specific expansions from `board_prep` are explicitly needed.

### Tier 2: Lineage/reference sources

4. `/Users/skim4/Documents/GitHub/FellowshipWorkflows/Didactic_Series`
- Appears to be an earlier lineage copy of the current target.
- Useful for provenance and diffing, not a primary source of new lecture payload.

5. `/Users/skim4/Documents/GitHub/pathology-learning-module_-granulomatous-diseases`
- Likely another related Vite pathology module lineage.
- Use for component comparison or recovery, not as the main lecture source.

## Recommended Destination Layout

Create a normalized content layer inside the target repo:

```text
src/content/
  lectures/
    lectures.raw.json
    lectures.normalized.json
  tutorials/
    board_prep_tutorials.raw.json
    tutorials.normalized.json
  syllabus/
    parsed_topics_v3.raw.json
    parsed_syllabus.raw.json
    syllabus.normalized.json
  algorithms/
    algorithms.raw.json
  network/
    network.raw.json
  provenance/
    source_manifest.json
```

Keep raw source snapshots separate from normalized files so future re-imports are deterministic and diffable.

## Canonical Content Model

Normalize all imported educational units to a shared envelope:

```json
{
  "id": "stable-content-id",
  "sourceRepo": "board_prep | stainbrain-printable | syllabus",
  "sourcePath": "absolute-or-relative-source-path",
  "contentType": "lecture | tutorial | algorithm | syllabus-topic",
  "title": "string",
  "category": "string",
  "summary": "string",
  "body": "markdown or structured rich text",
  "learningObjectives": [],
  "slides": [],
  "mcqs": [],
  "flashcards": [],
  "references": [],
  "tags": [],
  "provenance": {}
}
```

## Migration Sequence

### Phase 1: Freeze and inventory

- Do not copy `node_modules`, `dist`, `build`, `.next`, `venv`, or `runs/`.
- Record exact source files and hashes in `src/content/provenance/source_manifest.json`.
- Treat `stainbrain printable`, `board_prep`, and `syllabus` as the only initial import set.

### Phase 2: Pull raw content snapshots

- Copy these files first:
  - `stainbrain printable/public/data/lectures.json`
  - `stainbrain printable/public/data/algorithms.json`
  - `stainbrain printable/public/data/network.json`
  - `board_prep/frontend/public/data/content_data.json`
  - `board_prep/frontend/public/data/ap_spec.json`
  - `board_prep/data/parsed_syllabus.json`
  - `syllabus/data/parsed_topics_v3.json`
  - `syllabus/data/ap_spec.txt`
  - `syllabus/data/cp_spec.txt`

### Phase 3: Normalize by source

- `stainbrain printable`
  - Preserve `slides`, `transcript`, `entityCards`, and algorithm nodes.
  - Convert markdown slide content into the target app’s renderable format.
  - Keep `network.json` separate until the visualization layer is ready.

- `board_prep`
  - Convert each item in `content_data.json` into a normalized tutorial record.
  - Map:
    - `topic` -> `title`
    - `tutorial.content` -> `body`
    - `mcqs` -> `mcqs`
    - `flashcards` -> `flashcards`
  - Do not import `runs/` until there is a clear requirement for generated production artifacts.

- `syllabus`
  - Normalize parsed topics into a searchable topic index.
  - Prefer `parsed_topics_v3.json` over ad hoc text parsing during the first migration.

### Phase 4: Wire content into the app

- Add a dedicated content registry module in the target app that loads normalized JSON.
- Introduce route or section-level separation:
  - `Lectures`
  - `Tutorials`
  - `Syllabus`
  - `Algorithms`
- Keep the current granuloma image experience intact and additive.

### Phase 5: Resolve dependency gaps

Only add dependencies if the imported UI needs them:

- Required soon:
  - `react-markdown`
  - `remark-gfm`

- Likely required if network/algorithm visualizations are rendered:
  - `d3`
  - `zustand`
  - `uuid`

- Probably not required for first-pass content import:
  - `dexie`
  - `supabase`
  - full `board_prep` backend stack
  - `syllabus` backend stack

## Dependency Consolidation Strategy

Target baseline now:
- React 18
- Vite 4
- TypeScript 5
- `@google/genai`
- `openseadragon`

Source mismatch risks:
- `stainbrain printable` and `pathology-learning-module_-granulomatous-diseases` use React 19 / Vite 6.
- `FellowshipWorkflows/Didactic_Series` uses `@google/generative-ai` while target uses `@google/genai`.
- `board_prep` frontend mixes a much broader component/runtime surface than the target currently has.

Recommendation:
- Migrate content first.
- Upgrade framework/runtime only if the imported UI components must be reused directly.
- Do not merge backend dependencies into the target unless live syllabus parsing is a hard requirement.

## Exclusions

Exclude from initial pull:

- Any `node_modules/`
- Any `dist/`, `build/`, `.next/`
- `board_prep/runs/`
- PDF exports and status reports
- duplicate lineage copies unless needed for recovery

## Validation Checklist

- Raw source files copied with unchanged checksums
- Normalized JSON validates against one schema
- No imported content references missing assets
- Markdown renders correctly in the target UI
- Lecture/tutorial counts match source counts
- No backend-only dependency is added without an active code path
- Current granuloma module still builds after import

## Recommended First Implementation Sprint

1. Create `src/content/` and a `source_manifest.json`.
2. Copy raw JSON from `stainbrain printable`, `board_prep`, and `syllabus`.
3. Write a normalization script that emits:
   - `lectures.normalized.json`
   - `tutorials.normalized.json`
   - `syllabus.normalized.json`
4. Add markdown rendering support to the target app.
5. Expose read-only lecture and tutorial browsers before attempting deep interactive feature parity.
6. Address `image_manifest.json` in the target so existing image features are not left in a broken state.

## Practical Bottom Line

If the goal is to pull in all lecture content with the least risk, start with:

- `stainbrain printable` for lecture and algorithm structures
- `board_prep/frontend/public/data/content_data.json` for topic tutorials, MCQs, and flashcards
- `syllabus/data/parsed_topics_v3.json` for the canonical syllabus/topic backbone

Treat everything else as lineage, raw generation output, or optional follow-on integration.
