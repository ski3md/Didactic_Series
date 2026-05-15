export const apP0PediatricCardBatch = {
  "generatedAt": "2026-05-15T22:26:38.368Z",
  "sourcePlan": "reports/ap_gap_closure_plan.json",
  "sourceQueue": "src/content/competency/apGapClosureQueue.ts",
  "facultyPacketPath": "reports/ap_p0_pediatric_card_batch_faculty_packet.md",
  "facultyPacketCsvPath": "reports/ap_p0_pediatric_card_batch_faculty_packet.csv",
  "batchName": "P0 pediatric/perinatal entity card batch",
  "batchStrategy": "First up to 24 unused P0 Pediatric / Perinatal rows from the AP gap closure queue, preserving source order and requiring age/gestational-age aware taxonomy QA before medical authoring.",
  "sourceCategory": "ap_pediatric",
  "sourceP0Rows": 24,
  "excludedExistingSourceQueueIds": 158,
  "selectedRows": 24,
  "status": "draft pediatric/perinatal scaffolds awaiting taxonomy QA, source-backed content, visual anchors, retrieval answer keys, and faculty review",
  "batchReadiness": {
    "completedGates": 0,
    "reviewReadyGates": 24,
    "missingGates": 96,
    "totalGates": 120,
    "percentComplete": 0,
    "percentReviewReady": 20
  },
  "readinessLegend": {
    "complete": "Evidence is present and reviewed.",
    "ready-for-review": "Structured scaffold exists and needs pediatric/perinatal faculty confirmation.",
    "missing": "Required content, visual asset, source, answer key, or reviewer evidence is not yet attached."
  },
  "cards": [
    {
      "id": "p0-pediatric-card-01-53c3d45f-e918-4719-ba20-8bd2a2df8c33",
      "sourceQueueId": "ap_pediatric-53c3d45f-e918-4719-ba20-8bd2a2df8c33",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Amniotic Fluid",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Conception > Amniotic Fluid",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15156,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Amniotic Fluid.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15156; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-02-edce1a14-3322-4d19-971e-e3ad01ba2425",
      "sourceQueueId": "ap_pediatric-edce1a14-3322-4d19-971e-e3ad01ba2425",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Oligohydraminos",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Oligohydraminos",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15157,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Oligohydraminos.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15157; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-03-115bd499-d674-43ee-a47e-1ac4231ea7a1",
      "sourceQueueId": "ap_pediatric-115bd499-d674-43ee-a47e-1ac4231ea7a1",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Polyhydramnios",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Polyhydramnios",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15158,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Polyhydramnios.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15158; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-04-dc2bf925-e9ed-4ee2-9f8e-43382ae95260",
      "sourceQueueId": "ap_pediatric-dc2bf925-e9ed-4ee2-9f8e-43382ae95260",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Membranes",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Membranes",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15161,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Membranes.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15161; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-05-d7733cc3-1bd4-46d1-873f-3fe9faaf6464",
      "sourceQueueId": "ap_pediatric-d7733cc3-1bd4-46d1-873f-3fe9faaf6464",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Basal Plate",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Basal Plate",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15227,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Basal Plate.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15227; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-06-035f141c-2ee9-4fda-b8b6-19882e524879",
      "sourceQueueId": "ap_pediatric-035f141c-2ee9-4fda-b8b6-19882e524879",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Intragestational Fetal Loss",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Placental Tumors > Intragestational Fetal Loss",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15355,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Intragestational Fetal Loss.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15355; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-07-b0db1180-dfeb-47b7-92de-f014b241b6c6",
      "sourceQueueId": "ap_pediatric-b0db1180-dfeb-47b7-92de-f014b241b6c6",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Complete Hydatidiform Mole",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Placental Tumors > Complete Hydatidiform Mole",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15361,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Complete Hydatidiform Mole.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15361; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-08-f558646f-4ec5-4697-994a-ef02c82a9c73",
      "sourceQueueId": "ap_pediatric-f558646f-4ec5-4697-994a-ef02c82a9c73",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Invasive Mole",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Placental Tumors > Complete Hydatidiform Mole > Invasive Mole",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15362,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Invasive Mole.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15362; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-09-628bb1d8-861b-47e7-98a6-e2212b89bcff",
      "sourceQueueId": "ap_pediatric-628bb1d8-861b-47e7-98a6-e2212b89bcff",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Hypertension",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Placental Tumors > Hypertension",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15365,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Hypertension.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15365; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-10-4ee484f9-211f-41bd-9020-f9af3b634487",
      "sourceQueueId": "ap_pediatric-4ee484f9-211f-41bd-9020-f9af3b634487",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Diabetes",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Placental Tumors > Diabetes",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15366,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Diabetes.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15366; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-11-45e38801-0adb-49d9-84bd-be16c19fc785",
      "sourceQueueId": "ap_pediatric-45e38801-0adb-49d9-84bd-be16c19fc785",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Early (First Trimester)",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Perinatal Pathology: Fetal/Neonatal Pathophysiology > Early (First Trimester)",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15424,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Early (First Trimester).",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15424; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-12-c0206ff1-a17f-4ea8-8e1a-21ce0d37acc5",
      "sourceQueueId": "ap_pediatric-c0206ff1-a17f-4ea8-8e1a-21ce0d37acc5",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Changes in Fetal Tissues after Fetal Death",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Perinatal Pathology: Fetal/Neonatal Pathophysiology > Late (Second and Third Trimester) Post-Term Pregnancy > Changes in Fetal Tissues after Fetal Death",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15426,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Changes in Fetal Tissues after Fetal Death.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15426; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-13-9114a7c7-1376-4885-a413-d49b7739bd07",
      "sourceQueueId": "ap_pediatric-9114a7c7-1376-4885-a413-d49b7739bd07",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Fetal Growth and Development",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Perinatal Pathology: Fetal/Neonatal Pathophysiology > Fetal Growth and Development",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15427,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Fetal Growth and Development.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15427; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-14-fbbb6e02-23de-4ead-b58a-48ce263a669e",
      "sourceQueueId": "ap_pediatric-fbbb6e02-23de-4ead-b58a-48ce263a669e",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Abnormal Growth / Maturation / Ossification",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Perinatal Pathology: Fetal/Neonatal Pathophysiology > Abnormal Growth / Maturation / Ossification",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15428,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Abnormal Growth / Maturation / Ossification.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15428; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-15-f10901f9-ebaa-4127-bb2a-21acbd029242",
      "sourceQueueId": "ap_pediatric-f10901f9-ebaa-4127-bb2a-21acbd029242",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Large for Gestation Age",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Perinatal Pathology: Fetal/Neonatal Pathophysiology > Intrauterine Growth Restriction > Large for Gestation Age",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15484,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Large for Gestation Age.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15484; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-16-74ce2fa2-4ca3-4b5d-8a2e-76f35bbb14d2",
      "sourceQueueId": "ap_pediatric-74ce2fa2-4ca3-4b5d-8a2e-76f35bbb14d2",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Immune",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Perinatal Pathology: Fetal/Neonatal Pathophysiology > Immune",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15486,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Immune.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15486; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-17-91b590ba-fbca-4f07-b904-87975799e98f",
      "sourceQueueId": "ap_pediatric-91b590ba-fbca-4f07-b904-87975799e98f",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Non-Immune",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Perinatal Pathology: Fetal/Neonatal Pathophysiology > Non-Immune",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15487,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Non-Immune.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15487; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-18-a9a38ce9-a4f4-4475-810f-a59192665f40",
      "sourceQueueId": "ap_pediatric-a9a38ce9-a4f4-4475-810f-a59192665f40",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Syndromes",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Perinatal Pathology: Fetal/Neonatal Pathophysiology > Syndromes",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15489,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Syndromes.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15489; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-19-8daf77da-451d-4ba4-ba24-a93b10258c2b",
      "sourceQueueId": "ap_pediatric-8daf77da-451d-4ba4-ba24-a93b10258c2b",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Iatrogenic Complications",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Retinopathy of Prematurity > Iatrogenic Complications",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15509,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Iatrogenic Complications.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15509; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-20-73666072-c31e-49e3-9f76-c3ba0bc37e44",
      "sourceQueueId": "ap_pediatric-73666072-c31e-49e3-9f76-c3ba0bc37e44",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Nutritional Disorders",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > Retinopathy of Prematurity > Nutritional Disorders",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15511,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Nutritional Disorders.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15511; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-21-a7e60e24-167d-4f53-8af3-06e20673d489",
      "sourceQueueId": "ap_pediatric-a7e60e24-167d-4f53-8af3-06e20673d489",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Genetic and Chromosomal Disorders",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > General Pathologic Principles and Syndromes > Genetic and Chromosomal Disorders",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15556,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Genetic and Chromosomal Disorders.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15556; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-22-b8f5e1b8-3b77-4fee-88af-3704d1194c29",
      "sourceQueueId": "ap_pediatric-b8f5e1b8-3b77-4fee-88af-3704d1194c29",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Trisomy 21",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > General Pathologic Principles and Syndromes > Trisomy 21",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15557,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Trisomy 21.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15557; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-23-2ee4906d-9e5c-426a-87f9-506f95251f5a",
      "sourceQueueId": "ap_pediatric-2ee4906d-9e5c-426a-87f9-506f95251f5a",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Trisomy 13",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > General Pathologic Principles and Syndromes > Trisomy 13",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15558,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Trisomy 13.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15558; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    },
    {
      "id": "p0-pediatric-card-24-4f183c9b-06e4-407c-987a-dd93580113da",
      "sourceQueueId": "ap_pediatric-4f183c9b-06e4-407c-987a-dd93580113da",
      "editorialStatus": "draft-scaffold",
      "priority": "P0 core board/sign-out gap",
      "title": "Trisomy 18",
      "category": "Pediatric / Perinatal",
      "domain": "Placental and maternal-fetal pathology",
      "rotation": "Pediatric pathology",
      "apSpecPath": "Pediatric Pathology Topics for Anatomic Pathology Residents > Perinatal Pathology: Placental-Maternal-Fetal Relationships in Pregnancy > General Pathologic Principles and Syndromes > Trisomy 13 > Trisomy 18",
      "learnerLevel": "PGY1-PGY2",
      "difficulty": "C",
      "sourceLine": 15559,
      "specimenContext": "placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available",
      "normalComparatorPrompt": "gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition",
      "visualAnchorPlan": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator",
      "reportingConsequencePrompt": "gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing",
      "mimicFrame": "normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection",
      "entityCardSections": [
        "Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment",
        "Definition and scope in one learner-safe sentence",
        "Age or gestational-age appropriate normal comparator before abnormal pattern",
        "Gross, developmental, or low-power architecture anchor",
        "High-power, ancillary, genetic, or clinicopathologic confirmatory cue",
        "Top mimic and single best discriminator",
        "Report, autopsy summary, recurrence-risk, or follow-up consequence",
        "Pitfall that could create a clinically meaningful pediatric/perinatal miss"
      ],
      "retrievalPrompts": [
        "Before reveal: identify the pediatric/perinatal entity or process represented by Trisomy 18.",
        "State the age or gestational-age comparator that must be checked before calling it abnormal.",
        "Name the closest mimic and the discriminator that separates them.",
        "State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.",
        "Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically."
      ],
      "spacingSchedule": [
        "same session",
        "1 day",
        "3 days",
        "7 days",
        "21 days"
      ],
      "facultyReviewChecklist": [
        "Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.",
        "Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.",
        "Age or gestational-age dependency is explicit and clinically safe.",
        "Visual anchor is local/licensed or has an explicit no-image rationale.",
        "Retrieval answer key is faculty-reviewed before learner reveal.",
        "One contrastive near-miss is included for durable discrimination.",
        "Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality."
      ],
      "completionGate": "Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.",
      "gateStatuses": [
        {
          "id": "taxonomy-qa",
          "label": "Taxonomy QA",
          "status": "ready-for-review",
          "evidence": "Generated from Pediatric / Perinatal AP specification path at source line 15559; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching."
        },
        {
          "id": "content-authoring",
          "label": "Entity card content",
          "status": "missing",
          "evidence": "Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall."
        },
        {
          "id": "visual-anchor",
          "label": "Visual anchor",
          "status": "missing",
          "evidence": "gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator"
        },
        {
          "id": "retrieval-key",
          "label": "Retrieval answer key",
          "status": "missing",
          "evidence": "Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached."
        },
        {
          "id": "faculty-review",
          "label": "Faculty review",
          "status": "missing",
          "evidence": "Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached."
        }
      ],
      "readiness": {
        "completedGates": 0,
        "reviewReadyGates": 1,
        "missingGates": 4,
        "totalGates": 5,
        "percentComplete": 0,
        "percentReviewReady": 20
      }
    }
  ]
} as const;
