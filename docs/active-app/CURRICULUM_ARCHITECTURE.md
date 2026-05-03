# Curriculum Architecture

## Registry
- `src/content/curriculum/activeCurriculum.ts` defines the learner-facing module registry.
- `src/types.ts` defines `ActiveCurriculumModule`, its subspecialties, priorities, and promotion states.

Each module carries:

- learner title and summary
- subspecialty
- board priority
- promotion state
- recommended order
- pattern families and specimen contexts
- planned assets
- linked lectures
- tutorial, atlas, algorithm, syllabus, and assessment topics

## Runtime Navigation
- `src/utils/curriculumNavigation.ts` stores one-shot curriculum intents in `sessionStorage`.
- `src/components/PathologyCurriculum.tsx` consumes those intents and applies exact module, query, and filter targeting.

## Promotion Model
- `canonical`: learner-ready module with promoted downstream assets
- `staged`: intentionally visible incomplete module
- `archived`: retained for historical or planning reasons, not part of the main flow

Staged modules must keep missing downstream work explicit through notices, readiness states, and planned-asset badges.
