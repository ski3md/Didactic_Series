# Active App Release Checklist

## Functional Checks
- Run `npm run test`
- Run `npm run build`
- Verify Home launch cards route into exact curriculum, lecture, tutorial, algorithm, and assessment surfaces
- Verify canonical and staged curriculum modules render with the correct badges and notices
- Verify CP routing still lands in the CP tutorial lane and CP curriculum modules

## Content Checks
- Confirm promoted lecture ids still resolve in `lectureLibraryCatalog`
- Confirm `activeCurriculum.ts` modules match the current learner-facing roadmap
- Confirm atlas presets and tutorial lanes still reflect canonical versus staged surfaces

## UX Checks
- Verify the active app still defaults to `Home`
- Verify the legacy lecture deck remains available but is not the default path
- Verify mobile sidebar open/close behavior still works

## Release Decision
Ship only when the test suite passes, the production build passes, and no curriculum step marked `completed` in `src/content/planning/next_100_steps.json` is contradicted by the active UI.
