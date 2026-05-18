#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = process.cwd();
const contractPath = path.join(root, 'src/content/contracts/generatedArtifactPolicy.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const rel = (filePath) => path.relative(root, filePath);
const exists = (filePath) => fs.existsSync(filePath);
const normalize = (filePath) => filePath.replace(/\\/g, '/');

const contract = readJson(contractPath);
const failures = [];
const passes = [];

const ensure = (condition, passMessage, failMessage) => {
  if (condition) {
    passes.push(passMessage);
  } else {
    failures.push(failMessage);
  }
};

const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map(normalize);

const trackedFileSet = new Set(trackedFiles);
const liveTrackedFiles = trackedFiles.filter((filePath) => exists(path.join(root, filePath)));
const liveTrackedFileSet = new Set(liveTrackedFiles);
const exactArtifacts = contract.exactArtifacts || [];
const prefixArtifacts = contract.prefixArtifacts || [];
const mirroredArtifacts = contract.mirroredArtifacts || [];
const governedScopes = contract.governedDeclarationScopes || [];
const localOnlyPrefixes = contract.localOnlyPrefixes || [];
const localOnlyArtifacts = contract.localOnlyArtifacts || [];

const supportedClasses = new Set(contract.artifactClasses || []);
const classify = (filePath) => {
  const exact = exactArtifacts.find((artifact) => artifact.path === filePath);
  if (exact) {
    return exact;
  }

  const prefixes = prefixArtifacts
    .filter((artifact) => filePath.startsWith(artifact.prefix))
    .sort((left, right) => right.prefix.length - left.prefix.length);

  return prefixes[0] || null;
};

for (const artifact of [...exactArtifacts, ...prefixArtifacts]) {
  ensure(
    supportedClasses.has(artifact.class),
    `${artifact.path || artifact.prefix} uses a declared artifact class`,
    `${artifact.path || artifact.prefix} uses unsupported class ${artifact.class}`
  );
}

for (const artifact of exactArtifacts) {
  const absolutePath = path.join(root, artifact.path);
  ensure(
    exists(absolutePath),
    `${artifact.path} exists`,
    `${artifact.path} is declared in generatedArtifactPolicy but does not exist`
  );
  ensure(
    liveTrackedFileSet.has(artifact.path),
    `${artifact.path} is tracked`,
    `${artifact.path} is declared in generatedArtifactPolicy but is not tracked`
  );
}

for (const prefix of localOnlyPrefixes) {
  const trackedMatches = liveTrackedFiles.filter((filePath) => filePath.startsWith(prefix));
  ensure(
    trackedMatches.length === 0,
    `${prefix} has no tracked local-only artifacts`,
    `${prefix} should be local-only but still has tracked files: ${trackedMatches.slice(0, 10).join(', ')}`
  );
}

for (const filePath of localOnlyArtifacts) {
  ensure(
    !liveTrackedFileSet.has(filePath),
    `${filePath} is not tracked because it is local-only`,
    `${filePath} is declared local-only but is still tracked`
  );
}

for (const scope of governedScopes) {
  const scopedFiles = liveTrackedFiles.filter((filePath) => {
    if (!filePath.startsWith(scope.prefix)) {
      return false;
    }

    if (!scope.extensions || scope.extensions.length === 0) {
      return true;
    }

    return scope.extensions.some((extension) => filePath.endsWith(extension));
  });

  const uncoveredFiles = scopedFiles.filter((filePath) => !classify(filePath));
  ensure(
    uncoveredFiles.length === 0,
    `${scope.label} files are all declared in generatedArtifactPolicy`,
    `${scope.label} contains undeclared tracked artifacts: ${uncoveredFiles.slice(0, 20).join(', ')}`
  );
}

for (const mirrorGroup of mirroredArtifacts) {
  const authoritativePath = path.join(root, mirrorGroup.authoritative);
  ensure(
    exists(authoritativePath),
    `${mirrorGroup.authoritative} exists`,
    `${mirrorGroup.label} authoritative artifact is missing: ${mirrorGroup.authoritative}`
  );
  ensure(
    liveTrackedFileSet.has(mirrorGroup.authoritative),
    `${mirrorGroup.authoritative} is tracked`,
    `${mirrorGroup.label} authoritative artifact is not tracked: ${mirrorGroup.authoritative}`
  );
  ensure(
    Boolean(classify(mirrorGroup.authoritative)),
    `${mirrorGroup.authoritative} is classified`,
    `${mirrorGroup.label} authoritative artifact is not classified in generatedArtifactPolicy`
  );

  const authoritativeContents = exists(authoritativePath) ? fs.readFileSync(authoritativePath, 'utf8') : '';

  for (const mirror of mirrorGroup.mirrors || []) {
    const mirrorPath = path.join(root, mirror);
    ensure(
      exists(mirrorPath),
      `${mirror} exists`,
      `${mirrorGroup.label} mirror is missing: ${mirror}`
    );
    ensure(
      liveTrackedFileSet.has(mirror),
      `${mirror} is tracked`,
      `${mirrorGroup.label} mirror is not tracked: ${mirror}`
    );
    ensure(
      Boolean(classify(mirror)),
      `${mirror} is classified`,
      `${mirrorGroup.label} mirror is not classified in generatedArtifactPolicy`
    );

    if (mirrorGroup.requireByteParity && exists(mirrorPath) && exists(authoritativePath)) {
      const mirrorContents = fs.readFileSync(mirrorPath, 'utf8');
      ensure(
        mirrorContents === authoritativeContents,
        `${mirrorGroup.label} mirror matches authoritative artifact`,
        `${mirrorGroup.label} mirror drifted: ${mirror} differs from ${mirrorGroup.authoritative}`
      );
    }
  }
}

const reportSecurityFiles = liveTrackedFiles.filter((filePath) => filePath.startsWith('reports/security/'));
ensure(
  reportSecurityFiles.every((filePath) => {
    const artifact = classify(filePath);
    return artifact && artifact.class === 'generated-tracked-artifact';
  }),
  'security report artifacts are explicitly classified',
  'one or more security report artifacts are not explicitly classified as generated-tracked artifacts'
);

const archivedProofFiles = liveTrackedFiles.filter((filePath) => filePath.startsWith('reports/ap_'));
ensure(
  archivedProofFiles.every((filePath) => {
    const artifact = classify(filePath);
    return artifact && artifact.class === 'archived-proof-bundle';
  }),
  'AP gap and faculty packet reports are explicitly classified as archived proof bundles',
  'one or more reports/ap_* artifacts are not classified as archived proof bundles'
);

if (failures.length > 0) {
  console.error(`[HYGIENE] Validation failed with ${failures.length} issue(s).`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`[HYGIENE] Validation passed with ${passes.length} checks.`);
