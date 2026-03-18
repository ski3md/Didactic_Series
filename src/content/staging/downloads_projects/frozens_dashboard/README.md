# Frozens Dashboard

This source is mostly an operational pathology dashboard. The reusable educational content is embedded in data files rather than stored as separate lectures or images.

## Findings

- `constants.ts` contains the main knowledge-base/tutorial data, including 3 reference chapters.
- `iocData.ts` contains 15 IOC case tutorials across 2 service lines.
- `components/KnowledgeBase.tsx` and `components/IOCGuidedModals.tsx` render that tutorial content.
- No standalone lecture corpus, algorithm lesson set, or local image asset folder was found.

## Staging Decision

- `tutorials`: yes, via `constants.ts` and `iocData.ts`
- `algorithms`: none found
- `lectures`: none found
- `images`: none found

## Recommendation

Stage the data files first if migration continues. There is no separate educational image archive to copy from this repo.
