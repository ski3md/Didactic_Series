# ABPath_CP_CompReview Migration Scan

This scan found a Next.js clinical pathology review app with tutorial-style content embedded in the application code, not in a separate lecture or algorithm dataset.

## What looked relevant

- `src/app/page.tsx` contains the core study experience: generated questions, flashcards, review tabs, and sample board-style content.
- `src/app/api/questions/route.ts` generates clinical pathology board-review questions with answers, explanations, and study modalities.
- `src/app/api/upload/route.ts` and `src/lib/anki-parser.ts` implement Anki flashcard ingestion and categorization.
- `public/logo.svg` and `src/app/favicon.ico` are the only image assets found, but they are branding assets rather than instructional images.

## What was not found

- No standalone lecture corpus.
- No standalone algorithms corpus.
- No separate tutorial JSON or content folder.
- No educational image bundle.

## Recommendation

If this project is migrated further, start with the tutorial/question subsystem and treat lectures and algorithms as absent unless new source data appears. The source is mostly app shell plus embedded study content.
