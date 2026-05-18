# CP Management And Informatics Source Selection

Date: 2026-05-17
Mode: OBSERVE-first source selection
Lane: Management and Informatics

## Purpose

Select the strongest canonical source set for the first underrepresented CP lane so promotion can begin without dragging duplicate or noisy files into the public didactics surface.

## Source candidates reviewed

### NetBackup HTML set

- `/Volumes/NetBackup/Clinical Pathology Management Master.html`
- `/Volumes/NetBackup/LabManagement3.html`
- `/Volumes/NetBackup/labmanagement.html`
- `/Volumes/NetBackup/labmanagement_detailed.html`
- `/Volumes/NetBackup/labmanagement_formulae.html`

### APCPBoards support set

- `/Volumes/APCPBoards/Comprehensive Review of Lab Management & Informatics for the ABPath Certifying Exam.docx`
- `/Volumes/APCPBoards/Informatics.zip`

### NetBackup QC support set

- `/Volumes/NetBackup/Levey Jennings Charts.zip`

## Findings

### 1. The management HTML files are one family, not five distinct products

All five reviewed HTML files resolve to the same core title:

- `Clinical Pathology Management Master`

Repeated structural signals across these files:

- dashboard framing
- case studies
- PPV / NPV
- financial principle / break-even volume
- explanation / analysis sections

Interpretation:

- these appear to be iterative variants of the same teaching workspace
- they should not all be promoted
- one canonical interactive source should be chosen, with one secondary reference if needed for content comparison only

### 2. Best canonical interactive source

Recommended canonical interactive source:

- `/Volumes/NetBackup/labmanagement_formulae.html`

Why:

- largest of the HTML family
- includes case studies, dashboard behavior, challenges, leaderboard, and explicit formula-oriented review
- most likely to support a board-facing management and informatics teaching session without requiring immediate recombination from multiple weaker variants

Recommended secondary comparison source:

- `/Volumes/NetBackup/Clinical Pathology Management Master.html`

Why:

- similar framework
- slightly cleaner high-level structure for dashboard, case studies, break-even, and predictive-value teaching
- useful for content reconciliation if the formulae build contains clutter or gimmick elements that should be stripped before promotion

### 3. Best regulatory and breadth reference

Recommended canonical reference backbone:

- `/Volumes/APCPBoards/Comprehensive Review of Lab Management & Informatics for the ABPath Certifying Exam.docx`

Why:

- explicitly board-oriented
- broad topic coverage visible immediately:
  - CLIA
  - CAP
  - OSHA
  - HIPAA
  - CMS
  - FDA
  - Lean Six Sigma
  - workflow phases
- stronger for formal topic coverage than the HTML dashboard family alone

Role:

- do not treat as the public interactive source
- use as the content-governance and coverage backbone for management/informatics lecture and tutorial contracts

### 4. Best QC artifact source

Recommended canonical QC support source:

- `/Volumes/NetBackup/Levey Jennings Charts.zip`

Why:

- directly useful for CP quality-control interpretation
- compact and domain-relevant
- good candidate for a management/informatics or chemistry-adjacent operational artifact block

### 5. Source to avoid promoting directly

Do not use as learner-facing canonical source:

- `/Volumes/APCPBoards/Informatics.zip`

Why:

- contains mixed project baggage, local coding environment material, and research/project files
- includes useful informatics evidence, but not in a curated board-prep form
- better treated as a back-end reservoir for future extraction, not as a first promotion surface

## Canonical source decision

Use this stack for the first Management and Informatics promotion pass:

### Primary interactive source

- `/Volumes/NetBackup/labmanagement_formulae.html`

### Secondary reconciliation source

- `/Volumes/NetBackup/Clinical Pathology Management Master.html`

### Board-coverage reference backbone

- `/Volumes/APCPBoards/Comprehensive Review of Lab Management & Informatics for the ABPath Certifying Exam.docx`

### QC operational artifact source

- `/Volumes/NetBackup/Levey Jennings Charts.zip`

### Hold in reserve only

- `/Volumes/APCPBoards/Informatics.zip`
- `/Volumes/NetBackup/LabManagement3.html`
- `/Volumes/NetBackup/labmanagement.html`
- `/Volumes/NetBackup/labmanagement_detailed.html`

## Promotion directive for the next session

Next implementation lane should:

1. map management/informatics to exact ABPath CP anchors
2. derive a governed lecture contract from the board-review docx
3. promote one management/informatics interactive surface from `labmanagement_formulae.html`
4. extract or adapt Levey-Jennings material into a QC artifact block
5. leave `Informatics.zip` out of the learner-facing surface unless specific subassets are deliberately extracted and normalized

## Resume sentence

`Continue the CP backlog with the Management and Informatics source-selection decision from 2026-05-17, using labmanagement_formulae.html as the canonical interactive source and the APCPBoards board-review DOCX as the coverage backbone.`
