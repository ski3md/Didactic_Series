# cp_study_tool_bundle 2 staging summary

Source: `/Users/skim4/Downloads/cp_study_tool_bundle 2`

This project is a small ABPath Clinical Pathology study app. The only direct educational content I found is the offline question bank in `cp_study_tool/data/questions.json`.

## Identified candidates

- `tutorials`: `cp_study_tool/data/questions.json`
- `algorithms`: none found
- `lectures`: none found
- `images`: none found

## Notes

- The CLI and Streamlit UI are runtime scaffolding, not content repositories.
- Agent modules handle question generation, explanation, visualization, evaluation, and dashboarding.
- Optional LLM support depends on `OPENAI_API_KEY`.

## Recommendation

If this content is being migrated into a didactic library, start with the JSON question bank and normalize it into the target content schema. The rest of the repo can be treated as app infrastructure unless you specifically want to preserve the study tool itself.
