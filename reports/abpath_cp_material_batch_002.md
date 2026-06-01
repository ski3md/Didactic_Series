# ABPath CP Material Batch 002

Generated: 2026-06-01T22:01:01.732Z

## Slice

- Batch: abpath-cp-material-batch-002
- Source queue: src/content/materials/abpathMaterialExpansionQueue.json
- Domain: CP
- Subject: Blood Banking/Transfusion Medicine
- Path prefix: Blood Banking/Transfusion Medicine
- Rows: 4
- Review state: unreviewed / review-queue
- Prior batch excluded: abpath-cp-material-batch-001

## Selection Rationale

Next sequential CP blood-bank slice after RBC/components batch 001: anemia/RBC transfusion plus adjacent apheresis consult and post-TPE bench decisions.

## Promotion Guardrails

- Rows in this batch are unreviewed review-queue items, not authoritative teaching truth.
- Do not overwrite source-truth mappings, reviewed CP anchors, AP files, batch 001 files, queue generators, or shared validators from this batch.
- Promotion requires source path retention, bench-facing artifact evidence, faculty review, and explicit reviewer action.
- A generated bench artifact must show the clinical question, next lab check, interpretation path, operational handoff, and safety stop before promotion.

## Batch Rows

| Row | Source topic | Kind | Difficulty | Path hierarchy | Required artifact focus |
| --- | --- | --- | --- | --- | --- |
| abpath-cp-material-batch-002-row-01 | bb-4 | subheader | C | Blood Banking/Transfusion Medicine > Anemia and Red Blood Cell Transfusion | Use a transfusion-threshold and product-selection worksheet tied to symptoms, hemoglobin trend, and active bleeding risk. |
| abpath-cp-material-batch-002-row-02 | bb-5 | subheader | AR | Blood Banking/Transfusion Medicine > Apheresis | Use an apheresis consult triage card that links indication, urgency, access/anticoagulation checks, and escalation path. |
| abpath-cp-material-batch-002-row-03 | bb-5-a | subject | AR | Blood Banking/Transfusion Medicine > Apheresis > Plasma Exchange for IgM Removal | Use a therapeutic plasma exchange order-review card showing indication, replacement-fluid choice, and handoff trigger. |
| abpath-cp-material-batch-002-row-04 | bb-5-b | subject | AR | Blood Banking/Transfusion Medicine > Apheresis > Coagulation Factor Return Post-TPE | Use a post-TPE coagulation recovery checklist with fibrinogen/PT/PTT interpretation and bleeding-risk escalation. |

## Review Rule

Every row remains unreviewed and in the review queue until a human reviewer attaches evidence and explicitly promotes it.
