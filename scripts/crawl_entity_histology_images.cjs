#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const NETWORK_NODES_PATH = path.join(ROOT, 'src', 'content', 'derived', 'stainbrain_printable', 'network_nodes.from_service.json');
const CURATED_IMAGES_PATH = path.join(ROOT, 'src', 'content', 'derived', 'stainbrain_printable', 'histology_images.from_service.json');
const OUT_DIR = path.join(ROOT, 'src', 'content', 'images');

const args = process.argv.slice(2);
const getArg = (name, fallback = '') => {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const hasFlag = (name) => args.includes(name);

const entityFilter = getArg('--entity');
const limit = Number(getArg('--limit', 0));
const sourceList = new Set(
  String(getArg('--sources', 'commons,pmc'))
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);
const maxCandidates = Number(getArg('--max-candidates', 4));
const maxPmcArticles = Number(getArg('--max-pmc-articles', 2));
const delayMs = Number(getArg('--delay-ms', process.env.ENTITY_CRAWL_DELAY_MS || 275));
const retmax = Number(getArg('--retmax', 6));
const minSeedScore = Number(getArg('--min-seed-score', 14));
const dryRun = hasFlag('--dry-run');
const inputReportPath = getArg('--input-report');
const statusFilter = new Set(
  String(getArg('--status-filter'))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);
const outputPrefix = getArg('--output-prefix');
const safeOutputPrefix = String(outputPrefix || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');
const reportPath = outputPrefix
  ? path.join(OUT_DIR, `entity_histology_webcrawl_${safeOutputPrefix}_candidates.json`)
  : path.join(OUT_DIR, 'entity_histology_webcrawl_candidates.json');
const seedsPath = outputPrefix
  ? path.join(OUT_DIR, `entity_histology_webcrawl_${safeOutputPrefix}_seeds.json`)
  : path.join(OUT_DIR, 'entity_histology_webcrawl_seeds.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readJson = (filePath, fallback) => {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const normalize = (value) =>
  String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim();

const slugify = (value) =>
  normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const decodeHtml = (value) =>
  String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'");

const stripHtml = (value) => normalize(decodeHtml(String(value || '').replace(/<[^>]+>/g, ' ')));

const GENERIC_TOKENS = new Set([
  'adenocarcinoma',
  'benign',
  'ca',
  'cancer',
  'carcinoma',
  'cell',
  'cells',
  'cyst',
  'disease',
  'epithelial',
  'grade',
  'high',
  'histology',
  'histopathology',
  'low',
  'malignant',
  'neoplasm',
  'pathology',
  'primary',
  'sarcoma',
  'squamous',
  'tumor',
  'tumour',
]);

const HISTOLOGY_TERMS = [
  'histology',
  'histopathology',
  'micrograph',
  'photomicrograph',
  'microscopy',
  'hematoxylin',
  'eosin',
  'h&e',
  'he stain',
  'immunohistochemistry',
  'cytology',
];

const NEGATIVE_TERMS = [
  'gross',
  'ct ',
  'mri',
  'radiograph',
  'ultrasound',
  'endoscopy',
  'diagram',
  'chart',
  'graph',
  'logo',
  'map',
];

const ABBREVIATIONS = new Map([
  ['adeno', 'adenocarcinoma'],
  ['ca', 'carcinoma'],
  ['rcc', 'renal cell carcinoma'],
  ['scc', 'squamous cell carcinoma'],
  ['net', 'neuroendocrine tumor'],
  ['pnst', 'peripheral nerve sheath tumor'],
  ['sft', 'solitary fibrous tumor'],
  ['lgfms', 'low grade fibromyxoid sarcoma'],
  ['wdlps', 'well differentiated liposarcoma'],
  ['ddlps', 'dedifferentiated liposarcoma'],
  ['hgsc', 'high grade serous carcinoma'],
  ['lgsc', 'low grade serous carcinoma'],
  ['dcis', 'ductal carcinoma in situ'],
  ['lcis', 'lobular carcinoma in situ'],
  ['adh', 'atypical ductal hyperplasia'],
  ['fea', 'flat epithelial atypia'],
  ['asap', 'atypical small acinar proliferation'],
  ['bcc', 'basal cell carcinoma'],
  ['dfsp', 'dermatofibrosarcoma protuberans'],
  ['mpnst', 'malignant peripheral nerve sheath tumor'],
  ['gct', 'giant cell tumor'],
  ['ett', 'epithelioid trophoblastic tumor'],
  ['pstt', 'placental site trophoblastic tumor'],
  ['stump', 'smooth muscle tumor of uncertain malignant potential'],
  ['dvin', 'differentiated vulvar intraepithelial neoplasia'],
  ['vain', 'vaginal intraepithelial neoplasia'],
  ['ipmn', 'intraductal papillary mucinous neoplasm'],
  ['lamn', 'low grade appendiceal mucinous neoplasm'],
  ['pash', 'pseudoangiomatous stromal hyperplasia'],
  ['pcnsl', 'primary cns lymphoma'],
  ['lch', 'langerhans cell histiocytosis'],
  ['uip', 'usual interstitial pneumonia'],
  ['ubc', 'urothelial carcinoma'],
  ['ups', 'undifferentiated pleomorphic sarcoma'],
  ['emc', 'extraskeletal myxoid chondrosarcoma'],
  ['ehe', 'epithelioid hemangioendothelioma'],
  ['afx', 'atypical fibroxanthoma'],
  ['nof', 'non ossifying fibroma'],
  ['fatwo', 'female adnexal tumor of wolffian origin'],
  ['utrosct', 'uterine tumor resembling ovarian sex cord tumor'],
  ['scfoht', 'small cell carcinoma of ovary hypercalcemic type'],
  ['sccoht', 'small cell carcinoma of ovary hypercalcemic type'],
]);

const EXPANSION_REPLACEMENTS = [
  [/\bCa\b/g, 'Carcinoma'],
  [/\bAdeno\b/g, 'Adenocarcinoma'],
  [/\bRCC\b/g, 'Renal Cell Carcinoma'],
  [/\bSCC\b/g, 'Squamous Cell Carcinoma'],
  [/\bCa\b/gi, 'carcinoma'],
  [/\bAdeno\b/gi, 'adenocarcinoma'],
];

const expandEntityName = (entity) => {
  const normalized = normalize(entity);
  if (ABBREVIATIONS.has(normalized)) return ABBREVIATIONS.get(normalized);
  return EXPANSION_REPLACEMENTS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), entity);
};

const entityTokensFor = (entity) =>
  normalize(expandEntityName(entity))
    .split(/\s+/)
    .filter((token) => token.length > 2 && !GENERIC_TOKENS.has(token));

const unique = (values) => [...new Set(values.filter(Boolean))];

const uniqueEntityNodes = (nodes) => {
  const byId = new Map();
  for (const node of nodes) {
    const key = normalize(node.id);
    if (!key) continue;
    const existing = byId.get(key);
    if (!existing) {
      byId.set(key, { ...node, groups: [node.group].filter(Boolean), duplicateCount: 1 });
      continue;
    }
    existing.group = existing.group || node.group;
    existing.groups = unique([...(existing.groups || []), node.group]);
    existing.locations = unique([...(existing.locations || []), ...(node.locations || [])]);
    existing.duplicateCount += 1;
  }
  return [...byId.values()];
};

const entitySearchTerms = (node) => {
  const entity = node.id;
  const expanded = expandEntityName(entity);
  const location = (node.locations || []).slice(0, 2).join(' ');
  const baseTerms = unique([entity, expanded]);
  const terms = [];
  for (const term of baseTerms) {
    terms.push(`${term} histology`);
    terms.push(`${term} histopathology micrograph`);
    if (location) terms.push(`${term} ${location} pathology`);
  }
  return unique(terms).slice(0, 5);
};

const candidateText = (candidate) =>
  normalize(
    [
      candidate.title,
      candidate.description,
      candidate.caption,
      candidate.categories?.join(' '),
      candidate.sourcePageUrl,
      candidate.fullUrl,
    ].join(' ')
  );

const scoreCandidate = (node, candidate) => {
  const text = candidateText(candidate);
  const entityTokens = entityTokensFor(node.id);
  const matchedEntityTokens = entityTokens.filter((token) => text.includes(token));
  const exactEntity = normalize(candidate.title).includes(normalize(node.id)) || normalize(candidate.description).includes(normalize(node.id));
  const histologyHits = HISTOLOGY_TERMS.filter((term) => text.includes(normalize(term))).length;
  const locationHits = (node.locations || []).filter((location) => text.includes(normalize(location))).length;
  const negativeHits = NEGATIVE_TERMS.filter((term) => text.includes(normalize(term))).length;
  const sourceBonus = candidate.source === 'wikimedia-commons' ? 1 : 0;
  const licenseBonus = candidate.license ? 1 : 0;
  const score =
    matchedEntityTokens.length * 7 +
    (exactEntity ? 8 : 0) +
    histologyHits * 4 +
    locationHits * 2 +
    sourceBonus +
    licenseBonus -
    negativeHits * 9;
  return {
    score,
    matchedEntityTokens,
    histologyHits,
    locationHits,
    negativeHits,
    confidence: score >= 24 ? 'high' : score >= minSeedScore ? 'medium' : 'low',
  };
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DidacticSeriesEntityHistologyCrawler/1.0 (+https://github.com/ski3md/Didactic_Series)',
      Accept: 'application/json,text/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 240)}`);
  }
  return response.json();
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DidacticSeriesEntityHistologyCrawler/1.0 (+https://github.com/ski3md/Didactic_Series)',
      Accept: 'application/xml,text/xml,text/html;q=0.8,*/*;q=0.5',
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status}: ${body.slice(0, 240)}`);
  }
  return response.text();
};

const commonsLicenseAllowed = (license) => {
  const normalized = normalize(license);
  return normalized.includes('cc') || normalized.includes('public domain') || normalized.includes('pd');
};

const readCommonsMetadata = (imageInfo = {}) => {
  const ext = imageInfo.extmetadata || {};
  const value = (key) => decodeHtml(ext[key]?.value || '');
  return {
    description: value('ImageDescription'),
    license: value('LicenseShortName') || value('UsageTerms'),
    licenseUrl: value('LicenseUrl'),
    attribution: value('Artist') || value('Credit'),
    credit: value('Credit'),
    objectName: value('ObjectName'),
  };
};

const crawlCommons = async (node) => {
  const candidates = [];
  const seenPages = new Set();
  for (const term of entitySearchTerms(node).slice(0, 3)) {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrnamespace: '6',
      gsrlimit: String(retmax),
      gsrsearch: term,
      prop: 'imageinfo|categories',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '768',
      cllimit: '20',
      format: 'json',
      origin: '*',
    });
    const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
    const data = await fetchJson(url);
    await sleep(delayMs);
    for (const page of Object.values(data.query?.pages || {})) {
      const info = page.imageinfo?.[0] || {};
      if (!info.url || !String(info.mime || '').startsWith('image/')) continue;
      if (String(info.mime || '').includes('svg')) continue;
      const sourcePageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title).replace(/%3A/i, ':')}`;
      if (seenPages.has(sourcePageUrl)) continue;
      seenPages.add(sourcePageUrl);
      const metadata = readCommonsMetadata(info);
      if (metadata.license && !commonsLicenseAllowed(metadata.license)) continue;
      const candidate = {
        source: 'wikimedia-commons',
        query: term,
        title: metadata.objectName || page.title.replace(/^File:/, ''),
        description: metadata.description,
        categories: (page.categories || []).map((category) => category.title.replace(/^Category:/, '')),
        thumbUrl: info.thumburl || info.url,
        fullUrl: info.url,
        sourcePageUrl,
        license: metadata.license,
        licenseUrl: metadata.licenseUrl,
        attribution: metadata.attribution,
        credit: metadata.credit,
      };
      candidates.push(candidate);
    }
  }
  return candidates;
};

const searchPmc = async (node) => {
  const ids = [];
  const seen = new Set();
  const terms = entitySearchTerms(node)
    .slice(0, 2)
    .map((term) => `${term} AND (histology OR histopathology OR micrograph OR photomicrograph OR figure) AND open access[filter]`);
  for (const term of terms) {
    const params = new URLSearchParams({
      db: 'pmc',
      term,
      retmode: 'json',
      retmax: String(retmax),
      sort: 'relevance',
    });
    const data = await fetchJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params.toString()}`);
    await sleep(delayMs);
    for (const id of data.esearchresult?.idlist || []) {
      const pmcid = `PMC${id}`;
      if (seen.has(pmcid)) continue;
      seen.add(pmcid);
      ids.push(pmcid);
    }
  }
  return ids;
};

const parseOaRecord = (xml) => {
  const recordMatch = xml.match(/<record\b([^>]*)>([\s\S]*?)<\/record>/i);
  if (!recordMatch) return null;
  const attrs = recordMatch[1];
  const attr = (name) => decodeHtml(attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] || '');
  return {
    id: attr('id'),
    citation: attr('citation'),
    license: attr('license'),
    retracted: attr('retracted'),
  };
};

const crawlPmc = async (node) => {
  const candidates = [];
  const pmcids = await searchPmc(node);
  for (const pmcid of pmcids.slice(0, maxPmcArticles)) {
    const oaXml = await fetchText(`https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=${encodeURIComponent(pmcid)}`);
    await sleep(delayMs);
    const record = parseOaRecord(oaXml);
    if (!record || record.retracted === 'yes') continue;
    const license = record.license || '';
    if (!normalize(license).includes('cc') && !normalize(license).includes('public domain')) continue;
    const articleUrl = `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`;
    let figureCandidates = [];
    try {
      const html = await fetchText(articleUrl);
      await sleep(delayMs);
      figureCandidates = [...html.matchAll(/<figure\b([\s\S]*?)<\/figure>/gi)]
        .map((match, index) => {
          const figureHtml = match[0];
          const figureId = figureHtml.match(/\bid="([^"]+)"/i)?.[1] || `figure-${index + 1}`;
          const imageUrl = decodeHtml(figureHtml.match(/<img\b[^>]+\bsrc="([^"]+)"/i)?.[1] || '');
          const label = stripHtml(figureHtml.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || figureId);
          const caption = stripHtml(figureHtml.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] || '');
          if (!imageUrl) return null;
          return {
            source: 'pmc-open-access-figure',
            query: `${node.id} histology open access`,
            title: `${record.citation || pmcid} ${label}`.trim(),
            description: record.citation || '',
            caption,
            thumbUrl: imageUrl,
            fullUrl: imageUrl,
            sourcePageUrl: `${articleUrl}#${figureId}`,
            license,
            pmcid,
            figureId,
          };
        })
        .filter(Boolean);
    } catch (error) {
      candidates.push({
        source: 'pmc-open-access',
        query: `${node.id} histology open access`,
        title: record.citation || `${node.id} PMC Open Access article`,
        description: record.citation || '',
        caption: '',
        sourcePageUrl: articleUrl,
        fullUrl: articleUrl,
        license,
        pmcid,
        note: `Article-level OA candidate; figure scrape failed: ${error.message}`,
      });
    }
    candidates.push(...figureCandidates);
  }
  return candidates;
};

const existingMatchesFor = (node, curatedImages) => {
  const entity = normalize(node.id);
  return curatedImages
    .filter((image) => {
      const imageEntity = normalize(image.entity || '');
      const title = normalize(image.title || '');
      return imageEntity === entity || title.includes(entity) || entity.includes(imageEntity);
    })
    .slice(0, 4)
    .map((image) => ({
      source: 'existing-curated-atlas',
      title: image.title,
      entity: image.entity,
      thumbUrl: image.thumbUrl,
      fullUrl: image.fullUrl,
      sourcePageUrl: image.sourcePageUrl,
    }));
};

const bestCandidates = (node, candidates) =>
  candidates
    .map((candidate) => ({ ...candidate, scoring: scoreCandidate(node, candidate) }))
    .filter((candidate) => candidate.scoring.score > 0)
    .sort((left, right) => right.scoring.score - left.scoring.score)
    .slice(0, maxCandidates);

const toSeedRow = (entityResult) => {
  const best = entityResult.candidates.find((candidate) => candidate.source === 'wikimedia-commons') || entityResult.candidates[0];
  if (!best || best.scoring.score < minSeedScore || !['wikimedia-commons', 'pmc-open-access-figure'].includes(best.source)) return null;
  const sourceName = best.source === 'wikimedia-commons' ? 'Wikimedia Commons' : 'PMC Open Access';
  return {
    id: `webcrawl_${slugify(entityResult.entity)}_${slugify(best.title).slice(0, 48)}`,
    entity: entityResult.entity,
    modality: 'histology',
    title: best.title,
    description: best.description || `Histology candidate for ${entityResult.entity}.`,
    thumbUrl: best.thumbUrl,
    fullUrl: best.fullUrl,
    sourcePageUrl: best.sourcePageUrl,
    source: sourceName,
    license: best.license,
    licenseUrl: best.licenseUrl,
    attribution: best.attribution || best.credit || '',
    confidence: best.scoring.confidence,
    score: best.scoring.score,
    matchedEntityTokens: best.scoring.matchedEntityTokens,
    crawler: best.source === 'wikimedia-commons' ? 'wikimedia-commons-api' : 'pmc-open-access-html-figure-crawler',
    reviewStatus: 'needs-pathologist-review',
  };
};

const main = async () => {
  const inputReport = inputReportPath ? readJson(path.resolve(ROOT, inputReportPath), null) : null;
  const filteredEntities = new Set(
    inputReport && statusFilter.size > 0
      ? (inputReport.entities || [])
          .filter((item) => statusFilter.has(item.status))
          .map((item) => normalize(item.entity))
      : []
  );
  const rawEntityNodes = readJson(NETWORK_NODES_PATH, []).filter((node) => node.type === 'entity');
  const dedupedEntityNodes = uniqueEntityNodes(rawEntityNodes);
  const nodes = dedupedEntityNodes
    .filter((node) => !entityFilter || normalize(node.id) === normalize(entityFilter) || normalize(node.id).includes(normalize(entityFilter)))
    .filter((node) => filteredEntities.size === 0 || filteredEntities.has(normalize(node.id)));
  const targets = limit > 0 ? nodes.slice(0, limit) : nodes;
  const curatedImages = readJson(CURATED_IMAGES_PATH, []);
  const results = [];

  for (const [index, node] of targets.entries()) {
    process.stderr.write(`CRAWL ${index + 1}/${targets.length}: ${node.id}\n`);
    const existingMatches = existingMatchesFor(node, curatedImages);
    const rawCandidates = [];
    const failures = [];
    if (sourceList.has('commons')) {
      try {
        rawCandidates.push(...(await crawlCommons(node)));
      } catch (error) {
        failures.push({ source: 'wikimedia-commons', error: error.message });
      }
    }
    if (sourceList.has('pmc')) {
      try {
        rawCandidates.push(...(await crawlPmc(node)));
      } catch (error) {
        failures.push({ source: 'pmc-open-access', error: error.message });
      }
    }
    const candidates = bestCandidates(node, rawCandidates);
    results.push({
      entity: node.id,
      group: node.group,
      locations: node.locations || [],
      existingMatches,
      candidates,
      status: existingMatches.length > 0 ? 'already-covered' : candidates.length > 0 ? 'candidate-found' : 'no-candidate-found',
      failures,
    });
  }

  const seedRows = results.map(toSeedRow).filter(Boolean);
  const report = {
    generatedAt: new Date().toISOString(),
    mode: dryRun ? 'dry-run' : 'write',
    sourcePolicy: {
      sources: [...sourceList],
      commons: 'Wikimedia Commons API, reusable image metadata, SVG excluded.',
      pmc: 'PMC Open Access article-level candidate search; figure images require package extraction before promotion.',
      review: 'Candidates are not diagnostic approvals. Pathologist review is required before use as teaching reference images.',
    },
    parameters: {
      entityFilter,
      limit,
      retmax,
      maxCandidates,
      maxPmcArticles,
      minSeedScore,
      delayMs,
      inputReportPath,
      statusFilter: [...statusFilter],
      outputPrefix,
    },
    summary: {
      rawEntityNodes: rawEntityNodes.length,
      entitiesScanned: results.length,
      duplicateEntityNodesCollapsed: rawEntityNodes.length - dedupedEntityNodes.length,
      alreadyCovered: results.filter((result) => result.existingMatches.length > 0).length,
      entitiesWithCandidates: results.filter((result) => result.candidates.length > 0).length,
      entitiesWithHighConfidenceSeeds: seedRows.filter((row) => row.confidence === 'high').length,
      seedRows: seedRows.length,
      noCandidateFound: results.filter((result) => result.candidates.length === 0).length,
      failures: results.reduce((sum, result) => sum + result.failures.length, 0),
    },
    entities: results,
  };

  if (!dryRun) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(seedsPath, `${JSON.stringify(seedRows, null, 2)}\n`);
  }

  console.log(
    JSON.stringify(
      {
        report: dryRun ? null : path.relative(ROOT, reportPath),
        seeds: dryRun ? null : path.relative(ROOT, seedsPath),
        ...report.summary,
      },
      null,
      2
    )
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
