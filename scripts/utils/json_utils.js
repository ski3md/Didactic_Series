export function toCamel(s) {
  return s.replace(/[_-][a-z]/g, (m) => m[1].toUpperCase());
}

export function normalizeMetadata(raw) {
  // ensure keys we need exist and follow camelCase
  const out = {};
  out.id = raw.id;
  out.entity = raw.entity || 'unknown';
  out.category = raw.category || 'unmapped';
  out.pattern = raw.pattern || '';
  out.cells = raw.cells || [];
  out.stain = raw.stain || 'H&E';
  out.stainRole = raw.stainRole || '';
  out.organ = raw.organ || 'lung';
  out.system = raw.system || 'thoracic';
  out.difficulty = raw.difficulty || 'intermediate';
  out.path = raw.path;
  out.tags = raw.tags || [];
  out.teachingPoint = raw.teachingPoint || '';
  out.source = raw.source || 'local';
  return out;
}
