# AP Sign-Out Masterclass Contract

This contract generalizes the Breast Sign-Out Masterclass design across non-breast anatomic pathology.

## Scope

Every AP subspecialty outside breast must have at least 30 cases. Each subspecialty must include biopsy, resection, and gross-only sign-out workflows.

The generated contract is stored at:

```text
src/content/ap_signout/ap_signout_masterclass_contract.json
```

The image acquisition requirement manifest is stored at:

```text
src/content/ap_signout/ap_signout_image_requirements.json
```

## Required Teaching Design

- Case list opens a single focused case.
- First learner action is image-based observation.
- Content is revealed in stages: image, clinical header, learner observation, diagnostic reasoning, ancillary studies if indicated, final report language.
- Resection cases include synoptic field practice.
- Gross-only cases include specimen identity, measurements, orientation, lesion description, submission decision, and gross diagnosis.
- All learner-facing text must be clinical sign-out language.

## Required Image Governance

Each case must define image acquisition slots before release. Accepted source kinds are:

- `image_url`
- `local_image`
- `pdf_page`

Every acquired image must be stored locally with source provenance, caption, role, case linkage, and subspecialty library path.

## Verification

Run:

```bash
npm run ap:generate-contract
npm run ap:validate-contract
```

Release validation for populated assets should additionally require strict source and local-file checks once AP source manifests are built from `ap_signout_image_requirements.json`.
