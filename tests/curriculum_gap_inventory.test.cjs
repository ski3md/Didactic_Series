const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = process.cwd();
const schemaPath = path.join(root, 'schemas/curriculum-gap-inventory.schema.json');
const inventoryPath = path.join(root, 'reports/curriculum/gap_inventory_v1.json');
const validatorPath = path.join(root, 'scripts/validate_curriculum_gap_inventory.cjs');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const allGapLikeItems = (inventory) => [
  ...inventory.gap_items,
  ...inventory.weak_items,
  ...inventory.duplicate_items,
];

test('curriculum gap inventory has schema and inventory files', () => {
  assert.equal(fs.existsSync(schemaPath), true);
  assert.equal(fs.existsSync(inventoryPath), true);
});

test('curriculum gap inventory validates through the local validator', () => {
  assert.doesNotThrow(() => execFileSync('node', [validatorPath], { cwd: root, stdio: 'pipe' }));
});

test('curriculum gap inventory does not contain obvious scraped online content in gap items', () => {
  const inventory = readJson(inventoryPath);
  const serializedGapItems = JSON.stringify(allGapLikeItems(inventory));

  assert.doesNotMatch(serializedGapItems, /<html|<\/|https?:\/\/|www\./i);
  assert.doesNotMatch(serializedGapItems, /scraped_content|web_excerpt|verbatim_excerpt/i);
});

test('curriculum gap inventory uses unique gap ids and valid severities', () => {
  const schema = readJson(schemaPath);
  const inventory = readJson(inventoryPath);
  const gapItems = allGapLikeItems(inventory);
  const ids = gapItems.map((item) => item.gap_id);
  const validSeverities = new Set(schema.$defs.severity.enum);

  assert.equal(ids.length, new Set(ids).size);
  for (const item of gapItems) {
    assert.equal(validSeverities.has(item.severity), true);
  }
});

test('curriculum gap inventory requires recommended next actions on every gap-like item', () => {
  const inventory = readJson(inventoryPath);

  for (const item of allGapLikeItems(inventory)) {
    assert.equal(typeof item.recommended_next_action, 'string');
    assert.ok(item.recommended_next_action.length > 0);
  }
});
