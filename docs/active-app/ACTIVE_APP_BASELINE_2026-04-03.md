# Active App Baseline 2026-04-03

## Frozen Scope
This baseline freezes the active app after lecture, curriculum, tutorial, algorithm, atlas, and assessment routing reached canonical learner-facing coverage for the promoted surfaces.

## Baseline Components
- `Home` is the default learner landing page.
- `PathologyCurriculum` is the canonical boards-first routing shell.
- `DidacticLectures`, `DidacticTutorials`, `AlgorithmNavigator`, and `ReferenceLibrary` are first-class active-app surfaces.
- The active curriculum includes AP modules, CP modules, staged pattern blocks, and staged advanced modules.
- The legacy granulomatous lecture deck remains available as a separate route.

## Verification Snapshot
- Deterministic tests cover Home lecture pathways, lecture-library intents, curriculum-to-lecture drilldowns, active-section routing, and canonical-versus-staged states.
- Production build passes on the frozen baseline.

## Change Rule
Future changes should update the matching docs and tests when they alter:

- default learner routing
- curriculum promotion state
- lecture-library intent behavior
- canonical versus staged presentation
