#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const contractPath = path.join(root, 'src/content/lectures/lectureAbpathContracts.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

const failures = [];
const requiredTabs = contract.globalParameters.requiredTabs;
const minimums = contract.globalParameters.minimums;

if (!Array.isArray(contract.lectures) || contract.lectures.length === 0) {
  failures.push('Contract has no lecture entries.');
}

for (const lecture of contract.lectures) {
  const prefix = `${lecture.lectureId}:`;
  if (!lecture.contentArea) failures.push(`${prefix} missing contentArea`);
  if (!lecture.scopeBoundary) failures.push(`${prefix} missing scopeBoundary`);
  if (!lecture.promotionGate) failures.push(`${prefix} missing promotionGate`);
  if (!Array.isArray(lecture.abpathAnchors) || lecture.abpathAnchors.length < minimums.abpathAnchors) {
    failures.push(`${prefix} has ${lecture.abpathAnchors?.length ?? 0} ABPath anchors; expected at least ${minimums.abpathAnchors}`);
  }
  for (const tab of requiredTabs) {
    const tabContract = lecture.contractParameters?.[tab];
    if (!tabContract) {
      failures.push(`${prefix} missing ${tab} tab contract`);
      continue;
    }
    if (!Array.isArray(tabContract.required) || tabContract.required.length < 3) {
      failures.push(`${prefix} ${tab} tab has fewer than 3 required parameters`);
    }
    if (!tabContract.acceptance) failures.push(`${prefix} ${tab} tab missing acceptance statement`);
  }
  if ((lecture.minimums?.objectives ?? 0) < minimums.objectives) {
    failures.push(`${prefix} objectives minimum is below global contract`);
  }
  if (!lecture.exclusionRule?.includes('outside its content-area scope')) {
    failures.push(`${prefix} exclusion rule does not enforce content-area scope`);
  }
}

if (failures.length) {
  console.error(`Lecture ABPath contract validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Lecture ABPath contract validation passed for ${contract.lectures.length} lectures.`);
