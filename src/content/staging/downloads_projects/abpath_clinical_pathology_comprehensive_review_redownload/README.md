# ABPath Clinical Pathology Comprehensive Review

Source inspection found a Next.js app scaffold with one embedded study deck, not a separate content corpus.

## Findings

- `src/app/page.tsx` is the only clear educational payload. It embeds 15 flashcards and the study dashboard logic.
- `src/app/api/questions/route.ts` generates board-review questions dynamically through `z-ai-web-dev-sdk`.
- `src/app/api/upload/route.ts` is an Anki upload/demo pipeline, not a curriculum source.
- No standalone files for `algorithms`, `lectures`, or educational `images` were found.

## Staging Decision

- `tutorials`: candidate present in `src/app/page.tsx`
- `algorithms`: none found
- `lectures`: none found
- `images`: none found

## Recommendation

If migration is needed, stage only the embedded study-card experience and treat the rest of the repo as application code and dependencies.
