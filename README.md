# P@thfndr

`P@thfndr` is a pathology education platform built with React, TypeScript, and Vite. It began as a granulomatous lung teaching module and now functions as a broader pathology learning environment with lectures, tutorials, curriculum modules, image atlases, and case-based study tools.

## Current Product Scope

The app currently includes:

1. Native teaching workflows
- Job Aid & Atlas
- Diagnostic Pathway
- AI Case Generator
- Case Study, Visual Challenge, and Evaluation flows

2. Canonical learning surfaces
- Pathology Curriculum
- Lectures
- Tutorials
- Syllabus Explorer

3. Staging and review surface
- Downloads Library

4. Image-focused experiences
- Image Galleries
- Curated Histology Atlas
- Supplemental promoted granulomatous atlas content

## Current Content Footprint

The repo currently contains:

- 2 primary normalized lectures
- 190 primary normalized tutorials
- 9 Downloads-derived lectures
- 290 Downloads-derived tutorials
- 216 Downloads-derived images
- 1 Downloads-derived algorithm
- 24 curriculum modules, with canonical and staged promotion states

These datasets live under:

- [src/content/lectures](/Users/skim4/Downloads/Didactic_Series/src/content/lectures)
- [src/content/tutorials](/Users/skim4/Downloads/Didactic_Series/src/content/tutorials)
- [src/content/syllabus](/Users/skim4/Downloads/Didactic_Series/src/content/syllabus)
- [src/content/downloads_imports](/Users/skim4/Downloads/Didactic_Series/src/content/downloads_imports)
- [src/content/curriculum](/Users/skim4/Downloads/Didactic_Series/src/content/curriculum)
- [src/content/staging](/Users/skim4/Downloads/Didactic_Series/src/content/staging)

## Tech Stack

- React 18
- TypeScript 5
- Vite 4
- Tailwind CSS
- `react-markdown` + `remark-gfm`
- Google Gemini client libraries
- OpenSeadragon

## Main App Sections

The main app currently exposes:

- Home
- Pathology Curriculum
- Job Aid & Atlas
- Case Study
- Case Library
- Lectures
- Tutorials
- Downloads Library
- Syllabus Explorer
- Visual Challenge
- Diagnostic Pathway
- AI Case Generator
- Image Galleries

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure secrets

The preferred local setup on this machine uses:

- `direnv`
- `project-secrets`
- macOS Keychain

If that setup is available, entering the repo should load repo-scoped secrets automatically through:

- [.envrc](/Users/skim4/Downloads/Didactic_Series/.envrc)

If you are not using that system, you can still export the required values manually before running the app.

### 3. Frontend runtime keys

AI-driven frontend features require a Google Gemini-compatible key through one of:

- `API_KEY`
- `VITE_API_KEY`
- `GEMINI_API_KEY`

### 4. Start the app

```bash
npm run dev
```

### 5. Production build

```bash
npm run build
```

### 6. GitHub Pages deploy

```bash
npm run deploy
```

Before deploying, verify the repository-specific paths in:

- [package.json](/Users/skim4/Downloads/Didactic_Series/package.json)
- [vite.config.ts](/Users/skim4/Downloads/Didactic_Series/vite.config.ts)

## Supporting Scripts

### Legacy image manifest compatibility

```bash
npm run sync:legacy-manifest
```

### Content planning

```bash
npm run batch:next-10
```

This generates planning outputs under:

- [src/content/downloads_imports/planning](/Users/skim4/Downloads/Didactic_Series/src/content/downloads_imports/planning)

### Pipeline notifications

The pathology image pipeline in [map_and_run_pipeline.py](/Users/skim4/Downloads/Didactic_Series/map_and_run_pipeline.py) supports Gmail OAuth notifications rather than Gmail app-password SMTP. Setup notes are in:

- [docs/gmail_oauth_notifications.md](/Users/skim4/Downloads/Didactic_Series/docs/gmail_oauth_notifications.md)

## Important Project Notes

- The repo still contains legacy image-manifest tooling that expects `src/assets/data/image_manifest.json`. That path now has a compatibility bridge but still needs longer-term consolidation with the newer curated atlas/content system.
- The Downloads Library is a staging and promotion surface, not the primary learner journey.
- Raw imported content is treated as source material. Promotion into canonical learning surfaces should happen through registries and view-model layers rather than by mutating imported JSON directly.

## Planning Documents

Use these documents for the current project direction:

- [CURRENT_STATE_MASTER_ROADMAP.md](/Users/skim4/Downloads/Didactic_Series/CURRENT_STATE_MASTER_ROADMAP.md)
- [LECTURE_CONTENT_MIGRATION_STRATEGY.md](/Users/skim4/Downloads/Didactic_Series/LECTURE_CONTENT_MIGRATION_STRATEGY.md)
- [NEXT_10_MIGRATION_BATCH_PLAN.md](/Users/skim4/Downloads/Didactic_Series/NEXT_10_MIGRATION_BATCH_PLAN.md)
- [NEXT_20_MILESTONES_TRANCHE_PLAN.md](/Users/skim4/Downloads/Didactic_Series/NEXT_20_MILESTONES_TRANCHE_PLAN.md)

## Current State Summary

The repo is past the initial migration stage. The main remaining work is:

- consolidating canonical curriculum surfaces
- promoting curated content out of staging
- reconciling legacy and new image-data paths
- tightening docs, tests, and repo hygiene

This project should be treated as a reusable pathology education shell with curriculum, atlas, tutorial, and assessment capabilities rather than a single-topic teaching module.
