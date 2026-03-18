# workspace-23eae586-0c4b-44f9-83bd-cef625ab43de (1) migration summary

This source is a transfusion-medicine teaching dashboard. The main curriculum is embedded in `src/app/page.tsx`, and the interactive learning flows live in the simulator components.

## Findings

- `tutorials`: candidate found in the root dashboard page and simulator modules
- `algorithms`: candidate found in the decision tree and calculator simulators
- `lectures`: none found
- `images`: none found

## Recommendation

Stage the page-level curriculum and simulator modules first. The remaining files are app/runtime scaffolding, not primary educational content.
