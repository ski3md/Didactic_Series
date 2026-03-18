# frozens-dashboard-2

This repo is an intraoperative pathology dashboard with embedded educational content.

Most useful migration candidates:
- `frontend/constants.ts` for chapter-style knowledge modules
- `frontend/data/iocData.ts` for guided consultation algorithms and case-based teaching content

Supporting UI files:
- `frontend/components/KnowledgeBase.tsx`
- `frontend/components/IntraoperativeConsultsModal.tsx`

Images found in `frontend/public/` are branding or UI assets only, not teaching content.

Recommendation: migrate the structured data first. The rest of the project is mainly workflow/application code.
