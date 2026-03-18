# abpath-smart-qbank Migration Scan

This folder contains a source-inventory manifest only. The source project is an AI-driven board-question application, not a repository of static lecture or image payloads.

Key findings:
- `tutorials`: the main content-adjacent source is `data/syllabus.ts`, which defines the AP/CP syllabus tree used to generate questions.
- `images`: `components/VisualModels.tsx` contains synthetic canvas/D3 teaching visuals, but no standalone image files were found.
- `algorithms`: no standalone algorithm content assets were found.
- `lectures`: no standalone lecture content assets were found.

Dependencies worth tracking:
- `services/geminiService.ts` contains the prompt templates and generation logic for questions and deep dives.
- `types.ts` defines the syllabus/question schema used by the generator and UI.

Recommendation:
Do not copy large payloads yet. If content migration is needed, the next step is to extract or canonicalize tutorial content from the syllabus tree and generation prompts rather than moving app code.
