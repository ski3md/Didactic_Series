#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const apSpecPath = path.join(repoRoot, 'src/content/syllabus/syllabus.normalized.json');
const cpSpecPath = path.join(repoRoot, 'src/content/downloads_imports/raw/cp_content_specification_11_11_25.raw.json');
const apGapPlanPath = path.join(repoRoot, 'reports/ap_gap_closure_plan.json');
const outJsonPath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const outReportPath = path.join(repoRoot, 'reports/abpath_material_expansion_queue.md');

const MATERIAL_KIND_BY_DEPTH = {
  1: 'header',
  2: 'subheader',
  3: 'subject',
  4: 'topic',
  5: 'subtopic',
};

const DOMAIN_LABELS = {
  ap_breast: 'Breast',
  ap_gu: 'Genitourinary',
  ap_male_repro: 'Male Reproductive',
  ap_cv: 'Cardiovascular / Autopsy-adjacent',
  ap_hn: 'Head and Neck',
  ap_gi: 'Gastrointestinal',
  ap_endo: 'Endocrine',
  ap_placenta: 'Placenta',
  ap_resp: 'Respiratory / Thoracic',
  ap_soft: 'Bone and Soft Tissue',
  ap_cyto: 'Cytopathology',
  ap_dermpath: 'Dermatopathology',
  ap_forensic: 'Forensic',
  ap_neuro: 'Neuropathology',
  ap_pediatric: 'Pediatric',
};

const CP_DOMAIN_IDS = {
  'Blood Banking/Transfusion Medicine': 'bb',
  Hematopathology: 'hp',
  'Chemical Pathology': 'cp',
  Microbiology: 'mb',
  'Management and Informatics': 'mi',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function stableHash(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 10);
}

function entryId(domain, sourceTopicId, categoryId, pathContext) {
  const compactSourceId = slugify(sourceTopicId);
  const compactCategory = slugify(categoryId);
  const compactTitle = slugify(pathContext.at(-1));
  const pathHash = stableHash(pathContext.join(' > '));
  return `${domain.toLowerCase()}-${compactCategory}-${compactSourceId}-${compactTitle}-${pathHash}`;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function materialKind(depth) {
  return MATERIAL_KIND_BY_DEPTH[depth] || 'set';
}

function apGeneratorProfile(entry) {
  const title = `${entry.title} ${entry.path.join(' ')}`.toLowerCase();
  if (/margin|stage|report|synoptic|grade|invasion/.test(title)) return 'reporting-workup-set';
  if (/molecular|gene|fusion|mutation|ihc|immuno|marker|stain/.test(title)) return 'ancillary-correlation-set';
  if (/tumou?r|carcinoma|sarcoma|lymphoma|melanoma|neoplasm/.test(title)) return 'entity-differential-set';
  if (/autopsy|forensic|death|scene/.test(title)) return 'scenario-reasoning-set';
  return 'morphology-foundation-set';
}

function cpGeneratorProfile(entry) {
  const title = `${entry.title} ${entry.path.join(' ')}`.toLowerCase();
  if (/quality|management|informatics|validation|verification|lis|proficiency/.test(title)) return 'lab-operations-set';
  if (/transfusion|blood|platelet|hla|apheresis|donor/.test(title)) return 'transfusion-decision-set';
  if (/micro|bacter|fung|virus|parasite|susceptibility|antimicrobial/.test(title)) return 'microbiology-workup-set';
  if (/chem|toxic|endocrine|protein|enzyme|electrolyte|therapeutic/.test(title)) return 'chemistry-interpretation-set';
  if (/hema|coag|marrow|lymph|leuk|anemia|thromb/.test(title)) return 'hematology-interpretation-set';
  return 'clinical-pathology-foundation-set';
}

function requiredMaterialSet(domain, profile) {
  if (domain === 'AP') {
    return [
      'plain-language objective',
      'image or explicit no-image rationale',
      'morphology-first teaching card',
      'differential diagnosis contrast',
      'ancillary/reporting consequence',
      'retrieval prompt',
      'faculty review checklist',
    ];
  }

  const common = [
    'plain-language objective',
    'bench-facing clinical question',
    'next-test or interpretation pathway',
    'critical-result or safety check',
    'retrieval prompt',
    'faculty review checklist',
  ];

  if (profile === 'lab-operations-set') return [...common, 'regulatory or quality-control artifact'];
  return [...common, 'representative laboratory artifact'];
}

function buildApEntries(apTopics, gapPlan) {
  const gapByTopicId = new Map((gapPlan.rows || []).map((row) => [row.topicId, row]));
  const entries = [];

  for (const topic of apTopics) {
    const provenance = topic.provenance || {};
    const pathContext = provenance.path_context || [topic.title].filter(Boolean);
    const depth = pathContext.length;
    const title = topic.title || pathContext.at(-1);
    const categoryId = provenance.category_id || topic.category;
    const profile = apGeneratorProfile({ title, path: pathContext });
    const gapRow = gapByTopicId.get(provenance.topic_id);

    entries.push({
      id: entryId('AP', provenance.topic_id || topic.id || title, categoryId, pathContext),
      domain: 'AP',
      materialKind: materialKind(depth),
      title,
      path: pathContext,
      categoryId,
      subject: DOMAIN_LABELS[categoryId] || categoryId,
      difficulty: provenance.difficulty || topic.tags?.[0] || 'unspecified',
      source: {
        sourcePath: 'src/content/syllabus/syllabus.normalized.json',
        rawSourcePath: topic.sourcePath || 'src/content/syllabus/parsed_topics_v3.raw.json',
        sourceTopicId: provenance.topic_id || topic.id,
        sourceLine: provenance.source_line || null,
      },
      generator: {
        tool: 'scripts/generate_abpath_material_expansion_queue.cjs',
        profile,
        requiredMaterialSet: requiredMaterialSet('AP', profile),
      },
      expansionStatus: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'generation-queue',
        gapPlanPriority: gapRow?.priority || null,
        gapPlanPhase: gapRow?.phase || null,
      },
    });
  }

  return entries;
}

function flattenCpSpec(roots) {
  const rows = [];

  function visit(node, pathContext = []) {
    const nextPath = [...pathContext, node.title];
    rows.push({
      id: node.id,
      title: node.title,
      level: node.level || 'unspecified',
      path: nextPath,
      root: nextPath[0],
      children: node.children || [],
    });
    for (const child of node.children || []) visit(child, nextPath);
  }

  for (const root of roots) visit(root);
  return rows;
}

function buildCpEntries(cpSpec) {
  return flattenCpSpec(cpSpec.SYLLABUS_DATA || []).map((topic) => {
    const profile = cpGeneratorProfile(topic);
    return {
      id: entryId('CP', topic.id, CP_DOMAIN_IDS[topic.root] || topic.root, topic.path),
      domain: 'CP',
      materialKind: materialKind(topic.path.length),
      title: topic.title,
      path: topic.path,
      categoryId: CP_DOMAIN_IDS[topic.root] || topic.root.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      subject: topic.root,
      difficulty: topic.level,
      source: {
        sourcePath: 'src/content/downloads_imports/raw/cp_content_specification_11_11_25.raw.json',
        rawSourcePath: 'src/content/syllabus/cp_spec.raw.txt',
        sourceTopicId: topic.id,
        sourceLine: null,
      },
      generator: {
        tool: 'scripts/generate_abpath_material_expansion_queue.cjs',
        profile,
        requiredMaterialSet: requiredMaterialSet('CP', profile),
      },
      expansionStatus: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'generation-queue',
        gapPlanPriority: null,
        gapPlanPhase: null,
      },
    };
  });
}

function countBy(entries, keyFn) {
  return entries.reduce((acc, entry) => {
    const key = keyFn(entry);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function summarizeDomains(entries) {
  return Object.entries(countBy(entries, (entry) => `${entry.domain}:${entry.subject}`))
    .map(([key, count]) => {
      const [domain, ...subjectParts] = key.split(':');
      const subject = subjectParts.join(':');
      const subjectEntries = entries.filter((entry) => entry.domain === domain && entry.subject === subject);
      return {
        domain,
        subject,
        count,
        materialKinds: countBy(subjectEntries, (entry) => entry.materialKind),
        difficulties: countBy(subjectEntries, (entry) => entry.difficulty),
      };
    })
    .sort((a, b) => a.domain.localeCompare(b.domain) || a.subject.localeCompare(b.subject));
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function main() {
  const apTopics = readJson(apSpecPath).filter((topic) => topic?.provenance?.is_valid_topic !== false);
  const cpSpec = readJson(cpSpecPath);
  const gapPlan = fs.existsSync(apGapPlanPath) ? readJson(apGapPlanPath) : { rows: [] };

  const entries = [...buildApEntries(apTopics, gapPlan), ...buildCpEntries(cpSpec)];
  const materialKinds = countBy(entries, (entry) => entry.materialKind);
  const domains = summarizeDomains(entries);

  const payload = {
    version: 'abpath-material-expansion-queue.v1',
    generatedAt: new Date().toISOString(),
    purpose:
      'Local bulk generator control plane for rapidly expanding AP and CP materials from ABPath-aligned local specifications without promoting unreviewed output.',
    guardrails: [
      'Generated rows are unreviewed generation-queue items, not authoritative teaching truth.',
      'Do not overwrite reviewed curriculum, source-truth mappings, or validated CP anchors from this queue.',
      'Every promoted item must retain source path, ABPath path, review status, and faculty/owner evidence.',
      'AP image-bearing material requires local/licensed image evidence or explicit no-image rationale.',
      'CP material requires bench-facing artifact evidence where an image is not the correct learning object.',
    ],
    sources: {
      apNormalizedSpec: 'src/content/syllabus/syllabus.normalized.json',
      cpStructuredSpec: 'src/content/downloads_imports/raw/cp_content_specification_11_11_25.raw.json',
      apGapPlan: fs.existsSync(apGapPlanPath) ? 'reports/ap_gap_closure_plan.json' : null,
    },
    totals: {
      entries: entries.length,
      domains: countBy(entries, (entry) => entry.domain),
      materialKinds,
      reviewStatus: countBy(entries, (entry) => entry.expansionStatus.reviewStatus),
      promotionStatus: countBy(entries, (entry) => entry.expansionStatus.promotionStatus),
      requiredMaterialSetItems: unique(entries.flatMap((entry) => entry.generator.requiredMaterialSet)).length,
    },
    domains,
    entries,
  };

  const report = [
    '# ABPath Material Expansion Queue',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    '## Purpose',
    '',
    payload.purpose,
    '',
    '## Totals',
    '',
    `- Entries: ${payload.totals.entries}`,
    `- AP entries: ${payload.totals.domains.AP || 0}`,
    `- CP entries: ${payload.totals.domains.CP || 0}`,
    `- Material kinds: ${Object.entries(materialKinds)
      .map(([kind, count]) => `${kind}=${count}`)
      .join(', ')}`,
    `- Review status: ${Object.entries(payload.totals.reviewStatus)
      .map(([status, count]) => `${status}=${count}`)
      .join(', ')}`,
    '',
    '## Guardrails',
    '',
    ...payload.guardrails.map((item) => `- ${item}`),
    '',
    '## Domain Coverage',
    '',
    markdownTable(
      ['Domain', 'Subject', 'Entries', 'Kinds', 'Difficulties'],
      domains.map((domain) => [
        domain.domain,
        domain.subject,
        String(domain.count),
        Object.entries(domain.materialKinds)
          .map(([kind, count]) => `${kind}:${count}`)
          .join(', '),
        Object.entries(domain.difficulties)
          .map(([difficulty, count]) => `${difficulty}:${count}`)
          .join(', '),
      ]),
    ),
    '',
    '## Next Promotion Rule',
    '',
    'Use this queue to generate bounded batches. Promote only after local source evidence, learner wording, required material set, validator proof, and review status are attached.',
  ].join('\n');

  ensureDir(outJsonPath);
  ensureDir(outReportPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(outReportPath, `${report}\n`);

  console.log(
    `[ABPATH-MATERIAL-QUEUE] Wrote ${entries.length} entries across ${domains.length} subjects to ${path.relative(
      repoRoot,
      outJsonPath,
    )}.`,
  );
}

main();
