# AP Category-Only Source-Map Triage

Generated: 2026-06-02T03:41:02.531Z

## Scope

- Source map: reports/curriculum/ap_local_source_map_v1.json
- Mode: triage_inventory_only
- Internet crawling: false
- Teaching content generation: false
- Promotion allowed: false

## Summary

- Category-only rows: 231
- Topic-specific source-map rows already separated: 48

## Category Counts

| Category | Rows |
| --- | --- |
| Cardiovascular / Autopsy-adjacent | 58 |
| Endocrine | 30 |
| Gastrointestinal | 25 |
| Male Reproductive | 22 |
| Dermatopathology | 21 |
| Pediatric / Perinatal | 19 |
| Breast | 18 |
| Placenta | 9 |
| Soft Tissue, Bone, and Joint | 8 |
| Head and Neck | 5 |
| Medical Kidney / GU | 4 |
| Cytopathology | 4 |
| Neuropathology | 4 |
| Respiratory / Thoracic | 2 |
| Forensic | 2 |

## Guardrails

- This artifact is triage inventory, not generated curriculum.
- Rows must remain blocked from promotion until topic-specific local evidence is found.
- Do not crawl the internet for these rows before local curriculum, local hard-drive corpus, indexed local knowledge, and internal ontology tiers are exhausted.
- Category-only rows may guide review work but cannot satisfy ABPath topic coverage on their own.
- Any future material batch must preserve sourceMapId, topicId, categoryId, review status, and promotion decision.

## First 25 Triage Rows

| # | Source Map ID | Category | Title | Primary candidate | Reuse target | Status | Triage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ap_breast-2605228a-e2fd-4c25-a6e0-d3ee3ca6e074 | Breast | Adenosis | src/content/images/apcpboards_reference_images.json | image_atlas | promoted | category-only-needs-topic-specific-evidence |
| 2 | ap_breast-2a8fcd9a-2b21-4c2c-90de-aed238adba69 | Breast | Hemangioma | src/content/images/apcpboards_reference_images.json | image_atlas | promoted | category-only-needs-topic-specific-evidence |
| 3 | ap_breast-a932fcfa-fe27-4db4-8180-ca7b7289715f | Breast | Leiomyoma | src/content/images/apcpboards_reference_images.json | image_atlas | promoted | category-only-needs-topic-specific-evidence |
| 4 | ap_breast-ba5f6b06-f921-4a8e-9e91-24f117a6bf82 | Breast | Therapy induced changes | src/content/images/apcpboards_reference_images.json | image_atlas | promoted | category-only-needs-topic-specific-evidence |
| 5 | ap_gu-59e217f3-550d-40fb-ba59-d900d6d5a5af | Medical Kidney / GU | Non-proliferative glomerulonephropathies | src/content/images/acquiredLectureImages.json | lecture | promoted | category-only-needs-topic-specific-evidence |
| 6 | ap_gu-bc90e1cf-b575-4be6-95e0-95b105b8efaa | Medical Kidney / GU | Diverticula | src/content/images/acquiredLectureImages.json | lecture | promoted | category-only-needs-topic-specific-evidence |
| 7 | ap_gu-2acaf2ec-9515-4398-a7b4-6c624aa84638 | Medical Kidney / GU | Urethral polyp | src/content/images/acquiredLectureImages.json | lecture | promoted | category-only-needs-topic-specific-evidence |
| 8 | ap_gu-c7c74b2a-9d75-4b81-b78b-fdbf4e85c76d | Medical Kidney / GU | BCG effects | src/content/images/acquiredLectureImages.json | lecture | promoted | category-only-needs-topic-specific-evidence |
| 9 | ap_male_repro-bcadc6fc-94e8-4484-aa77-31ac0e5b95a5 | Male Reproductive | Extraprostatic extension | src/content/competency/apP0MaleReproCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 10 | ap_male_repro-416e8c98-54de-4305-a1ff-aaf044a4a7bd | Male Reproductive | Cryptorchidism | src/content/competency/apP0MaleReproCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 11 | ap_male_repro-ae24d27b-2eda-417d-b7ee-fa4393f3f2b2 | Male Reproductive | Bowenoid papulosis | src/content/competency/apP0MaleReproCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 12 | ap_cv-23a7bf9b-0c22-4d6b-9183-4e2c06cdef6b | Cardiovascular / Autopsy-adjacent | Atherosclerosis | src/content/competency/apP0CvAutopsyCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 13 | ap_cv-c47df9a9-4bd1-45a5-a431-2bbf77a24058 | Cardiovascular / Autopsy-adjacent | Vasculitis | src/content/competency/apP0CvAutopsyCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 14 | ap_cv-c2e622de-f2eb-4d9c-82b1-9e8ccd98bd9e | Cardiovascular / Autopsy-adjacent | Buerger disease | src/content/competency/apP0CvAutopsyCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 15 | ap_cv-49fc4c22-9c00-40c5-806e-d6defdaf5840 | Cardiovascular / Autopsy-adjacent | Lymphocytic myocarditis | src/content/competency/apP0CvAutopsyCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 16 | ap_hn-c3f3808b-3521-47c4-b450-f4bc59895f28 | Head and Neck | Nasal polyps | src/content/signout_sims/head_neck_signout_sims.json | lecture | mapped | category-only-needs-topic-specific-evidence |
| 17 | ap_hn-e147464f-7414-4b0b-8314-0df43d8a65c1 | Head and Neck | Contact ulcer | src/content/signout_sims/head_neck_signout_sims.json | lecture | mapped | category-only-needs-topic-specific-evidence |
| 18 | ap_hn-3f2828d1-0548-4223-b315-472755462369 | Head and Neck | Cysts | src/content/signout_sims/head_neck_signout_sims.json | lecture | mapped | category-only-needs-topic-specific-evidence |
| 19 | ap_hn-1b9a46e1-e23a-4566-ba21-44aa5e4ead9b | Head and Neck | Cholesteatoma | src/content/signout_sims/head_neck_signout_sims.json | lecture | mapped | category-only-needs-topic-specific-evidence |
| 20 | ap_hn-540484dc-3b23-4b10-9543-ece39e1c75b9 | Head and Neck | Infections | src/content/signout_sims/head_neck_signout_sims.json | lecture | mapped | category-only-needs-topic-specific-evidence |
| 21 | ap_gi-e82e42c2-650a-4059-91d2-7ee0cf263cb0 | Gastrointestinal | Mesenchymal tumors | src/content/competency/apP0GiCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 22 | ap_gi-147807c0-cb07-44ab-a1dd-3a85b7d0bc01 | Gastrointestinal | Meckel diverticulum | src/content/competency/apP0GiCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 23 | ap_gi-5ff86977-53f9-4fdd-b61d-2a8e3e37d7a8 | Gastrointestinal | Celiac disease and tropical sprue | src/content/competency/apP0GiCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 24 | ap_gi-8169481e-44b9-474e-819b-4737d5e2a486 | Gastrointestinal | Peptic duodenitis / ulcer | src/content/competency/apP0GiCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
| 25 | ap_gi-a2b54b0f-165e-4f7f-8313-3a4ee0768a26 | Gastrointestinal | Crohn disease | src/content/competency/apP0GiCardBatch.ts | image_atlas | mapped | category-only-needs-topic-specific-evidence |
