# brseducationaldashboard 2

Source audit result: this repo is mainly a Next.js dashboard scaffold, but it embeds reusable tutorial-style pathology study content in the app shell and API helpers.

Relevant candidate content:
- `public/script.js` for the largest embedded study module
- `src/app/page.tsx` for question, flashcard, and case content
- `src/app/api/questions/route.ts` for board-review question generation
- `src/app/api/upload/route.ts` for Anki ingest and fallback cards
- `src/lib/anki-parser.ts` for parsing/tagging study cards

Not found:
- standalone `algorithms` corpus
- standalone `lectures` corpus
- meaningful instructional image set

Only branding images were found:
- `public/logo.svg`
- `src/app/favicon.ico`

Recommendation: migrate tutorial/question material first. There is no separate lecture or algorithm payload to copy from this source project.
