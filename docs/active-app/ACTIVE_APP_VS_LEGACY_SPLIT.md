# Active App vs Legacy Root App Split

## Purpose
The repo now exposes two learner-facing teaching surfaces:

- The active app in `src/`, which is the default learner workspace.
- The legacy granulomatous lecture deck, preserved as a separate historical route.

## Active App Responsibilities
- `src/App.tsx` owns the current navigation shell, header, sidebar, and active-section routing.
- `src/components/Home.tsx` is the new learner landing page.
- `src/components/PathologyCurriculum.tsx` is the canonical boards-first entry path.
- `src/components/DidacticLectures.tsx`, `src/components/DidacticTutorials.tsx`, `src/components/AlgorithmNavigator.tsx`, and `src/components/ReferenceLibrary.tsx` are the active downstream learning surfaces.

## Legacy Surface Responsibilities
- `src/components/Lecture.tsx` preserves the original granulomatous lecture deck.
- The legacy route remains available for continuity, but it is no longer the default landing experience.

## Routing Rule
Default learner flow is:

1. `Home`
2. `Pathology Curriculum`
3. `Didactic Lectures` or `Didactic Algorithms`
4. `Reference Library`, `Didactic Tutorials`, or assessment surfaces

The legacy lecture deck is intentionally excluded from that default flow.
