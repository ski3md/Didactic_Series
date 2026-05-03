# Tranche 6 Active Tutorials and Syllabus Execution Report

## Scope

This tranche closes two major holes in the active `src/` app: curriculum-guided access to tutorials and curriculum-guided access to syllabus topics. The goal was to add real learner-facing shells without regressing the main bundle, so the large normalized corpora were loaded as emitted JSON assets rather than inlined into the primary application chunk.

## Completed Milestones

1. Added an active-app tutorials surface for promoted AP and CP material.
2. Added direct curriculum-to-tutorial routing.
3. Added an active-app syllabus explorer shell.
4. Added direct curriculum-to-syllabus routing.
5. Completed the earlier curriculum-level milestones for tutorial and syllabus drilldowns.

## Implementation Outputs

- `src/App.tsx`
- `src/components/DidacticTutorials.tsx`
- `src/components/Home.tsx`
- `src/components/PathologyCurriculum.tsx`
- `src/components/Sidebar.tsx`
- `src/components/SyllabusExplorer.tsx`
- `src/content/planning/next_100_steps.json`
- `src/content/planning/tranche_6_active_tutorials_syllabus_execution_report.md`
- `src/types.ts`
- `src/utils/syllabusCatalog.ts`
- `src/utils/syllabusNavigation.ts`
- `src/utils/tutorialLibraryCatalog.ts`
- `src/utils/tutorialLibraryNavigation.ts`

## Verification

- `npm run build` succeeded after the new tutorial and syllabus shells were added.
- `npm run build` succeeded again after the large tutorial and syllabus corpora were moved out of the main application chunk and into JSON assets fetched on demand.

## Notes

- The active app now exposes `Didactic Tutorials` and `Syllabus Explorer` as first-class sidebar sections.
- Curriculum modules can now route into lectures, tutorials, reference-library image focus, and syllabus exploration.
- The main app chunk returned below the chunk-size warning threshold after the asset-loading refactor.
- Algorithm-specific routing remains the next major active-app gap.
