#!/usr/bin/env node

const { readProgram, validateProgram } = require('./next_1000_major_changes_lib.cjs');

const program = readProgram();
const failures = validateProgram(program);

if (failures.length > 0) {
  console.error('[NEXT-1000] Validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `[NEXT-1000] Validation passed with ${program.records.length} planned changes across ${program.waves.length} waves and ${program.lanes.length} lanes.`
);
