# Local Sign-Out Image Import

Use this when sign-out simulation images already exist on local disk, a mounted NAS share, or a local network volume.

## Basic Use

```bash
SIGNOUT_LOCAL_IMAGE_ROOTS="/Volumes/PathologyAtlas:/Users/skim4/Downloads/pathology_images" npm run signout:import-local-images
```

The importer scans only the roots you provide. It does not crawl the whole disk by default.

## Dry Run

```bash
npm run signout:import-local-images -- --dry-run --roots "/Volumes/PathologyAtlas"
```

The report is written to:

```text
src/content/signout_sims/local_image_import_report.json
```

## Explicit Manifest

For clinical material or internal teaching sets, use an explicit manifest so the match is auditable:

```json
[
  {
    "caseId": "gi-colon-adenocarcinoma-resection",
    "sourcePath": "/Volumes/PathologyAtlas/GI/colon_adenocarcinoma_HE.jpg",
    "note": "Department-authorized teaching image"
  }
]
```

Run:

```bash
npm run signout:import-local-images -- --manifest ./local-signout-image-manifest.json
```

## PDF Sources

PDFs are supported when `pdfimages` is available. If a matching PDF is selected, the importer extracts the largest raster image and writes it to the expected local reference-library path.

Disable PDF extraction:

```bash
npm run signout:import-local-images -- --roots "/Volumes/PathologyAtlas" --no-pdf
```

## Matching Rules

The importer prefers:

1. Explicit manifest `caseId` matches.
2. Exact target filename or case-id matches.
3. Conservative token matches from case id, case title, target filename, and source filename.

Ambiguous matches are not imported. They are listed in the report for manual resolution.
