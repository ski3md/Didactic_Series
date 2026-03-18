# Migration Stage Summary

Generated: 2026-03-18T18:25:23.968Z

Total source manifests: 6

1. board_prep
   - Source: /Users/skim4/Documents/GitHub/board_prep
   - Stage root: /Users/skim4/Downloads/Didactic_Series/src/content/staging/board_prep
   - Included: board-prep tutorials, AP syllabus nodes, parsed syllabus topics
   - Excluded/absent: node_modules, build artifacts, frontend/src duplicate mirrors, lecture-specific raw assets not found, histology-specific raw assets not found
   - Staged file count: 3
   - Inventory: tutorial_records=190; ap_spec_nodes=76; parsed_syllabus_topics=6698
   - Note: No dedicated lecture-content JSON was found in board_prep
   - Note: No histology-specific raw dataset was found in board_prep beyond tutorial-adjacent content
   - Note: Duplicate JSON mirrors under frontend/src/data were intentionally skipped to avoid redundant staging

2. granulomas
   - Source: /Users/skim4/Documents/GitHub/granulomas
   - Stage root: /Users/skim4/Downloads/Didactic_Series/src/content/staging/granulomas
   - Included: none recorded
   - Excluded/absent: none recorded
   - Staged file count: 0
   - Note: No histology images, lecture materials, board-prep datasets, or structured JSON/MD source files were present in the repository.

3. pathology_learning_module_granulomatous_diseases
   - Source: /Users/skim4/Documents/GitHub/pathology-learning-module_-granulomatous-diseases
   - Stage root: /Users/skim4/Downloads/Didactic_Series/src/content/staging/pathology_learning_module_granulomatous_diseases
   - Included: comparative job aid, interactive case study, diagnostic pathway / quiz tree, instructional design modules (analysis, design, development, evaluation), AI case generator prompt, module metadata
   - Excluded/absent: none recorded
   - Staged file count: 14
   - Inventory: copiedFileCount=14; assessment=This repository is primarily an interactive React learning module. It does not contain separate lecture JSON, board-prep JSON, or histology media bundles. The reusable educational content is embedded in TSX source modules.
   - Note: No standalone lecture dataset was present.
   - Note: No board-prep content JSON or syllabus export was present.
   - Note: No histology image manifest or image asset bundle was present.

4. stainbrain
   - Source: /Users/skim4/Documents/GitHub/stainbrain
   - Stage root: /Users/skim4/Downloads/Didactic_Series/src/content/staging/stainbrain
   - Included: tutorial_board_prep, algorithm, network, histology
   - Excluded/absent: lecture
   - Staged file count: 11
   - Inventory: lecture=absent; tutorial_board_prep={"tutorialSections":15}; algorithm={"algorithmDataAlgorithms":27,"algorithmDataNodeRecords":238,"algorithmDatav2Algorithms":27,"whoClassificationEntries":53}; network={"imageFamilies":36,"nodes":398,"links":35,"extendedRecords":219}; histology={"generatorProfiles":15,"educationalCases":9}
   - Note: No dedicated lecture corpus exists in this repo, so there is nothing to stage for that category beyond tutorial and algorithm material.
   - Note: The repo is mostly application code; the staged files are the reusable content layer, not the UI shell.

5. stainbrain_printable
   - Source: /Users/skim4/Documents/GitHub/stainbrain printable
   - Stage root: /Users/skim4/Downloads/Didactic_Series/src/content/staging/stainbrain_printable
   - Included: lectures, algorithms, network, tutorials_board_prep, histology
   - Excluded/absent: none recorded
   - Staged file count: 9
   - Inventory: lectures={"count":2}; algorithms={"count":2}; network={"nodes":433,"links":56,"extendedEntries":0}; tutorials_board_prep={"sectionCount":15}; histology={"imageCount":68}
   - Note: No separate histology JSON corpus exists in this repo; the histology payload is authored inline in TypeScript.
   - Note: The raw network JSON does not expose an `extended` array in the staged file, so extended graph content is not represented there.

6. syllabus
   - Source: /Users/skim4/Documents/GitHub/syllabus
   - Stage root: /Users/skim4/Downloads/Didactic_Series/src/content/staging/syllabus
   - Included: syllabus-spec, parsed-syllabus-topics
   - Excluded/absent: lecture, histology, board-prep
   - Staged file count: 4
   - Note: This repo does not provide lecture, histology, or board-prep source payloads to migrate.
