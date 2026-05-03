# Tranche 3 Active-App Execution Report

## Scope

This tranche corrects the app split that had developed inside the repo. The root-level app shell already contained the newer didactic lecture and curriculum work, but Vite was actually serving the `src/` app. The purpose of this tranche was to move the first learner-facing didactic improvements into the active app instead of continuing to build on the inactive shell.

## Completed Milestones

1. Defaulted the active app to `Home` instead of the legacy lecture deck.
2. Added a first-class `Didactic Lectures` section to the active app.
3. Added a normalized lecture catalog utility inside `src/`.
4. Added session-based lecture library navigation intents.
5. Added a markdown renderer for imported transcripts inside the active app.
6. Built the active-app didactic lecture library view.
7. Preserved the original granulomatous lecture deck as a separate legacy route.
8. Added the didactic lecture route to the active sidebar.
9. Added direct lecture-pathway buttons to the landing page.
10. Ignored Playwright and test output artifacts in git.

## Implementation Outputs

- `src/App.tsx`
- `src/components/Home.tsx`
- `src/components/Sidebar.tsx`
- `src/components/DidacticLectures.tsx`
- `src/components/ui/MarkdownContent.tsx`
- `src/hooks/useUserProgress.ts`
- `src/types.ts`
- `src/utils/lectureLibraryCatalog.ts`
- `src/utils/lectureLibraryNavigation.ts`
- `.gitignore`
- `NEXT_100_ACTIVE_APP_STEPS.md`
- `src/content/planning/next_100_steps.json`
- `src/content/planning/tranche_3_active_app_execution_report.md`

## Verification

- `npm run build` succeeded after the active app was switched to `Home` as the landing section.
- `npm run build` succeeded after the didactic lecture library was added to the active `src/` app.
- A fresh screenshot of the served app confirmed that `Home` is now the default route and that `Didactic Lectures` is visible in the live sidebar.

## Notes

- The old granulomatous lecture deck remains available under `Lecture`; it is no longer forced as the landing section.
- The imported lecture corpus is now exposed in the active app rather than only in the inactive root shell.
- The repo still has two app trees, but this tranche stops compounding that mistake by focusing future work on `src/`.
- The next logical tranche is to port the curriculum shell into the active app so the lecture library, tutorials, atlas, and syllabus can all be reached through one canonical learner path.
