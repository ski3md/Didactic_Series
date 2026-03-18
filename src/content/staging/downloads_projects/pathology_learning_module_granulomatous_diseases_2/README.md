# Migration Summary

`pathology-learning-module_-granulomatous-diseases (2)` is a real educational module for granulomatous lung disease. Its reusable content lives mostly in structured case metadata and embedded instructional case components rather than in separate lecture or image bundles.

The strongest migration targets are `src/data/caseMetadataRules.json`, the case-study components, and the AI case-generation utilities. No standalone image payloads were present in the repository.

Recommended next step: stage the case metadata and tutorial-like case flows first, then normalize them into a reusable content schema before worrying about media extraction.
