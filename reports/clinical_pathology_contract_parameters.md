# Clinical Pathology Contract Parameters

This mirrors the AP lecture-contract approach for Clinical Pathology, but uses laboratory medicine tasks: consultation, operational artifacts, safety escalation, and performance-in-practice evidence.

## Blood Banking/Transfusion Medicine

- Buildout status: promotion-ready seed depth
- Source root: Blood Banking/Transfusion Medicine
- Source anchors: 64
- Level mix: AR, C, F
- Available tutorials: 13
- Available MCQs: 5
- Available flashcards: 10
- Promotion gate: Promote when source anchors, tutorial/assessment assets, operational artifacts, safety actions, and remediation routing all pass validation.
- Required assets:
  - DAT panel
  - clerical check
  - unit segment testing
  - antibody screen
  - RhIg calculation
  - massive transfusion decision
  - case vignette with clinical decision point
  - deterministic answer key with escalation threshold
- Safety-critical actions:
  - stop transfusion
  - notify blood bank/clinical team
  - confirm patient/unit identity
  - escalate suspected hemolysis or TRALI/TACO
- Representative anchors:
  - Blood Banking/Transfusion Medicine (C)
  - Blood Banking/Transfusion Medicine > Clinical Practice (C)
  - Blood Banking/Transfusion Medicine > Clinical Practice > Autoimmune Hemolytic Anemia (C)
  - Blood Banking/Transfusion Medicine > Clinical Practice > Paroxysmal Nocturnal Hemoglobinuria (AR)
  - Blood Banking/Transfusion Medicine > Clinical Practice > Anemia in Oncology Patients (C)
  - Blood Banking/Transfusion Medicine > Clinical Practice > Immune Thrombocytopenia (C)
  - Blood Banking/Transfusion Medicine > Clinical Practice > Bleeding from Coagulation Defects (C)
  - Blood Banking/Transfusion Medicine > Clinical Practice > Bleeding from Coagulation Defects > Cirrhosis Coagulopathy (C)

## Hematopathology / Laboratory Hematology

- Buildout status: source-thin scaffold
- Source root: Hematopathology
- Source anchors: 5
- Level mix: AR, C
- Available tutorials: 0
- Available MCQs: 0
- Available flashcards: 0
- Promotion gate: Promote when source anchors, tutorial/assessment assets, operational artifacts, safety actions, and remediation routing all pass validation.
- Contract warnings:
  - Current structured CP seed provides 5 source anchors; add deeper source anchors and operational cases before canonical launch.
- Required assets:
  - peripheral smear
  - CBC histogram
  - coagulation panel
  - flow cytometry plot
  - bone marrow differential
  - case vignette with clinical decision point
  - deterministic answer key with escalation threshold
- Safety-critical actions:
  - recognize blasts/acute leukemia flags
  - escalate TTP/DIC/APL concern
  - recommend confirmatory testing
- Representative anchors:
  - Hematopathology (C)
  - Hematopathology > Red Blood Cell Disorders (C)
  - Hematopathology > Red Blood Cell Disorders > Hemoglobinopathy Analysis (AR)
  - Hematopathology > Red Blood Cell Disorders > Hemoglobinopathy Analysis > Hemoglobin Variants and Chains (C)
  - Hematopathology > Red Blood Cell Disorders > Hemoglobinopathy Analysis > Sickle Cell & Other Hemoglobinopathies (C)

## Clinical Microbiology

- Buildout status: source-thin scaffold
- Source root: Microbiology
- Source anchors: 5
- Level mix: AR, C
- Available tutorials: 0
- Available MCQs: 5
- Available flashcards: 10
- Promotion gate: Promote when source anchors, tutorial/assessment assets, operational artifacts, safety actions, and remediation routing all pass validation.
- Contract warnings:
  - Current structured CP seed provides 5 source anchors; add deeper source anchors and operational cases before canonical launch.
- Required assets:
  - Gram stain
  - culture plate
  - PCR result
  - antibiogram
  - O&P morphology
  - AFB/fungal workup
  - case vignette with clinical decision point
  - deterministic answer key with escalation threshold
- Safety-critical actions:
  - critical organism notification
  - infection-control escalation
  - avoid low-value tests from poor specimens
- Representative anchors:
  - Microbiology (C)
  - Microbiology > Parasitology (AR)
  - Microbiology > Bacteriology (C)
  - Microbiology > Mycology (AR)
  - Microbiology > Virology (C)

## Chemical Pathology

- Buildout status: source-thin scaffold
- Source root: Chemical Pathology
- Source anchors: 9
- Level mix: C
- Available tutorials: 0
- Available MCQs: 5
- Available flashcards: 10
- Promotion gate: Promote when source anchors, tutorial/assessment assets, operational artifacts, safety actions, and remediation routing all pass validation.
- Contract warnings:
  - Current structured CP seed provides 9 source anchors; add deeper source anchors and operational cases before canonical launch.
- Required assets:
  - chemistry panel
  - QC chart
  - calibration/linearity record
  - toxicology result
  - endocrine/metabolic panel
  - case vignette with clinical decision point
  - deterministic answer key with escalation threshold
- Safety-critical actions:
  - verify critical results
  - recognize assay interference
  - recommend repeat/alternate method when needed
- Representative anchors:
  - Chemical Pathology (C)
  - Chemical Pathology > Analytical Techniques and Safety (C)
  - Chemical Pathology > Analytical Techniques and Safety > Nephelometry Methods (C)
  - Chemical Pathology > Specimen Collection and Processing (C)
  - Chemical Pathology > Method Validation & QC (C)
  - Chemical Pathology > Method Validation & QC > Analytical Measurement Range (AMR) (C)
  - Chemical Pathology > Method Validation & QC > Carryover (C)
  - Chemical Pathology > Method Validation & QC > Coefficient of Variation (CV) (C)

