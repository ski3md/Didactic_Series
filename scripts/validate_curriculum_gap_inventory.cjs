#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const schemaPath = path.join(root, 'schemas/curriculum-gap-inventory.schema.json');
const inventoryPath = path.join(root, 'reports/curriculum/gap_inventory_v1.json');

const failures = [];
const passes = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const schema = readJson(schemaPath);
const inventory = readJson(inventoryPath);

const ensure = (condition, passMessage, failMessage) => {
  if (condition) {
    passes.push(passMessage);
  } else {
    failures.push(failMessage);
  }
};

const requiredTopLevel = [
  'contract_version',
  'generated_at',
  'source_order',
  'inventory_scope',
  'coverage_items',
  'gap_items',
  'weak_items',
  'duplicate_items',
  'source_candidates',
  'human_escalations',
  'review_status',
];

const allowedGapTypes = new Set(schema.$defs.gap_type.enum);
const allowedSeverities = new Set(schema.$defs.severity.enum);
const allowedReviewStatuses = new Set(schema.$defs.review_status.enum);
const itemGroups = ['coverage_items', 'gap_items', 'weak_items', 'duplicate_items', 'source_candidates', 'human_escalations'];
const gapGroups = ['gap_items', 'weak_items', 'duplicate_items'];
const copiedContentKeys = new Set([
  'scraped_content',
  'source_text',
  'copied_text',
  'licensed_text',
  'web_excerpt',
  'verbatim_excerpt',
  'quote',
  'html',
]);

ensure(fs.existsSync(schemaPath), 'schema file exists', `missing schema file: ${schemaPath}`);
ensure(fs.existsSync(inventoryPath), 'inventory file exists', `missing inventory file: ${inventoryPath}`);

for (const field of requiredTopLevel) {
  ensure(Object.prototype.hasOwnProperty.call(inventory, field), `top-level field present: ${field}`, `missing top-level field: ${field}`);
}

ensure(
  inventory.inventory_scope?.mode === 'machine_readable_gap_inventory_only',
  'inventory mode is machine-readable only',
  'inventory_scope.mode must be machine_readable_gap_inventory_only'
);
ensure(inventory.inventory_scope?.internet_crawling === false, 'internet crawling is disabled', 'internet_crawling must be false');
ensure(inventory.inventory_scope?.new_source_ingestion === false, 'new source ingestion is disabled', 'new_source_ingestion must be false');
ensure(
  inventory.inventory_scope?.teaching_content_generation === false,
  'teaching content generation is disabled',
  'teaching_content_generation must be false'
);

ensure(
  Array.isArray(inventory.source_order) &&
    inventory.source_order.indexOf('Existing curriculum') < inventory.source_order.indexOf('Open-access online later only'),
  'source order keeps local sources before later online review',
  'source_order must place local sources before online review'
);

ensure(
  allowedReviewStatuses.has(inventory.review_status),
  'top-level review_status is valid',
  `invalid top-level review_status: ${inventory.review_status}`
);

for (const group of itemGroups) {
  ensure(Array.isArray(inventory[group]), `${group} is an array`, `${group} must be an array`);
  for (const [index, item] of (inventory[group] || []).entries()) {
    ensure(
      allowedReviewStatuses.has(item.review_status),
      `${group}[${index}] review_status is valid`,
      `${group}[${index}] has invalid review_status: ${item.review_status}`
    );
  }
}

const gapIds = [];
for (const group of gapGroups) {
  for (const [index, item] of (inventory[group] || []).entries()) {
    const label = `${group}[${index}]`;
    gapIds.push(item.gap_id);
    ensure(Boolean(item.gap_id), `${label} gap_id present`, `${label} is missing gap_id`);
    ensure(Boolean(item.topic), `${label} topic present`, `${label} is missing topic`);
    ensure(allowedGapTypes.has(item.gap_type), `${label} gap_type is valid`, `${label} invalid gap_type: ${item.gap_type}`);
    ensure(allowedSeverities.has(item.severity), `${label} severity is valid`, `${label} invalid severity: ${item.severity}`);
    ensure(
      Boolean(item.recommended_next_action),
      `${label} recommended_next_action present`,
      `${label} is missing recommended_next_action`
    );
    ensure(Array.isArray(item.evidence_refs), `${label} evidence_refs array present`, `${label} evidence_refs must be an array`);

    const itemKeys = new Set(Object.keys(item));
    const copiedKeysPresent = [...copiedContentKeys].filter((key) => itemKeys.has(key));
    ensure(
      copiedKeysPresent.length === 0,
      `${label} contains no copied web/licensed text fields`,
      `${label} must not include copied content fields: ${copiedKeysPresent.join(', ')}`
    );

    if (item.internet_required_later === true) {
      const serialized = JSON.stringify(item);
      ensure(
        !/(<html|<\/|https?:\/\/|www\.)/i.test(serialized),
        `${label} later-online item contains no scraped web content`,
        `${label} is marked internet_required_later but appears to contain web content or URLs`
      );
    }

    if (item.licensed_source_required_later === true) {
      const serialized = JSON.stringify(item);
      ensure(
        !/(expertpath|uptodate|statdx|radprimer|licensed_text|copied_text)/i.test(serialized),
        `${label} later-licensed item contains no copied licensed content`,
        `${label} is marked licensed_source_required_later but appears to contain licensed source text`
      );
    }
  }
}

ensure(
  gapIds.length === new Set(gapIds).size,
  'all gap-like IDs are unique',
  'gap_id values must be unique across gap_items, weak_items, and duplicate_items'
);

if (failures.length > 0) {
  console.error(`Curriculum gap inventory validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`[CURRICULUM-GAP-INVENTORY] Validation passed with ${passes.length} checks.`);
console.log(
  JSON.stringify(
    {
      gap_items: inventory.gap_items.length,
      weak_items: inventory.weak_items.length,
      duplicate_items: inventory.duplicate_items.length,
      source_candidates: inventory.source_candidates.length,
      human_escalations: inventory.human_escalations.length,
    },
    null,
    2
  )
);
