// ES module config for manifest tools
export default {
  projectRoot: process.cwd(),
  imagesDir: 'src/assets/images/granulomas', // change if your images live elsewhere
  outputFile: 'src/assets/data/image_manifest.json',
  rulesFile: 'src/assets/data/metadata_rules.json',
  statsFile: 'src/assets/data/manifest_stats.json',
  logFile: 'logs/manifest.log',
  schemaFile: 'scripts/docs/manifest_schema.json',
  defaultSchemaVersion: 'who-2022-thoracic',
  tmpSuffix: '.tmp',
  ai: {
    enabled: false, // default; overridden by CLI flag
    model: 'gpt-4',
    maxTokens: 400,
    temperature: 0.2
  }
};
