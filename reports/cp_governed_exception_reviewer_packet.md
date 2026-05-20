# CP Governed Exception Reviewer Packet

Generated: 2026-05-20T10:51:21.287Z

Source: `reports/validated_mappings_manifest.json`

## Summary

- Exception tutorials: 13
- Precision modes: cross-domain-governed (2), nearest-valid-deep (11)
- Roots covered: Blood Banking/Transfusion Medicine (1), Chemical Pathology (1), Chemical Pathology + Blood Banking/Transfusion Medicine (1), Hematopathology for Clinical Pathology (4), Management and Informatics (3), Medical Microbiology (3)

## Review Queue

| Tutorial | Root | Primary path | Precision mode | Confidence | Review owner | Review action | Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| respiratory-viruses | Medical Microbiology | Medical Microbiology > Viruses and Prions > Specific Viruses | nearest-valid-deep | moderate | Didactics governance review | Keep respiratory virus teaching under CP microbiology unless a narrower governed virus cluster is added later. | respiratory-virus teaching spans multiple organism nodes, so the validated microbiology umbrella is safer than an AP pulmonary infection match |
| topic-mb-3-a | Medical Microbiology | Medical Microbiology > Viruses and Prions > Specific Viruses | nearest-valid-deep | moderate | Didactics governance review | Keep respiratory virus teaching under CP microbiology unless a narrower governed virus cluster is added later. | respiratory-virus teaching spans multiple organism nodes, so the validated microbiology umbrella is safer than an AP pulmonary infection match |
| topic-mol-1 | Hematopathology for Clinical Pathology | Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Molecular Testing | nearest-valid-deep | moderate | CP governance review | Keep molecular methods teaching subordinate to the validated CP testing anchor. | workflow concept distributed across multiple spec nodes |
| topic-mol-2 | Hematopathology for Clinical Pathology | Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Molecular Testing | cross-domain-governed | moderate | CP governance review | Present the disease-site labels as board-mastery teaching focus under the CP molecular testing frame. | This tutorial teaches method-centered molecular interpretation across disease sites; ABPath CP supports a governed testing anchor, but not a literal solid-tumor molecular node. |
| topic-mol-3 | Hematopathology for Clinical Pathology | Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Molecular Testing | nearest-valid-deep | high | CP governance review | Promote under the CP hematopathology testing frame and keep entity-specific molecular labels subordinate. | disease narrower than CP spec |
| cp-micro-methods-ast-studio | Medical Microbiology | Medical Microbiology > Bacteria, including Mycobacteria, Nocardia, and other Aerobic Actinomycetes > Identification Methods and Instrumentation | nearest-valid-deep | moderate | Didactics governance review | Complete CP governance review before promotion. | workflow concept distributed across multiple spec nodes |
| cp-flow-heme-studio | Hematopathology for Clinical Pathology | Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Flow Cytometry | nearest-valid-deep | moderate | Didactics governance review | Complete CP governance review before promotion. | interactive artifact teaches operational interpretation |
| cp-dat-transfusion-studio | Blood Banking/Transfusion Medicine | Blood Banking/Transfusion Medicine > Clinical Practice > Autoimmune Hemolytic Anemia | nearest-valid-deep | moderate | Didactics governance review | Complete CP governance review before promotion. | workflow concept distributed across multiple spec nodes |
| cp-mgmt-break-even-studio | Management and Informatics | Management and Informatics > Budgeting and Financial > Management of Unit Costs | nearest-valid-deep | moderate | Didactics governance review | Complete CP governance review before promotion. | interactive artifact teaches operational interpretation |
| cp-mgmt-reagent-rental-studio | Management and Informatics | Management and Informatics > Budgeting and Financial | nearest-valid-deep | moderate | Didactics governance review | Complete CP governance review before promotion. | modern entity not literal in spec |
| cp-mgmt-productivity-studio | Management and Informatics | Management and Informatics > Budgeting and Financial | nearest-valid-deep | moderate | Didactics governance review | Complete CP governance review before promotion. | interactive artifact teaches operational interpretation |
| cp-chemical-path-endocrine-studio | Chemical Pathology | Chemical Pathology > The Adrenal Cortex > Adrenocortical Steroids > General Biochemistry and Metabolism of Adrenocortical Steroids | nearest-valid-deep | moderate | Didactics governance review | Complete CP governance review before promotion. | disease narrower than CP spec |
| cp-immune-lipid-studio | Chemical Pathology + Blood Banking/Transfusion Medicine | Chemical Pathology > Lipids, Lipoproteins and Apolipoproteins | cross-domain-governed | moderate | Didactics governance review | Complete CP governance review before promotion. | The lipid branch is governed by Chemical Pathology while the allorecognition branch borrows HLA significance from the transfusion and transplant side of CP. The tutorial is kept together because it teaches mechanism-linked interpretation across those adjacent CP domains. |

## Completion Gate

- Do not remove a tutorial from this packet unless the manifest no longer treats it as a governed CP exception.
- Do not widen this packet to AP review drift; this surface is only for the current CP-truth exception queue.
