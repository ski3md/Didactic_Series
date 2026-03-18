# cp_study_tool_bundle migration summary

This project is a CP study-question generator, not a content library. The only direct educational payload found is the ABPath CP blueprint in `cp_study_tool/data/abpath_cp_blueprint.json`, which seeds the generated practice questions.

## Findings

- `tutorials`: candidate found in `cp_study_tool/data/abpath_cp_blueprint.json`
- `algorithms`: none found
- `lectures`: none found
- `images`: none found

## Recommendation

Stage the blueprint first and normalize it into reusable tutorial content. The rest of the repository is supporting app logic, schemas, and UI code.
