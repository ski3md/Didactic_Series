#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const syllabusPath = path.join(root, 'src/content/syllabus/syllabus.normalized.json');
const outputPath = path.join(root, 'src/content/lectures/lectureAbpathSpecSeeds.ts');

const syllabus = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));

const rules = {
  renal_mass_eval: {
    categories: ['ap_gu'],
    terms: ['kidney', 'renal', 'tumor', 'urothelial', 'medical kidney', 'biopsy', 'processing'],
    include: ['The Genitourinary System > Kidney', 'The Genitourinary System > The Urothelial Tract and Bladder'],
  },
  testicular_mass_eval: {
    categories: ['ap_male_repro'],
    terms: ['testis', 'seminoma', 'teratoma', 'embryonal', 'yolk sac', 'germ cell', 'paratesticular'],
    include: ['Male Reproductive System > Testis'],
  },
  bladder_path_core_principles: {
    categories: ['ap_gu'],
    terms: ['urothelial', 'bladder', 'cis', 'muscularis propria', 'nephrogenic', 'bcg', 'radiation'],
    include: ['The Genitourinary System > The Urothelial Tract and Bladder'],
  },
  penile_who_complete_pathology: {
    categories: ['ap_male_repro'],
    terms: ['penis', 'penile', 'lichen', 'squamous', 'intraepithelial', 'balanitis', 'paget'],
    include: ['Male Reproductive System > Penis'],
  },
  testicular_who_complete_pathology: {
    categories: ['ap_male_repro'],
    terms: ['testis', 'seminoma', 'teratoma', 'embryonal', 'yolk sac', 'mixed germ cell', 'sex cord stromal'],
    include: ['Male Reproductive System > Testis'],
  },
  'ioc-overview-breast-surgery': {
    categories: ['ap_breast'],
    terms: ['breast', 'normal', 'radial scar', 'atypia', 'dcis', 'lcis', 'invasive', 'sentinel', 'margin'],
    include: ['Breast'],
    exclude: ['Lung Primary'],
  },
  'ioc-overview-endocrine-surgery': {
    categories: ['ap_endo'],
    terms: ['thyroid', 'follicular', 'papillary', 'medullary', 'anaplastic', 'hashimoto', 'graves', 'parathyroid'],
    include: ['The Endocrine System > The Thyroid'],
    exclude: ['Pituitary', 'Craniopharyngioma', 'sella'],
  },
  'ioc-overview-gynecologic-oncology': {
    categories: ['ap_cyto', 'ap_male_repro'],
    terms: ['cervix', 'uterine', 'endometrium', 'ovary', 'fallopian', 'vagina', 'gestational', 'trophoblastic'],
    include: ['Gynecologic', 'Cervix', 'Uterine', 'Endometrium', 'Ovary', 'Female'],
    exclude: ['Testis', 'Penis', 'Prostate'],
  },
  'ioc-overview-head-neck-surgery': {
    categories: ['ap_hn'],
    terms: ['head', 'neck', 'salivary', 'oral', 'larynx', 'sinonasal', 'nasopharynx', 'oropharynx'],
    include: ['Head and Neck', 'Salivary', 'Oral', 'Larynx', 'Sinonasal'],
  },
  'ioc-overview-hepatobiliary-surgery': {
    categories: ['ap_gi'],
    terms: ['liver', 'hepatic', 'biliary', 'gallbladder', 'cholangiocarcinoma', 'hepatocellular', 'cirrhosis'],
    include: ['Liver', 'Biliary', 'Gallbladder', 'Hepatic'],
    exclude: ['Pancreas'],
  },
  'ioc-overview-neuropathology': {
    categories: ['ap_neuro'],
    terms: ['brain', 'glioma', 'meningioma', 'metastasis', 'pituitary', 'embryonal', 'nerve sheath'],
    include: ['Neuro', 'Brain', 'Meninges', 'Central Nervous System'],
  },
  'ioc-overview-pancreatic-surgery': {
    categories: ['ap_gi'],
    terms: ['pancreas', 'pancreatic', 'ampulla', 'ductal adenocarcinoma', 'neuroendocrine', 'cystic'],
    include: ['Pancreas', 'Pancreatic', 'Ampulla'],
    exclude: ['Liver', 'Gallbladder'],
  },
  'ioc-overview-thoracic-surgery': {
    categories: ['ap_resp'],
    terms: ['lung', 'thoracic', 'pleura', 'mediastinum', 'adenocarcinoma', 'squamous', 'small cell'],
    include: ['Lung', 'Pleura', 'Mediastinum', 'Respiratory'],
  },
  'ioc-overview-urologic-oncology': {
    categories: ['ap_gu'],
    terms: ['kidney', 'renal', 'urothelial', 'bladder', 'processing', 'biopsy', 'tumor'],
    include: ['The Genitourinary System > Kidney', 'The Genitourinary System > The Urothelial Tract and Bladder'],
  },
};

const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const pathText = (topic) => (topic.provenance?.path_context ?? []).join(' > ');
const difficulty = (topic) => topic.provenance?.difficulty ?? topic.tags?.[0] ?? 'AP';
const isCoreOrAdvanced = (topic) => ['C', 'AR'].includes(difficulty(topic));

const scoreTopic = (topic, rule) => {
  const haystack = normalize(`${topic.title} ${topic.summary} ${pathText(topic)}`);
  const pathLabel = pathText(topic);
  const termScore = rule.terms.reduce((score, term) => score + (haystack.includes(normalize(term)) ? 10 : 0), 0);
  const includeScore = rule.include?.some((marker) => pathLabel.includes(marker)) ? 30 : 0;
  const depthScore = Math.min(topic.provenance?.path_context?.length ?? 0, 6);
  const difficultyScore = difficulty(topic) === 'C' ? 6 : difficulty(topic) === 'AR' ? 3 : 0;
  return termScore + includeScore + depthScore + difficultyScore;
};

const pickTopics = (rule, max = 10) => {
  const candidates = syllabus
    .filter((topic) => rule.categories.includes(topic.category))
    .filter(isCoreOrAdvanced)
    .filter((topic) => {
      const full = `${topic.title} ${topic.summary} ${pathText(topic)}`;
      if (rule.include?.length && !rule.include.some((marker) => full.includes(marker))) return false;
      if (rule.exclude?.some((marker) => full.includes(marker))) return false;
      return true;
    })
    .map((topic) => ({ topic, score: scoreTopic(topic, rule) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.topic.title.localeCompare(b.topic.title));

  const selected = [];
  const seen = new Set();
  for (const item of candidates) {
    const key = `${item.topic.title}|${pathText(item.topic)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push({
      title: item.topic.title,
      category: item.topic.category,
      designation: difficulty(item.topic),
      path: pathText(item.topic) || item.topic.summary || item.topic.title,
      sourceLine: item.topic.provenance?.source_line,
    });
    if (selected.length >= max) break;
  }
  return selected;
};

const seeds = Object.fromEntries(Object.entries(rules).map(([id, rule]) => [id, pickTopics(rule)]));

for (const [id, topics] of Object.entries(seeds)) {
  if (topics.length < 5) {
    throw new Error(`${id} only generated ${topics.length} ABPath topics`);
  }
}

const banner = `// Generated by scripts/generate_lecture_abpath_spec_seeds.cjs.\n// Keep this file small: it gives the browser lecture-specific ABPath crosswalks\n// without importing the full syllabus.normalized.json into the runtime bundle.\n`;
const body = `${banner}
export interface LectureAbpathSpecTopicSeed {
  title: string;
  category: string;
  designation: 'C' | 'AR' | string;
  path: string;
  sourceLine?: number;
}

export const lectureAbpathSpecSeeds: Record<string, LectureAbpathSpecTopicSeed[]> = ${JSON.stringify(seeds, null, 2)} as const;
`;

fs.writeFileSync(outputPath, body);
console.log(`Wrote ${path.relative(root, outputPath)} for ${Object.keys(seeds).length} lectures.`);
