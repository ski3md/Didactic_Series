#!/usr/bin/env node

const {
  GENERATED_JSON_PATH,
  GENERATED_MD_PATH,
  SUMMARY_PATH,
  buildSummary,
  readProgram,
  renderProgramMarkdown,
  validateProgram,
  writeJson,
  writeText,
} = require('./next_1000_major_changes_lib.cjs');

const program = readProgram();
const failures = validateProgram(program);

if (failures.length > 0) {
  console.error('[NEXT-1000] Cannot generate outputs because the seed file failed validation:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

const summary = buildSummary(program);
const markdown = renderProgramMarkdown(program);

writeJson(GENERATED_JSON_PATH, program);
writeJson(SUMMARY_PATH, summary);
writeText(GENERATED_MD_PATH, markdown);

console.log(
  `[NEXT-1000] Wrote ${program.records.length} planned changes to ${GENERATED_JSON_PATH}, ${GENERATED_MD_PATH}, and ${SUMMARY_PATH}.`
);
