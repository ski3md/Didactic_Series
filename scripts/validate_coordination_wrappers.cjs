#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const packageJsonPath = path.join(root, "package.json");

const checks = [
  {
    label: "preflight",
    path: path.join(root, "scripts", "coordination", "preflight.sh"),
    terms: [
      "SKI_CORTEX_COORDINATION_URL",
      "http://127.0.0.1:8765",
      "/coordinate/preflight",
      "curl --fail --silent --show-error",
      "blocking by default",
      "BLOCKED",
      "REDUNDANT",
      "REQUIRES_HUMAN_APPROVAL",
      "coordination_evidence",
      "preflight_wrapper",
      "checkpoint_wrapper",
      "no_external_actions",
      "dashboard_changes_blocked",
      "deployment_blocked",
      "tracked_artifact_refresh_blocked",
    ],
  },
  {
    label: "checkpoint",
    path: path.join(root, "scripts", "coordination", "checkpoint.sh"),
    terms: [
      "SKI_CORTEX_COORDINATION_URL",
      "http://127.0.0.1:8765",
      "/coordinate/checkpoint",
      "curl --fail --silent --show-error",
      "repo_side_checkpoint_emission",
      "checkpoint_emitted_by_didactic_wrapper",
      "coordination_evidence",
      "preflight_wrapper",
      "checkpoint_wrapper",
      "COORDINATION_CHECKPOINT_STATUS",
      "COORDINATION_CHECKPOINT_STORED",
      "no_external_actions",
      "dashboard_changes_blocked",
      "deployment_blocked",
      "tracked_artifact_refresh_blocked",
    ],
  },
];

const errors = [];

for (const check of checks) {
  if (!fs.existsSync(check.path)) {
    errors.push(`missing ${path.relative(root, check.path)}`);
    continue;
  }
  const stat = fs.statSync(check.path);
  if ((stat.mode & 0o100) === 0) {
    errors.push(`${path.relative(root, check.path)} must be executable`);
  }
  const text = fs.readFileSync(check.path, "utf8");
  for (const term of check.terms) {
    if (!text.includes(term)) {
      errors.push(`${check.label} wrapper missing ${JSON.stringify(term)}`);
    }
  }
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
if (
  packageJson.scripts?.["quality:coordination-wrappers"] !==
  "node scripts/validate_coordination_wrappers.cjs"
) {
  errors.push("package.json must expose quality:coordination-wrappers");
}

if (errors.length > 0) {
  console.error("Coordination wrapper validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Coordination wrapper validation passed.");
