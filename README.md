# Didactic Series

`Didactic_Series` is a pathology education platform built in React, TypeScript, and Vite. It started as a granulomatous lung teaching module, but it now includes a broader set of educational surfaces for lectures, tutorials, syllabus exploration, image atlases, and case-based learning.

## Current Product Scope

The app currently combines four kinds of educational experiences:

1. Native granulomatous teaching workflows
- Job Aid & Atlas
- Diagnostic Pathway
- AI Case Generator
- Case Study, Visual Challenge, and Evaluation flows

2. Promoted educational content
- Lectures
- Tutorials
- Syllabus Explorer

3. Imported staging and review surface
- Downloads Library

4. Histology image experiences
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

These datasets live under:

- [src/content/lectures](/Users/skim4/Downloads/Didactic_Series/src/content/lectures)
- [src/content/tutorials](/Users/skim4/Downloads/Didactic_Series/src/content/tutorials)
- [src/content/syllabus](/Users/skim4/Downloads/Didactic_Series/src/content/syllabus)
- [src/content/downloads_imports](/Users/skim4/Downloads/Didactic_Series/src/content/downloads_imports)
- [src/content/staging](/Users/skim4/Downloads/Didactic_Series/src/content/staging)

## Tech Stack

- React 18
- TypeScript 5
- Vite 4
- Tailwind CSS
- `react-markdown` + `remark-gfm`
- `@google/genai`
- OpenSeadragon

## Key App Sections

The main app currently exposes:

- Home
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

The recommended local setup is no longer a plain `.env` file. This machine is now set up to use:

- `direnv`
- `project-secrets`
- macOS Keychain

If that setup is available, entering the repo should load the repo-scoped secrets automatically through:

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

## Supporting Scripts

### Content planning

```bash
npm run batch:next-10
```

This generates planning outputs under:

- [src/content/downloads_imports/planning](/Users/skim4/Downloads/Didactic_Series/src/content/downloads_imports/planning)

### Pipeline notifications

The pathology image pipeline in [map_and_run_pipeline.py](/Users/skim4/Downloads/Didactic_Series/map_and_run_pipeline.py) now supports Gmail OAuth notifications rather than Gmail app-password SMTP. Setup notes are in:

- [docs/gmail_oauth_notifications.md](/Users/skim4/Downloads/Didactic_Series/docs/gmail_oauth_notifications.md)

## Important Project Notes

- The repo still contains legacy image-manifest tooling that expects `src/assets/data/image_manifest.json`. That path is not yet fully reconciled with the newer curated atlas/content system.
- The Downloads Library is a staging and promotion surface, not yet the final curated teaching experience.
- The current worktree may contain local generated content and environment churn. Treat migration outputs and runtime state carefully before committing.

## Planning Documents

For the actual project direction, use these documents instead of the older single-module framing:

- [CURRENT_STATE_MASTER_ROADMAP.md](/Users/skim4/Downloads/Didactic_Series/CURRENT_STATE_MASTER_ROADMAP.md)
- [LECTURE_CONTENT_MIGRATION_STRATEGY.md](/Users/skim4/Downloads/Didactic_Series/LECTURE_CONTENT_MIGRATION_STRATEGY.md)
- [NEXT_10_MIGRATION_BATCH_PLAN.md](/Users/skim4/Downloads/Didactic_Series/NEXT_10_MIGRATION_BATCH_PLAN.md)

## Current State Summary

The repo is past the initial migration stage. The main remaining work is:

- consolidating product identity
- promoting curated content out of staging
- reconciling legacy and new image-data paths
- tightening docs and repo hygiene

This project should now be treated as a reusable pathology education shell with a strong granulomatous domain, not just a single-topic teaching module.
