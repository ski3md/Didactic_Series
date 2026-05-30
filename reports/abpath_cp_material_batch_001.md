# ABPath CP Material Batch 001

Generated: 2026-05-30T04:38:42.861Z

## Slice

- Batch: abpath-cp-material-batch-001
- Source queue: src/content/materials/abpathMaterialExpansionQueue.json
- Domain: CP
- Subject: Blood Banking/Transfusion Medicine
- Path prefix: Blood Banking/Transfusion Medicine > RBCs and RBC Components
- Rows: 9
- Review state: unreviewed / review-queue

## Selection Rationale

Bounded RBC component and compatibility-testing slice with clear bench-facing artifacts and safety decisions.

## Promotion Guardrails

- Rows in this batch are unreviewed review-queue items, not authoritative teaching truth.
- Do not overwrite source-truth mappings, reviewed CP anchors, AP files, or shared validators from this batch.
- Promotion requires source path retention, bench-facing artifact evidence, faculty review, and explicit reviewer action.
- A generated bench artifact must show the clinical question, next lab check, interpretation path, and safety stop before promotion.

## Batch Rows

| Row | Source topic | Kind | Difficulty | Path hierarchy | Required artifact focus |
| --- | --- | --- | --- | --- | --- |
| abpath-cp-material-batch-001-row-01 | bb-3 | subheader | C | Blood Banking/Transfusion Medicine > RBCs and RBC Components | Use an RBC component selection or compatibility workflow card tied to transfusion-service action. |
| abpath-cp-material-batch-001-row-02 | bb-3-d | subject | C | Blood Banking/Transfusion Medicine > RBCs and RBC Components > Red Cell Immunology and Compatibility Testing | Use an antibody screen, crossmatch, or compatibility-testing worksheet with the safest next check marked. |
| abpath-cp-material-batch-001-row-03 | bb-3-e | subject | C | Blood Banking/Transfusion Medicine > RBCs and RBC Components > Carbohydrate Blood Groups (ABH) | Use a blood-group antigen/antibody interpretation table tied to component selection or escalation. |
| abpath-cp-material-batch-001-row-04 | bb-3-f | subject | C | Blood Banking/Transfusion Medicine > RBCs and RBC Components > Rh and LW Blood Group Systems | Use a blood-group antigen/antibody interpretation table tied to component selection or escalation. |
| abpath-cp-material-batch-001-row-05 | bb-3-g | subject | AR | Blood Banking/Transfusion Medicine > RBCs and RBC Components > Other Protein Blood Group Systems (Kell, Duffy, Kidd) | Use a blood-group antigen/antibody interpretation table tied to component selection or escalation. |
| abpath-cp-material-batch-001-row-06 | bb-3-h | subject | AR | Blood Banking/Transfusion Medicine > RBCs and RBC Components > High-Incidence Antibodies | Use a blood-group antigen/antibody interpretation table tied to component selection or escalation. |
| abpath-cp-material-batch-001-row-07 | bb-3-i | subject | C | Blood Banking/Transfusion Medicine > RBCs and RBC Components > Cold Reactive Autoantibodies | Use a blood-group antigen/antibody interpretation table tied to component selection or escalation. |
| abpath-cp-material-batch-001-row-08 | bb-3-j | subject | AR | Blood Banking/Transfusion Medicine > RBCs and RBC Components > Red Cell Genotyping | Use an RBC genotype-to-antigen phenotype interpretation card with transfusion-service consequence. |
| abpath-cp-material-batch-001-row-09 | bb-3-k | subject | C | Blood Banking/Transfusion Medicine > RBCs and RBC Components > P1 Antigen | Use a blood-group antigen/antibody interpretation table tied to component selection or escalation. |

## Review Rule

Every row remains unreviewed and in the review queue until a human reviewer attaches evidence and explicitly promotes it.
