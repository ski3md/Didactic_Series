# Breast Pathology Sign-Out Game: Educational, Diagnostic Reasoning, and Practical Efficiency SWOT

Source reviewed: `/Users/skim4/Downloads/breast_pathology_signout_game.jsx`

Evaluation date: 2026-04-30

## Executive Judgment

The game is a strong early scaffold for breast pathology reinforcement. It already contains timed retrieval practice, immediate feedback, board-style pearls, and a second CAP-style synoptic simulation mode. Its best current use is as a rapid review tool for residents who have already seen breast sign-out workflows.

It is not yet a true sign-out teaching environment for pathology residency. The major limitation is that diagnostic reasoning is mostly supplied by text stems rather than learned from visual evidence, differential branching, report construction, and staged decision-making. The current game tests recognition of canonical facts more than it teaches how a pathologist moves from slide review to diagnosis, ancillary workup, synoptic reporting, staging, and clinically useful wording.

The highest-value improvement is to convert the game from a quiz-plus-form interface into a slide-first diagnostic workflow: image or pseudo-slide first, learner commits to an observation, differential and report elements are revealed stepwise, then the learner completes a structured sign-out with field-level feedback and a final attending-style model report.

## Current Asset Inventory

### Classic Quiz Mode

- Ten timed cases.
- Mix of MCQ and short free-text responses.
- Covers benign calcifications, ADH, DCIS, invasive carcinoma NST, invasive lobular carcinoma, lumpectomy margins, ER low positive, neoadjuvant staging, mucinous carcinoma receptor class, and HER2 0 versus 1+.
- Each case includes stem, prompt, answer key, explanation, pearl, and rubric.
- Feedback is immediate after submission.
- Final screen lists responses and pearls.

### CAP Synoptic Simulation Mode

- Two longer simulations.
- Simulation 1: lumpectomy with sentinel node biopsy.
- Simulation 2: post-neoadjuvant mastectomy.
- Each includes clinical context, gross summary, pseudo-slide views, checklist, answer key, feedback map, timed completion, and field-by-field grading.
- Synoptic fields include procedure, laterality, histologic type, grade, tumor size, focality, DCIS, LVI, margins, nodes, ENE, stage, and biomarker class.

### Current Teaching Mechanisms

- Timers impose sign-out pressure.
- Immediate correctness feedback supports rapid retrieval.
- Rubrics provide concise post-hoc explanation.
- Pearls reinforce high-yield exam and sign-out traps.
- CAP simulation fields imitate practical reporting structure.
- Alias matching reduces some free-text brittleness.

### Current Missing Teaching Mechanisms

- No actual histology, IHC, gross, radiology, or WSI images.
- No image-first observation workflow.
- No progressive reveal of differential diagnosis.
- No required morphologic description before final diagnosis.
- No stain ordering or ancillary interpretation decisions.
- No radiology-pathology concordance workflow.
- No report wording comparison against an attending model.
- No durable learner analytics or case-level remediation plan.
- No source or guideline version metadata.

## Educational Capacity SWOT

### Strengths

1. Retrieval practice is already embedded.
   The timed case format forces active recall rather than passive reading.

2. Cognitive load is controlled.
   Most classic cases have one dominant learning objective, which is appropriate for early reinforcement.

3. Feedback is immediate.
   The learner receives an explanation and rubric immediately after committing to an answer.

4. The case selection targets common breast pathology friction points.
   ADH versus DCIS, DCIS reporting, ILC pattern recognition, ER low positive, HER2 0 versus 1+, margins, and neoadjuvant staging are legitimate resident pain points.

5. The simulation mode moves beyond multiple choice.
   The CAP synoptic lab requires structured data entry, which is closer to real sign-out than MCQ alone.

6. Pearls are concise and memorable.
   Several pearls are practical, such as separating invasive carcinoma margins from DCIS margins.

7. The file is deployable as a single React component.
   This makes it easy to prototype, demo, and iterate.

8. The use of timers introduces a practical performance element.
   Timed completion can help residents practice efficiency after concepts have been taught.

9. The dashboard provides basic progress feedback.
   Running accuracy and simulation accuracy provide a minimal self-monitoring loop.

10. The content is broadly aligned with breast sign-out essentials.
    The case bank includes benign, high-risk, in situ, invasive, biomarker, staging, and treated-specimen content.

### Weaknesses

1. The game teaches mostly from text, not from visual evidence.
   Pathology residents need to learn by inspecting histology, IHC, and gross/radiology context. The current pseudo-slide descriptions are useful placeholders but cannot train visual discrimination.

2. The stems often give away the diagnosis.
   Many cases explicitly provide the discriminating features. This tests whether the learner recognizes the label, not whether they can discover the features on a slide.

3. Diagnostic reasoning is post-hoc.
   The learner usually answers first and only sees the reasoning after submission. There is no staged requirement to name morphology, generate a differential, decide ancillary studies, and then sign out.

4. The game does not model attending sign-out behavior.
   It lacks a final model report, diagnostic comment, synoptic excerpt, and clinically useful wording.

5. Rubrics are too coarse for residency-level teaching.
   Most rubrics are three bullet points. They do not distinguish observation errors, categorization errors, reporting omissions, staging errors, or management-impacting errors.

6. There is no scaffolding by learner level.
   Foundational, intermediate, and advanced labels are present, but the interface does not adapt the amount of help, the expected report detail, or the grading standard.

7. The game lacks spaced repetition implementation.
   It recommends replaying missed cases later but does not schedule or persist missed items.

8. There is no explicit competency mapping.
   Cases are not mapped to ACGME pathology milestones, breast pathology entrustable tasks, CAP synoptic domains, or board-style objectives.

9. There is no faculty mode.
   An attending cannot easily use the game as a teaching deck, reveal answers stepwise, annotate pitfalls, or export a session report.

10. There is no case provenance.
    The game does not track source references, guideline dates, CAP protocol version, ASCO/CAP biomarker version, or local institutional conventions.

### Opportunities

1. Convert each case into a slide-first reveal sequence.
   Show histology first, ask for observations, then reveal differential and report consequences.

2. Add actual image panels.
   Each case should include at least one H&E image; biomarker cases need ER, PR, HER2, Ki-67, or relevant IHC images where applicable.

3. Add a diagnostic reasoning ladder.
   Require: observation, category, differential, ancillary decision, final diagnosis, report elements, and management implication.

4. Expand rubrics into error taxonomy.
   Score errors as morphology, classification, biomarker interpretation, staging, margin handling, synoptic omission, or report wording.

5. Add attending model reports.
   After grading, show a concise final diagnosis, microscopic description, synoptic excerpt, and comment.

6. Add case replay queues.
   Persist missed elements and generate daily review sets.

7. Add adaptive difficulty.
   If a learner misses ADH versus DCIS, serve more low-grade ductal proliferation cases before advancing.

8. Add faculty analytics.
   Track class-level misses: margins, ER low positive, HER2 0/1+, yp staging, LVI, nodal staging.

9. Build a reusable case schema.
   Move hardcoded cases into JSON with fields for images, source, diagnostic objectives, report fields, rubrics, and versioning.

10. Add a sign-out speed mode.
    After mastery, challenge learners to complete only the clinically necessary report elements under timed conditions.

### Threats

1. False competence.
   Learners may score well on text stems but still fail when shown actual histology.

2. Outdated guideline risk.
   Biomarker thresholds and CAP synoptic expectations change; a hardcoded game can quietly become stale.

3. Over-simplification of ambiguous cases.
   Real breast pathology includes borderline lesions, sampling issues, radiology-pathology discordance, fragmented cores, cautery, and institutional practice variation.

4. MCQ pattern recognition may replace diagnostic reasoning.
   If the game rewards answer selection more than observation, learners may memorize phrases rather than learn sign-out.

5. No image provenance creates educational and legal risk when images are later added.
   Every image should have source, license, local storage path, caption, and educational use metadata.

6. Timer misuse.
   Timers can create pressure before competence is established. Early learners may need untimed reasoning mode before speed mode.

## Diagnostic Reasoning Teaching SWOT

### Strengths

1. The case topics are well chosen.
   The included topics reflect common breast sign-out and board traps.

2. The synoptic simulations teach report structure.
   They require the learner to enter report fields rather than only pick a diagnosis.

3. The game emphasizes clinically meaningful distinctions.
   Examples include invasive versus DCIS margins, tumor bed versus residual invasive size, and ER low positive classification.

4. Several explanations are sign-out oriented.
   They connect morphology to reporting consequences rather than only naming entities.

5. Some cases correctly foreground treatment-impacting data.
   Biomarker class, HER2 scoring, yp staging, and nodal micrometastasis are clinically important.

### Weaknesses

1. There is no morphology-first commitment.
   The learner is not forced to describe what they see before selecting a diagnosis.

2. There is no differential diagnosis workbench.
   The learner does not compare UDH, ADH, low-grade DCIS, FEA, papilloma, radial scar, sclerosing adenosis, lobular neoplasia, invasive carcinoma NST, ILC, and special types in a structured way.

3. Ancillary testing is underdeveloped.
   There is no decision point for when to order p63/SMMHC, E-cadherin, ER, CK5/6, HER2 FISH, or other ancillary tests.

4. Image interpretation is absent.
   Diagnostic reasoning in pathology depends on visual pattern recognition. The current game uses text descriptions as a proxy.

5. Radiology-pathology concordance is not operationalized.
   Calcification cases mention stereotactic cores but do not require a concordance statement or management recommendation.

6. The free-text grading is narrow.
   Acceptable answer matching works for a few phrases but does not evaluate nuanced reports or partially correct reasoning.

7. Simulation grading is field-by-field but not severity-weighted.
   Missing laterality and missing pN category are not equivalent in clinical consequence, but the scoring treats all fields uniformly.

8. The game does not teach diagnostic uncertainty.
   There are no cases requiring "atypical ductal proliferation suspicious for DCIS", "defer to excision", "limited by crush/cautery", or "cannot exclude invasion".

9. The game lacks common high-volume benign mimics.
   Sclerosing adenosis, radial scar/complex sclerosing lesion, papilloma, fibroadenoma/phyllodes, fat necrosis, pseudoangiomatous stromal hyperplasia, lactational change, and inflammatory lesions are absent or underrepresented.

10. It does not teach specimen workflow.
    There is no block selection, grossing strategy, margin orientation, calcification correlation, tissue exhaustion, or recut/deeper level decision-making.

### Opportunities

1. Add diagnostic gates.
   Gate 1: biopsy type and target. Gate 2: lesion category. Gate 3: invasion status. Gate 4: required report elements. Gate 5: management-impacting comment.

2. Add image-based observation prompts.
   Prompt examples: "Name the architecture", "Is the proliferation monomorphic?", "Is myoepithelium retained?", "Is the invasive size measured by tumor bed or viable tumor?"

3. Add stain-order simulations.
   The learner chooses stains, receives results, and must update the differential.

4. Add discordance cases.
   Example: calcifications targeted but not identified histologically; mass biopsy showing benign tissue; atypia in limited cores.

5. Add report critique mode.
   Present flawed resident reports and ask the learner to identify missing or unsafe elements.

6. Add tumor board mode.
   Ask what the oncologist, surgeon, or radiologist needs from the report.

7. Add severity-weighted grading.
   Critical errors should include invasion status, HER2 category, stage prefix, nodal category, margin status, and treated tumor size.

8. Add entity coverage expansion.
   Include special types and mimics: tubular, mucinous, papillary, metaplastic, adenoid cystic, secretory, neuroendocrine, apocrine carcinoma, phyllodes, malignant spindle cell differential, and metastatic disease.

9. Add breast biomarker interpretation module.
   Include ER low positive, PR discordance, HER2 0/1+/2+/3+, FISH groups, Ki-67 limitations, fixation issues, decalcified specimens, and repeat testing indications.

10. Add post-neoadjuvant residual cancer burden teaching.
    Teach residual invasive size, tumor bed size, cellularity, DCIS, nodes, treatment effect, yp stage, and RCB inputs.

### Threats

1. Learners may over-trust simplified stems.
   Real cases often lack a single clean clue.

2. Lack of visual training limits transfer.
   Text-only mastery may not translate to microscope performance.

3. Rigid answer keys can teach false absolutes.
   Some breast diagnoses depend on extent, sampling, institutional thresholds, or multidisciplinary context.

4. Incomplete biomarker nuance may create reporting risk.
   HER2 and ER interpretation have clinical treatment implications.

5. Absence of uncertainty language may harm sign-out habits.
   Residents need to learn when to qualify, defer, request levels, order stains, or recommend excision.

## Practical Efficiency and Capacity SWOT

### Strengths

1. The tool is lightweight.
   A single React component can be dropped into an existing app quickly.

2. No backend is required.
   This lowers the barrier to testing and teaching.

3. Timers and scoring are already implemented.
   These support rapid drills and competency checks.

4. The synoptic form mirrors real workflow better than MCQ.
   Structured fields help residents practice practical report completion.

5. The UI is modular enough to split into separate components.
   Cases, simulations, slide panels, and scoring logic can be extracted.

6. Alias matching exists.
   The simulation already accounts for some acceptable variants.

7. Reset and replay are simple.
   This is useful for repeated practice sessions.

### Weaknesses

1. All content is hardcoded.
   Case updates require editing JSX rather than maintaining a case bank.

2. There is no persistent learner state.
   Scores, missed fields, and progress disappear on reset or reload.

3. The game has no import/export pathway.
   Faculty cannot batch add cases, export performance, or share a session handout.

4. The answer-matching system is brittle.
   It handles some aliases but cannot parse nuanced pathology wording.

5. There is no version governance.
   CAP protocol and biomarker guideline changes cannot be tracked per case.

6. No image asset pipeline exists.
   Adding real histology images will require image storage, licensing metadata, captions, and local caching.

7. There is no accessibility review.
   Timers, color-coded feedback, and dense forms need keyboard, screen-reader, and color-contrast validation.

8. There is no faculty-facing quality control.
   There is no way to mark a case as draft, reviewed, retired, or updated.

9. There is no analytics model.
   The game cannot identify repeated learner weaknesses across attempts.

10. The simulation has only two long cases.
    Capacity for broad practical training is currently limited.

### Opportunities

1. Move cases into a JSON schema.
   This enables batch authoring, validation, and reuse across quiz, lecture, and PDF modes.

2. Create a batch image acquisition and curation workflow.
   Each case should have local image files, source metadata, magnification, stain, and teaching caption.

3. Add local persistence.
   Use localStorage or a backend to track attempts, missed concepts, and spaced repetition due dates.

4. Add a faculty dashboard.
   Show aggregate missed domains and case completion time.

5. Add PDF export.
   Export case packets, answer keys, and remediation plans.

6. Add case validation scripts.
   Validate that every case has diagnosis, differential, image, report fields, answer key, rubric, references, and guideline version.

7. Add a content governance layer.
   Track author, reviewer, review date, CAP version, ASCO/CAP biomarker version, and expiration date.

8. Add severity-weighted scoring.
   Assign more weight to clinically critical omissions.

9. Add adaptive routing.
   Learners who miss HER2 scoring get more HER2 cases; learners who miss margins get more excision cases.

10. Add sign-out efficiency metrics.
    Track time to first answer, time to report completion, number of revised fields, and repeated omissions.

### Threats

1. Scaling hardcoded JSX will become unmaintainable.
   Each new case increases file size and edit risk.

2. Guideline drift can silently invalidate content.
   Biomarker and synoptic content must be version-controlled.

3. Faculty trust may be lost if the game contains outdated or oversimplified answers.
   Pathology trainees will notice if cases do not match real sign-out nuance.

4. Performance metrics may be misleading.
   Fast completion is not the same as safe sign-out.

5. Without images, the game may be perceived as board trivia rather than pathology training.

6. Without analytics, improvement cannot be measured longitudinally.

## Priority Defect List

### Critical

1. No real histology/IHC images.
   This prevents the game from teaching visual diagnosis.

2. Entity and report reasoning are not staged.
   The learner can jump directly to a diagnosis without proving observation, differential, or report logic.

3. No guideline/source versioning.
   Breast biomarker and CAP reporting content require explicit version control.

4. Hardcoded content.
   The current structure blocks scalable case authoring and review.

### High

1. Expand differential coverage.
   Add benign mimics, high-risk lesions, special-type carcinomas, spindle cell lesions, papillary lesions, and treated specimens.

2. Add model reports.
   Every case should show an attending-level final diagnosis and comment.

3. Add severity-weighted scoring.
   Critical diagnostic and staging errors should count more than minor wording differences.

4. Add radiology-pathology concordance tasks.
   Calcification and mass-biopsy cases need concordance decisions.

5. Add persistent remediation.
   Missed concepts should generate a review queue.

### Moderate

1. Improve accessibility.
   Ensure keyboard operation, timer controls, and non-color feedback.

2. Add faculty mode.
   Include reveal controls, case notes, and session export.

3. Add analytics.
   Track error categories and timing.

4. Add answer alias governance.
   Store acceptable answers with case schema rather than embedding them in logic.

## Recommended Target State

The game should become a breast pathology sign-out trainer with three modes:

1. Teaching mode.
   Faculty or learner sees image first, describes findings, reveals differential, then reveals diagnosis and report elements.

2. Practice mode.
   Learner completes diagnosis, ancillary decisions, and report fields with immediate feedback.

3. Efficiency mode.
   Learner signs out a known class of case under time pressure after achieving accuracy in practice mode.

## Batch Job Plan to Get There

### Batch 1: Content Schema Extraction

Goal: Move hardcoded case content out of JSX.

Tasks:
- Create `breast_signout_cases.schema.json`.
- Convert `CASES` and `SIM_CASES` into structured JSON.
- Add fields for case type, diagnosis, differential, image assets, report fields, rubric, references, and guideline version.
- Add validation script requiring every case to have a teaching objective and answer key.

Acceptance criteria:
- JSX imports case data rather than embedding it.
- Validation fails if a case lacks diagnosis, rubric, or reference metadata.

### Batch 2: Visual Evidence Layer

Goal: Every case becomes image-backed.

Tasks:
- Add H&E image slots to all cases.
- Add IHC image slots where relevant.
- Add magnification, stain, source, local path, caption, and teaching annotation fields.
- Store images locally with a manifest.

Acceptance criteria:
- Every case has at least one local image.
- Every biomarker case has appropriate biomarker visual evidence or a documented reason it is text-only.

### Batch 3: Diagnostic Reasoning Workflow

Goal: Teach how pathologists reason, not just what answer is correct.

Tasks:
- Add staged prompts: observation, lesion category, differential, ancillary studies, final diagnosis, report consequences.
- Add progressive reveal.
- Add morphology-first scoring.
- Add differential comparison panels.

Acceptance criteria:
- Learner cannot submit final diagnosis without completing observation and differential prompts.
- Feedback distinguishes observation error from classification error.

### Batch 4: Report and Synoptic Training

Goal: Improve practical sign-out transfer.

Tasks:
- Add model final diagnosis for every case.
- Add microscopic description examples.
- Add CAP synoptic excerpt where applicable.
- Add tumor board consequence note.
- Add severity-weighted report scoring.

Acceptance criteria:
- Every invasive carcinoma case has diagnosis, grade, size, LVI, margins, nodes when applicable, biomarkers, and stage logic.
- Every core biopsy case states whether invasion is identified and whether calcifications/target lesion are accounted for when relevant.

### Batch 5: Remediation and Analytics

Goal: Make the tool useful over repeated sessions.

Tasks:
- Persist attempts locally.
- Track missed concept tags.
- Generate review queues.
- Add spaced repetition scheduling.
- Add faculty summary export.

Acceptance criteria:
- A learner can return and see missed concepts.
- Faculty can identify the most frequently missed domains.

### Batch 6: Governance

Goal: Prevent stale or unsafe educational content.

Tasks:
- Add case metadata: author, reviewer, review date, CAP version, ASCO/CAP version, source references.
- Add expiration/re-review warnings.
- Add tests for required metadata.

Acceptance criteria:
- No case can be published without reviewer and guideline metadata.

## Proposed Case Expansion Map

### Core Biopsy

- Benign concordant calcifications.
- Calcifications not identified.
- UDH versus ADH.
- ADH versus low-grade DCIS.
- FEA.
- ALH/LCIS.
- Papilloma with and without atypia.
- Radial scar/complex sclerosing lesion.
- Sclerosing adenosis mimic.
- Invasive carcinoma NST.
- ILC.
- Mucinous carcinoma.
- Tubular carcinoma.
- Metaplastic carcinoma.
- Suspicious for invasion but limited.

### Excision

- Lumpectomy with invasive carcinoma and DCIS margins.
- Pure DCIS excision.
- Re-excision margins.
- Multifocal disease.
- Sentinel node micrometastasis.
- Isolated tumor cells.
- Neoadjuvant residual disease.
- Tumor bed without residual invasive carcinoma.

### Biomarkers

- ER strong positive.
- ER low positive.
- ER negative with internal control.
- PR discordance.
- HER2 0 versus 1+.
- HER2 2+ with ISH reflex.
- HER2 3+.
- Fixation/control failure.
- Decalcified specimen caveat.

## Final Recommendation

Keep the existing game as the first interactive shell, but do not treat it as a mature pathology residency teaching product yet. The educational direction is sound, especially the CAP simulation layer, but it needs image-first reasoning, real histologic evidence, staged differential diagnosis, model reports, source governance, and longitudinal remediation before it can support true sign-out training.

The most efficient next move is schema extraction plus image-backed conversion. Once cases are data-driven and image-backed, the same content can support lectures, quiz mode, sign-out simulation, PDF handouts, and faculty dashboards.
