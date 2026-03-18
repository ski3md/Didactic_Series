# Downloads Project Migration Summary

- Projects scanned: 33
- Tutorial candidates: 85
- Lecture candidates: 11
- Algorithm candidates: 12
- Image candidates: 39

## Highest-Value Migration Targets

- `batch_project` from `batch_project`: tutorials=13, lectures=0, algorithms=0, images=1
  Recommendation: Treat this repo as a batch factory. Migrate the JSONL topic lists and any validated batch outputs first; do not expect standalone lecture or algorithm assets here. If instructional structure is needed, derive it from the generated outputs rather than the pipeline scripts.
- `pathology_learning_module_granulomatous_diseases` from `pathology-learning-module_-granulomatous-diseases`: tutorials=5, lectures=4, algorithms=1, images=4
  Recommendation: Migrate the tutorial, lecture, and algorithm sections as structured content first, then normalize the image-linked case material separately. Do not expect local image assets; the module depends on remote WSI tile sources and one inline example image.
- `pathology_learning_module_granulomatous_diseases_1` from `pathology-learning-module_-granulomatous-diseases (1)`: tutorials=4, lectures=3, algorithms=1, images=3
  Recommendation: Stage the authored React content files first, starting with the diagnostic pathway, case study, and ADDIE lesson screens. There is no standalone lecture archive or image asset bundle to migrate from this repo.
- `cp_content_specification_tutorial_batch_ready` from `cp-content-specification-tutorial-batch-ready`: tutorials=7, lectures=0, algorithms=0, images=0
  Recommendation: Stage pregeneratedData.ts and batch artifacts first, then normalize tutorial content into structured JSON before considering any image extraction or lecture/algorithm migration.
- `workspace_23eae586_0c4b_44f9_83bd_cef625ab43de_1` from `workspace-23eae586-0c4b-44f9-83bd-cef625ab43de (1)`: tutorials=3, lectures=0, algorithms=3, images=0
  Recommendation: Migrate the dashboard content in src/app/page.tsx and the simulator components first, since that is where the teaching material lives. Treat the rest of the project as framework and runtime scaffolding. Do not expect a separate lecture deck or standalone image library in this repository.
- `brseducationaldashboard_2` from `brseducationaldashboard 2`: tutorials=5, lectures=0, algorithms=0, images=2
  Recommendation: Migrate the tutorial/question subsystem first. Treat lectures and algorithms as absent unless future inspection finds hidden structured files outside the current app shell. Copying the branding images is optional and low value.
- `dashboard1` from `dashboard1`: tutorials=5, lectures=0, algorithms=0, images=0
  Recommendation: Stage the five backend JSON datasets first as tutorial content. Treat the frontend as renderers only, and do not look for independent lecture, algorithm, or image sources in this project unless a new asset directory is added later.
- `pathology_learning_module_granulomatous_diseases_2` from `pathology-learning-module_-granulomatous-diseases (2)`: tutorials=5, lectures=0, algorithms=0, images=0
  Recommendation: Migrate the structured case metadata and embedded case-study content first; there are no raw image assets to copy, so image migration can be deferred until the source repo gains a durable media store.
- `frozens_dashboard_2` from `frozens-dashboard-2`: tutorials=3, lectures=1, algorithms=1, images=2
  Recommendation: Migrate frontend/constants.ts and frontend/data/iocData.ts first. The rest of the repo is mostly workflow UI and infrastructure, with no separate lecture or algorithm corpus beyond those structured data modules.
- `abpath_clinical_pathology_comprehensive_review` from `ABPath Clinical Pathology Comprehensive Review`: tutorials=2, lectures=1, algorithms=2, images=1
  Recommendation: Treat this as an inline-content migration candidate, not a corpus import. If you proceed, first extract the hard-coded study content from `src/app/page.tsx` into structured content files; otherwise there is very little standalone educational payload to migrate.
- `clinical_pathology_review` from `/Users/skim4/Downloads/clinical-pathology-review`: tutorials=4, lectures=0, algorithms=0, images=4
  Recommendation: Do not copy payloads yet. If migration proceeds, extract the embedded MCQ/tutorial content from src/App.jsx and the generator script into a normalized content schema first. No standalone lecture or algorithm corpus was found.
- `abpath_cp_compreview` from `/Users/skim4/Downloads/ABPath_CP_CompReview`: tutorials=4, lectures=0, algorithms=0, images=2
  Recommendation: If migration continues, stage the tutorial/question subsystem first: `src/app/page.tsx`, `src/app/api/questions/route.ts`, `src/app/api/upload/route.ts`, and `src/lib/anki-parser.ts`. Do not spend time on lectures or algorithms for this repo unless new source data appears, because no separate lecture or algorithm corpus exists here.
- `virtual_mycology_simulator` from `virtual-mycology-simulator`: tutorials=4, lectures=0, algorithms=0, images=2
  Recommendation: Stage the AI workflow and renderer components together if you want to preserve the simulator behavior. There is no standalone lecture archive, algorithm dataset, or local image corpus to migrate from this repo.
- `pathology_learning_module_granulomatous_diseases_3` from `pathology-learning-module_-granulomatous-diseases (3)`: tutorials=1, lectures=1, algorithms=2, images=1
  Recommendation: Migrate the embedded lecture, pathway, tutorial, and gallery metadata first, then decide whether to extract them into standalone content files in the target project. Preserve the external image URLs and treat the React/Vite app as delivery infrastructure.
- `workspace_3418f879_7689_4224_9717_636b27130563` from `/Users/skim4/Downloads/workspace-3418f879-7689-4224-9717-636b27130563`: tutorials=2, lectures=0, algorithms=1, images=1
  Recommendation: Stage bacterial_algorithm_data.py first, then normalize the README/IMPLEMENTATION_SUMMARY instructional text if tutorial content needs to be migrated. No lecture corpus is present.

## Likely Shell Or Low-Value Repos

- `abpath_reactpwa_workspace` from `ABPath_ReactPWA_Workspace`
- `abpath_review_dashboard` from `ABPath_Review_Dashboard`
- `didactic_series_working_copy` from `didactic-series-working-copy`
- `regeneration_dashboard` from `/Users/skim4/Downloads/regeneration-dashboard`
- `workspace_722b3264_636d_4869_afa6_c8b0a38be36f` from `workspace-722b3264-636d-4869-afa6-c8b0a38be36f`
- `workspace_d0c8f796_92cd_4585_96c9_e56495d33134` from `workspace-d0c8f796-92cd-4585-96c9-e56495d33134`

## Output

- `migration_index.json` contains the normalized per-project inventory.
- Each project folder also has its own `migration_manifest.json` and `README.md`.
