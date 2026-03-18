# Pathology Learning Module - Granulomatous Diseases

This project is an authored learning module, not a content dump. The reusable instructional content lives inside React screens with embedded text, decision trees, and remote slide references.

## What Was Found

- `components/DiagnosticPathway.tsx` contains the strongest algorithm-style content: a 10-step branching diagnostic workflow plus a differential compendium.
- `components/CaseStudy.tsx`, `components/AICaseGenerator.tsx`, and `components/AssessmentPhase.tsx` are the main tutorial-style learning screens.
- `components/AnalysisPhase.tsx`, `components/DesignPhase.tsx`, and `components/DevelopmentPhase.tsx` are ADDIE instructional-design lessons.
- `components/CaseStudy.tsx`, `components/EvaluationPhase.tsx`, and `components/DevelopmentPhase.tsx` are the main image-bearing screens.

## Staging Decision

- `algorithms`: yes, via `components/DiagnosticPathway.tsx`
- `lectures`: yes, via the ADDIE phase screens
- `images`: yes, but only as remote slide/image references
- `tutorials`: yes, via the case study, AI case generator, assessment, and pathway screens

## Recommendation

If migration continues, stage the React content screens and then decide whether the remote slide URLs should be replaced with local assets. There is no separate lecture file set or local image folder in this repo.
