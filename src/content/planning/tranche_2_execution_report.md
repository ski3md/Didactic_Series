# Tranche 2 Execution Report

## Scope

Tranche 2 begins the shift from staging-heavy imports to promoted teaching surfaces.

## Completed Milestones

1. Promoted core-principles lectures into a first-class didactic module.
2. Split Downloads lectures into topic-first navigation instead of a flat library.
3. Curated one coherent tutorial track from the imported corpora.
4. Deduplicated overlapping promoted records across main and Downloads content surfaces.

## Implementation Outputs

- `components/LecturesView.tsx`
- `components/DownloadsLibraryView.tsx`
- `components/Home.tsx`
- `components/TutorialsView.tsx`
- `src/content/planning/next_20_milestones.json`
- `src/content/planning/tranche_2_execution_report.md`
- `utils/promotedContentRegistry.ts`

## Verification

- `npm run build` succeeded after the promoted lecture track was merged into the main Lectures surface
- `npm run build` succeeded after the Downloads lecture tab was reorganized into topic-first navigation
- `npm run build` succeeded after the curated clinical-path tutorial track was promoted into the main Tutorials surface
- `npm run build` succeeded after promoted lectures and duplicated tutorial records were hidden from the Downloads staging surface

## Notes

- The main Lectures view now combines the original curated GU lectures with the Downloads-derived core-principles lecture set.
- The Downloads Library remains the staging surface for unpromoted content classes and imported corpora that still need curation.
- The Downloads lecture tab now defaults to topic-based navigation and surfaces triad anchors for each selected topic overview.
- The main Tutorials view now promotes a coherent clinical-path track from the Downloads imports while preserving the larger board-prep corpus as a separate lane.
- Promotion and deduplication rules now live in a shared registry so the main teaching surfaces are canonical and the Downloads Library reflects only remaining staged content.
