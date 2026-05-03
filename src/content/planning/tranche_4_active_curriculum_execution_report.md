# Tranche 4 Active-Curriculum Execution Report

## Scope

This tranche ports the curriculum shell into the active `src/` app and makes it useful inside the app architecture that Vite actually serves. The goal was not to fabricate new downstream tutorial or syllabus UIs prematurely, but to create a first-class curriculum entrypoint, connect it to the live didactic lecture surface, and carry module context into the existing reference-library image tools.

## Completed Milestones

1. Added a first-class `Pathology Curriculum` section to the active app.
2. Ported the canonical curriculum registry into the active app shell.
3. Added curriculum filters for subspecialty, board priority, and promotion state.
4. Added curriculum drilldowns into didactic lectures.
5. Added curriculum drilldowns into atlas and image surfaces through the active `Reference Library`.
6. Added curriculum readiness badges for lectures, tutorials, images, algorithms, and assessment.
7. Separated canonical modules from staged modules visually.
8. Made the active `Home` page point to the curriculum as the recommended learner path.

## Deferred Within This Tranche

1. Direct curriculum drilldowns into a dedicated active-app tutorials surface.
2. Direct curriculum drilldowns into a dedicated active-app syllabus surface.

Those remain pending because the served `src/` app does not yet have canonical tutorial or syllabus shells. This tranche keeps those gaps explicit instead of hiding them behind misleading buttons.

## Implementation Outputs

- `src/App.tsx`
- `src/components/Home.tsx`
- `src/components/ImageGalleries.tsx`
- `src/components/PathologyCurriculum.tsx`
- `src/components/ReferenceLibrary.tsx`
- `src/components/Sidebar.tsx`
- `src/content/curriculum/activeCurriculum.ts`
- `src/content/planning/next_100_steps.json`
- `src/content/planning/tranche_4_active_curriculum_execution_report.md`
- `src/types.ts`
- `src/utils/referenceLibraryNavigation.ts`

## Verification

- `npm run build` succeeded after the curriculum shell was added to the active app.
- `npm run build` succeeded after curriculum-driven reference-library focus routing and image filtering were added.

## Notes

- The curriculum shell now acts as the active app's canonical learner path for promoted modules.
- Lecture drilldowns are exact and use the didactic lecture library intent system.
- Reference-library drilldowns now preserve module context and pre-focus the image gallery with relevant search terms.
- Tutorial, algorithm, and syllabus coverage is now visible in the curriculum as planned downstream work rather than implied functionality.
