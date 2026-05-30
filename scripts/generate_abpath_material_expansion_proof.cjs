#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const outJsonPath = path.join(repoRoot, 'reports/abpath_material_expansion_proof.json');
const outMdPath = path.join(repoRoot, 'reports/abpath_material_expansion_proof.md');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function countBy(entries, keyFn) {
  return entries.reduce((acc, entry) => {
    const key = keyFn(entry);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function sortedObject(value) {
  return Object.fromEntries(Object.entries(value || {}).sort(([left], [right]) => left.localeCompare(right)));
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function buildDomainCoverage(queue) {
  const domains = queue.domains || [];
  const byDomain = countBy(queue.entries || [], (entry) => entry.domain);

  return {
    totals: sortedObject(byDomain),
    subjectCountByDomain: sortedObject(countBy(domains, (entry) => entry.domain)),
    subjects: domains.map((entry) => ({
      domain: entry.domain,
      subject: entry.subject,
      entries: entry.count,
      materialKinds: sortedObject(entry.materialKinds),
      difficulties: sortedObject(entry.difficulties),
    })),
  };
}

function buildPayload() {
  const queueRaw = fs.readFileSync(queuePath, 'utf8');
  const queue = JSON.parse(queueRaw);
  const entries = queue.entries || [];
  const domainCoverage = buildDomainCoverage(queue);

  const reviewStatus = sortedObject(countBy(entries, (entry) => entry.expansionStatus?.reviewStatus || 'missing'));
  const promotionStatus = sortedObject(countBy(entries, (entry) => entry.expansionStatus?.promotionStatus || 'missing'));
  const sourcePaths = Array.from(new Set(entries.map((entry) => entry.source?.sourcePath).filter(Boolean))).sort();

  return {
    version: 'abpath-material-expansion-proof.v1',
    generatedAt: new Date().toISOString(),
    source: {
      queue: 'src/content/materials/abpathMaterialExpansionQueue.json',
      queueVersion: queue.version,
      queueGeneratedAt: queue.generatedAt,
      queueSha256: sha256(queueRaw),
      queueGenerator: 'scripts/generate_abpath_material_expansion_queue.cjs',
    },
    purpose:
      'Coverage and promotion-readiness proof for the ABPath material expansion queue without promoting unreviewed AP or CP output.',
    queueTotals: {
      entries: queue.totals?.entries || entries.length,
      domains: sortedObject(queue.totals?.domains || {}),
      materialKinds: sortedObject(queue.totals?.materialKinds || {}),
      requiredMaterialSetItems: queue.totals?.requiredMaterialSetItems || 0,
      sourcePathCount: sourcePaths.length,
    },
    domainCoverage,
    reviewStatuses: {
      counts: reviewStatus,
      allUnreviewed: reviewStatus.unreviewed === entries.length && Object.keys(reviewStatus).length === 1,
    },
    promotionStatuses: {
      counts: promotionStatus,
      allInGenerationQueue:
        promotionStatus['generation-queue'] === entries.length && Object.keys(promotionStatus).length === 1,
    },
    promotionGuardrails: [
      ...queue.guardrails,
      'This proof is summary evidence only; it does not promote queue entries.',
      'Promotion remains blocked until source evidence, learner wording, required materials, validator proof, and faculty/owner review are attached to a bounded batch.',
    ],
    staleWhen: [
      'src/content/materials/abpathMaterialExpansionQueue.json changes without regenerating this proof',
      'scripts/generate_abpath_material_expansion_queue.cjs changes queue semantics without regenerating this proof',
      'AP or CP ABPath source specifications change and the queue is not regenerated before this proof',
      'any queue entry moves out of unreviewed generation-queue status without a new promotion proof',
    ],
  };
}

function buildMarkdown(payload) {
  const coverageRows = payload.domainCoverage.subjects.map((entry) => [
    entry.domain,
    entry.subject,
    String(entry.entries),
    Object.entries(entry.materialKinds)
      .map(([kind, count]) => `${kind}:${count}`)
      .join(', '),
    Object.entries(entry.difficulties)
      .map(([difficulty, count]) => `${difficulty}:${count}`)
      .join(', '),
  ]);

  return [
    '# ABPath Material Expansion Proof',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    '## Purpose',
    '',
    payload.purpose,
    '',
    '## Queue Totals',
    '',
    `- Entries: ${payload.queueTotals.entries}`,
    `- AP entries: ${payload.queueTotals.domains.AP || 0}`,
    `- CP entries: ${payload.queueTotals.domains.CP || 0}`,
    `- Material kinds: ${Object.entries(payload.queueTotals.materialKinds)
      .map(([kind, count]) => `${kind}=${count}`)
      .join(', ')}`,
    `- Required material set labels: ${payload.queueTotals.requiredMaterialSetItems}`,
    '',
    '## AP/CP Domain Coverage',
    '',
    `- AP subjects: ${payload.domainCoverage.subjectCountByDomain.AP || 0}`,
    `- CP subjects: ${payload.domainCoverage.subjectCountByDomain.CP || 0}`,
    '',
    markdownTable(['Domain', 'Subject', 'Entries', 'Kinds', 'Difficulties'], coverageRows),
    '',
    '## Review and Promotion Status',
    '',
    `- Review statuses: ${Object.entries(payload.reviewStatuses.counts)
      .map(([status, count]) => `${status}=${count}`)
      .join(', ')}`,
    `- Promotion statuses: ${Object.entries(payload.promotionStatuses.counts)
      .map(([status, count]) => `${status}=${count}`)
      .join(', ')}`,
    `- All unreviewed: ${payload.reviewStatuses.allUnreviewed ? 'yes' : 'no'}`,
    `- All in generation queue: ${payload.promotionStatuses.allInGenerationQueue ? 'yes' : 'no'}`,
    '',
    '## Promotion Guardrails',
    '',
    ...payload.promotionGuardrails.map((item) => `- ${item}`),
    '',
    '## Stale When',
    '',
    ...payload.staleWhen.map((item) => `- ${item}`),
    '',
    '## Source Fingerprint',
    '',
    `- Queue version: ${payload.source.queueVersion}`,
    `- Queue generated: ${payload.source.queueGeneratedAt}`,
    `- Queue sha256: ${payload.source.queueSha256}`,
  ].join('\n');
}

function main() {
  const payload = buildPayload();
  const markdown = buildMarkdown(payload);

  ensureDir(outJsonPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(outMdPath, `${markdown}\n`);

  console.log(`[ABPATH-MATERIAL-PROOF] Wrote proof for ${payload.queueTotals.entries} queue entries.`);
}

main();
