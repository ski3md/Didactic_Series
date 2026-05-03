# GU WHO Lecture Batch Plan

Date: 2026-04-26

## Goal

Create resident-facing penile and testicular/paratesticular lectures that cover the WHO 2022 Blue Book entity scaffold while still teaching true sign-out behavior.

## Batch Inputs

- Entity manifest: `src/content/gu/who_gu_entity_manifest.json`
- Lecture output: `src/content/lectures/gu_who_complete_lectures.normalized.json`
- Active catalog hook: `src/utils/lectureLibraryCatalog.ts`
- Curriculum hooks: `src/content/curriculum/activeCurriculum.ts`
- Validator: `scripts/validate_gu_who_coverage.cjs`

## Batch Contract

Every manifest entity must carry:

- Clinical context
- Gross or specimen context
- Morphology anchor
- Ancillary anchor
- Top differential
- Reporting consequence

Every must-cover entity must appear in the appropriate lecture body:

- `penile_who_complete_pathology`
- `testicular_who_complete_pathology`

Run:

```bash
node scripts/validate_gu_who_coverage.cjs
```

## Current Batch Output

The first batch adds two resident-review draft lectures:

1. `Penile Pathology: WHO-Complete Sign-Out Lecture`
2. `Testicular and Paratesticular Pathology: WHO-Complete Sign-Out Lecture`

These are intentionally sign-out lectures, not flat entity catalogs. The entity lists are embedded in practical workflows: biopsy/penectomy orientation for penis, and age/pathway/component accounting for testis.

## Expert Review Checklist

- Reconcile the entity manifest against licensed WHO Online or print Blue Book tables before labeling the set final.
- Confirm penile SCC grouping language, especially entities now handled as patterns versus distinct subtypes.
- Confirm testicular sex cord-stromal and adnexal tumor labels, especially rare rete/epididymal and ovarian-type epithelial tumors.
- Add real images or WSI references for each core entity before marking `ready-to-deliver`.
- Add CAP-style reporting checkpoints for penectomy and orchiectomy/post-chemotherapy specimens.
- Convert rare-entity paragraphs into optional expandable sections so the live lecture remains teachable in 45-60 minutes.

## Next Batch

1. Add entity cards and quick checks generated from the manifest.
2. Add penile and testicular algorithms to `guPilotAlgorithms.ts`.
3. Add tissue-layer comparison sets for:
   - dPeIN vs HSIL
   - warty SCC vs condyloma
   - verrucous/cuniculatum SCC vs usual invasive SCC
   - seminoma vs embryonal carcinoma
   - yolk sac tumor vs embryonal carcinoma
   - spermatocytic tumor vs seminoma/lymphoma
   - Leydig vs Sertoli vs metastatic carcinoma
4. Add resident case pack with at least 10 penile and 10 testicular cases.
5. Gate final promotion on `node scripts/validate_gu_who_coverage.cjs`, app build, and GU pathologist review.
