# CP Content Backlog Mapping And Strategy Directive

Date: 2026-05-17
Mode: OBSERVE-first because the repo is already dirty per `AGENTS.md`
Scope: Parse local repo plus `/Volumes/NetBackup` and `/Volumes/APCPBoards` for CP content not yet represented or not yet properly surfaced in `Didactic_Series`, then execute a sequential promotion plan without widening into unrelated AP work.

## Why this exists

This directive is the pick-up point for continued CP buildout. It is meant to prevent re-discovery work and keep the next sessions aligned to:

- the existing CP governance model
- the ABPath CP precision anchor contract
- the current didactics UX contract
- the real source inventory already available on local volumes

## Current truth

The CP app surface is not empty. It is uneven.

- Strongest surfaced areas: transfusion, chemistry, microbiology, heme basics
- Weakest governed root: management and informatics
- Most important hidden pattern: several CP topics already exist in normalized/tutorial imports or validation reports, but are not elevated into the governed front door

Crosswalk root counts from `reports/tutorial_abpath_spec_crosswalk.md`:

- Blood Banking/Transfusion Medicine: `816 | 201 | 127`
- Chemical Pathology: `644 | 124 | 61`
- Hematopathology for Clinical Pathology: `282 | 76 | 37`
- Management and Informatics: `150 | 31 | 8`
- Medical Microbiology: `529 | 72 | 41`

Current front-door governed CP curriculum modules in `src/content/curriculum/activeCurriculum.ts`:

1. Clinical Pathology Foundations
2. Hematology and Red Cell Disorders
3. Coagulation and Hemostasis Core
4. Transfusion and Cellular Therapy Core
5. Clinical Microbiology Core
6. Chemical Pathology Core

Current native CP interactive studios in `src/content/tutorials/clinicalPathInteractiveTutorials.json`:

1. Clinical Microbiology Methods and AST Studio
2. Flow Cytometry and Hematopathology Studio
3. DAT and Hemolytic Transfusion Reaction Studio
4. Chemical Pathology Endocrine and Metabolic Studio
5. Immune Recognition and Lipid Metabolism Studio

## Priority gap map

### Tier 1: most underrepresented and highest-value next promotions

1. Management and Informatics
2. Molecular Pathology / Cytogenetics / Genomic Testing
3. Clinical Toxicology / Therapeutic Drug Monitoring / Calculations
4. Urinalysis / Body Fluids

### Tier 2: present, but materially flatter than source inventory supports

5. Coagulation / Hemostasis deepening
6. Medical Microbiology subdivision
7. Hematology / Hematopathology deepening

## External source map

### 1. Management and Informatics

Primary files:

- `/Volumes/NetBackup/Clinical Pathology Management Master.html`
- `/Volumes/NetBackup/LabManagement3.html`
- `/Volumes/NetBackup/labmanagement.html`
- `/Volumes/NetBackup/labmanagement_detailed.html`
- `/Volumes/NetBackup/labmanagement_formulae.html`
- `/Volumes/NetBackup/Levey Jennings Charts.zip`
- `/Volumes/APCPBoards/Comprehensive Review of Lab Management & Informatics for the ABPath Certifying Exam.docx`
- `/Volumes/APCPBoards/Informatics.zip`

Build objective:

- Promote this from the weakest governed root into a first-class CP lane with lecture, tutorial, operational artifact, QC chart interpretation, and answer-keyed review items.

### 2. Molecular Pathology / Cytogenetics / Genomic Testing

Primary files:

- `/Volumes/NetBackup/Molecular Pathology Quick Guide.docx`
- `/Volumes/NetBackup/Molecular_Questions.html`
- `/Volumes/NetBackup/Molecular_Review.html`
- `/Volumes/NetBackup/Molecular_flashcards.html`
- `/Volumes/NetBackup/molecular_algorithsm.html`
- `/Volumes/NetBackup/Microsatellite Instability Review.docx`

Build objective:

- Convert buried molecular/tutorial imports into a governed CP branch with ABPath anchor layer plus board-mastery layer, without falsely labeling cross-cutting AP molecular content as pure CP.

### 3. Clinical Toxicology / TDM / Calculations

Primary files:

- `/Volumes/APCPBoards/2024APCP/Calculations in Boards.ppt`
- `/Volumes/APCPBoards/2024APCP/Calculations in Boards_05-02-2015.ppt`
- `/Volumes/APCPBoards/PGY4 CU Pathology Board Prep Series (2024-2025)/Clinical Toxicology.pptx`
- `/Volumes/NetBackup/lab_domain_extensions_v1p4_pk_kinetics_quiz.html`
- `/Volumes/NetBackup/lab_domain_extensions_v1p4_pk_kinetics_quiz (1).html`
- `/Volumes/NetBackup/lab_domain_extensions_v1p5_integrated.html`
- `/Volumes/NetBackup/lab_domain_extensions_v1p5_1_integrated_patched.html`

Build objective:

- Establish a chemistry-adjacent but explicit CP lane for toxicology, TDM, and board-style calculations.

### 4. Urinalysis / Body Fluids

Primary files:

- `/Volumes/APCPBoards/2024APCP/Urine Sediments_Pan_2021.pptx`
- `/Volumes/APCPBoards/MD Daniel D. Mais, MASCP Kimberly W. Sanford, MD - Quick Compendium of Clinical Pathology 5th edition-ASCP (2023).pdf`
- `/Volumes/APCPBoards/Richard A. McPherson, Matthew R. Pincus - Henry's Clinical Diagnosis and Management by Laboratory Methods-Elsevier Inc. (2022).pdf`

Build objective:

- Create a visible CP lane for urine sediment interpretation, body-fluid patterning, and specimen-based bench reasoning.

### 5. Coagulation / Hemostasis deepening

Primary files:

- `/Volumes/NetBackup/Coag Cascade Simulator v2.4 — Color Deltas, Pearls, Export.html`
- `/Volumes/NetBackup/Coag Defects.docx`
- `/Volumes/NetBackup/Laboratory Evaluation of Hemostasis .docx`
- `/Volumes/NetBackup/lupus_anticoag_dashboard.html`
- `/Volumes/NetBackup/lupus_anticoag_dashboard_v2.html`
- `/Volumes/NetBackup/lupus_anticoag_dashboard_v3.html`
- `/Volumes/APCPBoards/2024APCP/Hematology_PLT & Coag_03-14-13.ppt`
- `/Volumes/APCPBoards/coagulation_chicago (540p).mp4`

Build objective:

- Expand from one broad module into a robust interpretation pathway for inhibitors, platelet disorders, mixing studies, anticoagulant monitoring, and urgent hemostasis escalation.

### 6. Medical Microbiology subdivision

Primary files:

- `/Volumes/APCPBoards/2024APCP/Micro_Bacteriology_05-02-2013.ppt`
- `/Volumes/APCPBoards/2024APCP/Micro_Mycobacteriology_05-06-2015.ppt`
- `/Volumes/APCPBoards/2024APCP/Micro_Parasitology_05-06-2015.ppt`
- `/Volumes/APCPBoards/2024APCP/Micro_Virology_05-06-2015.ppt`
- `/Volumes/NetBackup/Clinical Micro Methods & AST — Interactive Dashboard.html`
- `/Volumes/NetBackup/interactive_micro_tutor_turnkey_pro.html`
- `/Volumes/NetBackup/virtual-mycology-simulator.zip`
- `/Volumes/NetBackup/Mycobacterium_leprae_and_Leprosy_Pathogenesis_Interactive.html`
- `/Volumes/NetBackup/Needlestick_Injuries__Understanding_Viral_Transmission_Risks_in_Healthcare_Settings_Interactive.html`

Build objective:

- Split current microbiology strength into explicit bacteriology, mycology, virology, parasitology, and bench/infection-control branches.

### 7. Hematology / Hematopathology deepening

Primary files:

- `/Volumes/APCPBoards/2024APCP/Hematology_RBC_09-28-15.ppt`
- `/Volumes/APCPBoards/2024APCP/Hematology_WBC_05-15-17.ppt`
- `/Volumes/APCPBoards/2024APCP/Hematology_Marrow_12-18-13.ppt`
- `/Volumes/NetBackup/Benign_Heme.html`
- `/Volumes/NetBackup/Heme_Review.html`
- `/Volumes/NetBackup/HemeSims.html`
- `/Volumes/NetBackup/InteractiveHeme.html`
- `/Volumes/NetBackup/FlowCytometry_SimandCases.html`

Build objective:

- Deepen beyond one flow/heme studio into RBC, WBC, marrow, benign heme, and urgent hematology interpretation pathways.

## Execution order

Work sequentially in this exact order unless a later session explicitly reprioritizes:

1. Management and Informatics
2. Molecular Pathology / Cytogenetics / Genomic Testing
3. Clinical Toxicology / TDM / Calculations
4. Urinalysis / Body Fluids
5. Coagulation / Hemostasis deepening
6. Medical Microbiology subdivision
7. Hematology / Hematopathology deepening

## Strategy directive

For each content lane, run the same five-step sequence:

### Step 1. Source parse

- inventory source files
- extract content type: lecture, tutorial, simulator, flashcard, quiz, algorithm, image set
- identify duplicates, near-duplicates, and stale variants
- isolate the best canonical source before promoting anything

### Step 2. ABPath mapping

- map every asset to the deepest valid ABPath CP node
- if not literal, use the CP governance contract:
  - `nearest-valid-deep`
  - `cross-domain-governed`
  - `local-teaching-only`
- keep the board-mastery label subordinate to the official ABPath frame

### Step 3. Promotion decision

Promote assets only into one of these surfaces:

- governed CP lecture
- governed CP tutorial
- governed CP interactive studio
- governed CP quick check / flashcard / review-grid item

Do not leave content living only as buried imports if it is chosen for promotion.

### Step 4. Content normalization

- professionalize formatting
- remove source-noise, internal annotations, and duplicate headers
- reduce cognitive burden
- make scope visible quickly at the top of each teaching session
- keep deterministic answer keys where possible

### Step 5. Verification

- build
- CP governance validation
- label validation
- crosswalk regeneration if mappings changed
- route-level verification in the didactics UI

## Stop conditions for each lane

Do not mark a lane complete until:

1. the source file set is canonicalized
2. the lane has explicit ABPath CP anchors
3. the lane is reachable from the current public CP structure
4. the lane has at least one assessment/retrieval surface
5. the lane does not depend on provenance labels or hidden imports to be discoverable

## What to do first on resume

Resume with:

1. `Management and Informatics`
2. identify the best canonical source among the management HTML files and APCPBoards informatics files
3. draft the governed lane contract
4. promote the first lecture/tutorial/interactive surface

If time remains in the same session, continue directly into:

5. `Molecular Pathology / Cytogenetics / Genomic Testing`

## Do not do this

- do not widen into unrelated AP work
- do not promote multiple near-duplicate source variants at once
- do not imply ABPath literal coverage when the mapping is only nearest-valid-deep
- do not create a separate CP product surface outside the existing didactics architecture
- do not mutate the dirty repo casually without a bounded lane objective

## Canonical local reference files to use while resuming

- `src/content/clinical_pathology/cpGovernanceModules.json`
- `src/content/tutorials/clinicalPathInteractiveTutorials.json`
- `src/content/clinical_pathology/cpContentContracts.json`
- `reports/clinical_pathology_contract_parameters.md`
- `reports/tutorial_abpath_spec_crosswalk.md`
- `src/content/downloads_imports/planning/promotion_priority.json`

## Resume sentence

Use this exact resume framing:

`Continue the CP backlog from the 2026-05-17 directive, starting with Management and Informatics in OBSERVE mode, then promote only the strongest canonical sources into the governed didactics surface.`
