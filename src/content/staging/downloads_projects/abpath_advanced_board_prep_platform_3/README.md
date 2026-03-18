# abpath-advanced-board-prep-platform (3) Staging Notes

This project is mostly an app shell plus one large export file.

What matters for migration:

- `abpath_export_1766721402593.json` is the only real educational content payload.
- It contains 239 tutorial-style records.
- Most records are smear-based; 21 are marked `histology`.
- No separate lecture corpus was found.
- No separate algorithm corpus was found.
- The image files in `style-enforcement-agent/public/` are UI/static assets, not educational histology figures.

Recommended next step:

- Parse the export JSON into the target content schema before copying anything else.
- Treat the `histology`-marked tutorial records as the only plausible image-adjacent subset worth separating later.
