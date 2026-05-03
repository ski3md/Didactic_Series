# Breast Sign-Out Implementation Sources

This package uses three implementation patterns:

- Manifest-driven local image acquisition, following the existing acquired lecture image pipeline in `scripts/sync_acquired_reference_images.cjs`.
- PDF page capture into local image assets, aligned with the PDF.js model of loading a PDF page and rendering it to a canvas/image.
- Zoomable histology display readiness, aligned with OpenSeadragon-style tile or large-image viewers already available in this project dependency set.

The local scripts do not download or execute public repository code. Public references are implementation benchmarks only; local code is written for this project.

## Operational Targets

- Store every acquired breast sign-out image under `public/reference-library/breast-signout/`.
- Write acquired image metadata to `src/content/breast/breast_signout_acquired_assets.json`.
- Keep unresolved source slots visible until strict release mode passes.
- Preserve source URLs or source document paths for audit and later reference-library display.
