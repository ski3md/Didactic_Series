# Migration Summary

Source project: `cp-content-specification-tutorial-batch-ready`

This repo is a tutorial-generation workspace, not a lecture or algorithm library. The strongest reusable content is the pre-generated tutorial corpus in `pregeneratedData.ts`, supported by `constants.ts`, `metadata.json`, and the batch prompt file under `batches/batch_input.jsonl`.

No standalone lecture payloads, algorithm assets, or raw image files were found in the source tree. The atlas components reference `imageKey` values, but those are UI bindings rather than copyable image content.

Recommended next step: migrate the tutorial corpus first, then normalize it into a content schema before attempting any broader asset extraction.
