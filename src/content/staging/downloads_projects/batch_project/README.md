# batch_project staging summary

Source: `/Users/skim4/Downloads/batch_project`

This project is primarily a batch-generation workspace for educational content. The main migratable artifacts are topic/request JSONL files and generated batch outputs. I did not find separate lecture or algorithm libraries, and I did not find a standalone educational image corpus.

## What was identified

- `tutorials`: `extended_batch.jsonl`, `extended_batch_part_1.jsonl` through `extended_batch_part_10.jsonl`, `remaining_topics.jsonl`, and `merged_output.jsonl`
- `images`: `public/logo.svg` only
- `algorithms`: none
- `lectures`: none

## Dependencies

- Python 3.9+
- `requests`
- `pandas`
- OpenAI batch/completions API access via `OPENAI_API_KEY`

## Recommendation

Use this repo as an upstream batch source, not a finished content repository. The most useful migration path is to extract and normalize the JSONL topic/output data first, then decide whether any of it should become lectures or algorithms in the target project.
