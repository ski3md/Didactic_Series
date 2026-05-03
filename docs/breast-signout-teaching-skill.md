# Breast Sign-Out Teaching Skill

Use this workflow when converting a breast pathology quiz, case conference, or lecture into a resident-level sign-out exercise.

## Standard Case Flow

1. Show the histologic or immunohistochemical image first with only the specimen type and clinical question.
2. Ask for observed findings before allowing a diagnostic label.
3. Reveal the differential diagnosis only after the learner names the microscopic findings.
4. Require a diagnostic commitment, one excluded mimic, and the report-critical elements.
5. Reveal ancillary studies only when they answer a specific morphologic problem.
6. End with exact sign-out language and a one-sentence management consequence.

## Required Assets

Each case needs at least one diagnostic H&E image. Add an ancillary image when the case cannot be taught responsibly without it, such as E-cadherin for lobular phenotype, myoepithelial stains for invasion questions, ER/HER2 examples for biomarker reporting, or p63/p40/CD117 for selected special types.

## Faculty Review Checklist

- The first learner action is visual observation, not clicking an answer.
- Every descriptor in the teaching text is visible in an image or explicitly marked as not shown.
- Every image has local storage, source provenance, stain or marker, and a caption tied to a diagnostic decision.
- Report language is exact and clinically usable.
- The case teaches one primary decision and one high-risk pitfall.
- No web-development annotations, implementation notes, or placeholder language appear in learner-facing content.

## Release Gate

Run:

```bash
npm run breast:validate-assets
node scripts/acquire_breast_signout_assets.cjs --self-test
```

Enable strict source coverage only when the real image sources have been populated:

```bash
node scripts/validate_breast_signout_assets.cjs --strict-source-coverage --strict-files
```
