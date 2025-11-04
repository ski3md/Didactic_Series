Manifest Tools - README

Commands:
- node scripts/diagnose_manifest.js
- node scripts/rebuild_manifest.js
- ./scripts/generate_manifest.sh --validate
- ./scripts/generate_manifest.sh --ai --validate

Dependencies:
- node >= 18
- npm install openai ajv chalk
- set OPENAI_API_KEY if using --ai

Outputs:
- src/assets/data/image_manifest.json
- src/assets/data/metadata_rules.json
- src/assets/data/manifest_stats.json
- logs/manifest.log
