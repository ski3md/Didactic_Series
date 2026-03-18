# pathology-learning-module_-granulomatous-diseases (3) staging summary

Source: `/Users/skim4/Downloads/pathology-learning-module_-granulomatous-diseases (3)`

This repo is a granulomatous lung disease learning module with most of the educational payload embedded directly in code and JSON.

## Identified candidates

- `algorithms`: `components/DiagnosticPathway.tsx`, `src/data/caseMetadataRules.json`
- `lectures`: `components/Lecture.tsx`
- `images`: `data/gallery.json`
- `tutorials`: `data/modules.ts`

## Notes

- `data/gallery.json` indexes 216 official histology images and uses external GCS URLs; no local image binaries were found.
- `data/modules.ts` contains 3 case/tutorial entries with MCQs and flashcards.
- The lecture and diagnostic pathway are authored as component-embedded content, not as separate content files.

## Recommendation

Migrate the embedded lecture, pathway, tutorial, and gallery metadata first. Keep the app shell as delivery code unless you want to fully refactor this module into a structured content repository.
