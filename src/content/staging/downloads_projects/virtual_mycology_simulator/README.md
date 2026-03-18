# Virtual Mycology Simulator

This source is a runtime-generated educational simulator for fungi, not a static curriculum repository.

## What Was Found

- `App.tsx` drives the learning flow: welcome, fungus selection, study mode, quiz mode, and comparison mode.
- `services/geminiService.ts` generates the fungi list, fungus details, quiz questions, shared features, distinctions, and images at runtime.
- `components/StudyMode.tsx`, `components/QuizMode.tsx`, and `components/ComparisonMode.tsx` are the main educational views.
- No local lecture corpus, algorithm dataset, or curated image asset folder was found.

## Staging Decision

- `tutorials`: yes, via the study, quiz, and comparison screens
- `images`: yes, but generated at runtime rather than stored locally
- `lectures`: none found
- `algorithms`: none found

## Recommendation

If migration continues, stage the Gemini workflow and UI screens together. There is no static lecture or image corpus in this repo to copy yet.
