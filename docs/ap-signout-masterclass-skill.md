# AP Sign-Out Masterclass Skill

Use this skill when creating biopsy, resection, or gross-only anatomic pathology sign-out teaching cases outside breast.

## Case Construction

1. Select the subspecialty and workflow: biopsy, resection, or gross-only.
2. Write the case as a sign-out task, not a quiz prompt.
3. Define the first image the learner must see before any diagnosis is revealed.
4. Require the learner to state the observed pattern, compartment, and immediate differential.
5. Reveal diagnostic reasoning after observation.
6. Reveal ancillary studies only when they answer a specific morphologic or reporting problem.
7. End with exact final report language.

## Workflow Rules

Biopsy cases must teach:
- microscopic pattern recognition
- key mimic
- ancillary decision
- final diagnostic line

Resection cases must teach:
- gross-histology correlation
- tumor/lesion size or extent
- margins
- lymph nodes when applicable
- stage or protocol fields when applicable
- treatment response when applicable

Gross-only cases must teach:
- specimen identity
- dimensions
- orientation
- lesion or no lesion
- whether sections are needed
- final gross diagnosis

## Image Rules

Every descriptor must correspond to an image, gross photo, diagram, or explicitly stated absent finding. Store all acquired assets locally. Do not rely on remote display at lecture time.

## Display Format

Use the Breast Sign-Out Masterclass layout:

- left case rail
- large uniform image stage
- right staged observation panel
- lower report/synoptic panels
- no infinite-scroll teaching path
- no web-development annotations

## Release Gate

Run the AP contract validator before release:

```bash
npm run ap:validate-contract
```

Do not release a subspecialty module until its image source manifest has no unresolved source slots and all acquired files exist locally.
