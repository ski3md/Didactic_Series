# ABPath Clinical Pathology Comprehensive Review

## Scope
This source project is a Next.js study dashboard with educational content embedded directly in the app code.

## What Was Found
- `src/app/page.tsx` contains the main study experience, including flashcards, topic tabs, performance summaries, and inline question content.
- `src/app/api/questions/route.ts` generates board-review questions through `z-ai-web-dev-sdk`.
- `public/logo.svg` is the only standalone image asset found in the inspected tree.

## Migration Readout
There is no separate lecture, algorithm, or tutorial content corpus to bulk-import from this repo. The useful content is mostly inline and would need to be extracted into structured data before a real content migration.

## Recommendation
Use this repo as a source for content normalization, not as a direct asset dump. The next step would be to split the inline study data out of `src/app/page.tsx` into explicit content files if you want it reusable in the target project.
