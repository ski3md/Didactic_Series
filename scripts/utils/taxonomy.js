import fs from 'fs/promises';
import path from 'path';

// load rules JSON (metadata_rules.json)
export async function loadRules(rulesPath) {
  try {
    const raw = await fs.readFile(rulesPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

// heuristics: infer entity and stain from file path names
export function inferFromPath(filePath, rules) {
  const fn = filePath.toLowerCase();
  // stain detection
  const stainMap = ['gms', 'pas', 'h&e', 'h&e', 'he', 'afb', 'polarized', 'polar'];
  let stain = 'H&E';
  for (const s of stainMap) {
    if (fn.includes(`/${s}/`) || fn.includes(`_${s}_`) || fn.includes(`-${s}-`) || fn.includes(` ${s} `)) {
      stain = s.toUpperCase().replace('HE', 'H&E');
      break;
    }
  }
  // entity detection by keyword
  let entity = 'unknown';
  if (rules && rules.entities) {
    for (const candidate of Object.keys(rules.entities)) {
      if (fn.includes(candidate.toLowerCase())) {
        entity = candidate;
        break;
      }
      // also check patterns
      const patterns = rules.entities[candidate]?.patterns || [];
      for (const p of patterns) {
        if (p.keyword && fn.includes(p.keyword.toLowerCase())) {
          entity = candidate;
          break;
        }
      }
      if (entity !== 'unknown') break;
    }
  }

  // category lookup from entity if available
  let category = rules?.entities?.[entity]?.category || 'unmapped';
  return { entity, category, stain };
}
