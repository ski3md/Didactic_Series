# CP Content Specification Tutorial

This source is a self-contained study app with the curriculum embedded in TypeScript data and atlas components.

## What Was Found

- `constants.ts` is the main content source: 5 case tutorials, 15 MCQs, and 30 flashcards.
- `components/BacterialIdAtlas.tsx` and `components/ParasitologyAtlas.tsx` provide inline SVG educational imagery.
- `components/InfectionMappingAtlas.tsx` adds more study atlas content with canvas/sketch rendering and image-backed cases.
- No standalone lecture or algorithm corpus was found.

## Staging Decision

- `tutorials`: yes, via `constants.ts` and the topic workflow in `App.tsx`
- `images`: yes, but only as code-defined SVG/canvas assets
- `lectures`: none found
- `algorithms`: none found

## Recommendation

If migration continues, stage the data module and atlas components first. There is no separate binary image folder or lecture archive to move from this repo.
