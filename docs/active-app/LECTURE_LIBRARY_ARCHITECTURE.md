# Lecture Library Architecture

## Core Files
- `src/utils/lectureLibraryCatalog.ts` normalizes promoted lecture metadata for the active app.
- `src/utils/interactiveLectureCatalog.ts` enriches lecture records with interactive assets such as algorithms, tissue layers, quick checks, and workflow summaries.
- `src/utils/lectureLibraryNavigation.ts` persists one-shot selection intents in `sessionStorage`.
- `src/components/DidacticLectures.tsx` is the learner-facing lecture library view.

## Navigation Contract
Lecture entry points should write a `LectureLibraryIntent` before switching sections. The main fields are:

- `selectedId`
- `query`
- `track`
- `initialMode`
- `imageLayerSetId`

The lecture library consumes the intent exactly once and then clears it. This keeps Home and Curriculum launch buttons deterministic.

## Source of Truth
Promoted lecture records remain the source of truth for learner-facing lecture metadata. Home, curriculum, and algorithms should not hardcode lecture titles except when selecting a known canonical lecture id.
