const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const GU_PATH = path.join(ROOT, 'src', 'content', 'gu', 'gu_signout_sims.json');
const SIM_DIR = path.join(ROOT, 'src', 'content', 'signout_sims');
const REPORT_PATH = path.join(ROOT, 'src', 'content', 'signout_sims', 'pubmed_oa_image_acquisition_report.json');
const ARTICLE_CACHE_DIR = path.join(ROOT, 'public', 'reference-library', 'source-articles', 'pmc-oa');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.tif', '.tiff']);
const CONVERTIBLE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff']);
const DEFAULT_RETMODE = 'json';

const args = process.argv.slice(2);
const getArg = (name) => {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const hasFlag = (name) => args.includes(name);
const dryRun = hasFlag('--dry-run');
const planOnly = hasFlag('--plan-only');
const replaceExisting = hasFlag('--replace');
const caseIdFilter = getArg('--case-id') || '';
const caseIdsFilter = new Set(
  (getArg('--case-ids') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
);
const limitCases = Number(getArg('--limit-cases') || 0);
const retmax = Number(getArg('--retmax') || 8);
const maxArticles = Number(getArg('--max-articles') || 4);
const delayMs = Number(getArg('--delay-ms') || process.env.PUBMED_OA_DELAY_MS || 450);
const email = getArg('--email') || process.env.NCBI_EMAIL || '';
const apiKey = getArg('--api-key') || process.env.NCBI_API_KEY || '';
const commercialOnly = hasFlag('--commercial-only');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const normalize = (value) =>
  String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim();

const decodeXml = (value) =>
  String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)));

const STOP_WORDS = new Set([
  'and',
  'biopsy',
  'case',
  'cell',
  'cells',
  'clinicopathologic',
  'diagnosis',
  'diagnostic',
  'disease',
  'figure',
  'gross',
  'histology',
  'histopathology',
  'image',
  'images',
  'pathology',
  'report',
  'resection',
  'signout',
  'study',
  'tumor',
  'tumour',
  'with',
]);

const ENTITY_STOP_WORDS = new Set([
  ...STOP_WORDS,
  'adenocarcinoma',
  'carcinoma',
  'malignant',
  'neoplasm',
]);

const tokensFor = (...values) =>
  [
    ...new Set(
      values
        .flatMap((value) => normalize(value).split(/\s+/))
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    ),
  ];

const entityTokensFor = (...values) =>
  [
    ...new Set(
      values
        .flatMap((value) => normalize(value).split(/\s+/))
        .filter((token) => token.length > 2 && !ENTITY_STOP_WORDS.has(token))
    ),
  ];

const outputExists = (image) => {
  const output = path.join(ROOT, 'public', image.src || '');
  return fs.existsSync(output) && fs.statSync(output).size > 0;
};

const curriculumFiles = [
  GU_PATH,
  ...(fs.existsSync(SIM_DIR)
    ? fs
        .readdirSync(SIM_DIR)
        .filter((file) => file.endsWith('_signout_sims.json'))
        .map((file) => path.join(SIM_DIR, file))
    : []),
];

const buildTargets = () => {
  const targets = [];
  for (const filePath of curriculumFiles) {
    const data = readJson(filePath);
    for (const item of data.cases || []) {
      if (!item.image?.src) continue;
      if (caseIdFilter && item.id !== caseIdFilter) continue;
      if (caseIdsFilter.size > 0 && !caseIdsFilter.has(item.id)) continue;
      if (!replaceExisting && outputExists(item.image)) continue;

      const targetStem = path.basename(item.image.src).replace(path.extname(item.image.src), '');
      const entityTokens = entityTokensFor(item.id, item.title, item.site, targetStem, item.reportingTarget).slice(0, 8);
      const figureTokens = tokensFor(item.image.caption, item.image.stain, item.title, item.reportingTarget, item.diagnosticSteps?.join(' ')).slice(0, 18);
      const quotedTitle = item.title.replace(/[:/]/g, ' ').replace(/\s+/g, ' ').trim();
      const tissueTerms = [item.site, item.specimenType, item.image.stain].filter(Boolean).join(' ');
      const entityTerm = entityTokens.slice(0, 5).join(' ');
      const captionTerm = item.image.caption.replace(/[^\w\s+-]/g, ' ').replace(/\s+/g, ' ').trim();
      const diagnosisPhrase = item.title.includes(':')
        ? item.title.split(':').slice(1).join(':').replace(/[^\w\s+-]/g, ' ').replace(/\s+/g, ' ').trim()
        : quotedTitle;
      const searchTerms = [
        [
          `(${quotedTitle} OR ${entityTerm})`,
          tissueTerms,
          '(histology OR histopathology OR cytology OR immunohistochemistry OR figure)',
          '(review OR editorial OR "case report" OR "case reports" OR clinicopathologic)',
          'open access[filter]',
        ],
        [
          `(${captionTerm} OR ${diagnosisPhrase})`,
          item.image.stain,
          '(histology OR histopathology OR cytology OR immunohistochemistry OR figure)',
          'open access[filter]',
        ],
        [
          `(${entityTerm} OR ${diagnosisPhrase})`,
          '(pathology OR histopathology OR cytology)',
          '(figure OR figures OR photomicrograph OR micrograph)',
          'open access[filter]',
        ],
      ].map((parts) => parts.filter(Boolean).join(' AND '));

      targets.push({
        caseId: item.id,
        title: item.title,
        specialty: data.specialty || data.title || path.basename(filePath),
        file: path.relative(ROOT, filePath),
        curriculumFilePath: filePath,
        localPath: item.image.src,
        outputPath: path.join(ROOT, 'public', item.image.src),
        expectedCaption: item.image.caption,
        expectedStain: item.image.stain,
        currentSourceUrl: item.image.sourceUrl || '',
        entityTokens,
        figureTokens,
        searchTerm: searchTerms[0],
        searchTerms,
      });
    }
  }
  return limitCases > 0 ? targets.slice(0, limitCases) : targets;
};

const requestJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'DidacticSeriesPathologyTraining/1.0' } }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 240)}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error(`JSON parse failed: ${error.message}`));
          }
        });
      })
      .on('error', reject);
  });

const requestText = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'DidacticSeriesPathologyTraining/1.0' } }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 240)}`));
            return;
          }
          resolve(body);
        });
      })
      .on('error', reject);
  });

const ncbiParams = () => {
  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (apiKey) params.set('api_key', apiKey);
  return params;
};

const searchPmc = async (target) => {
  const ids = [];
  const seen = new Set();
  const terms = target.searchTerms?.length ? target.searchTerms : [target.searchTerm];
  for (const term of terms) {
    const params = ncbiParams();
    params.set('db', 'pmc');
    params.set('term', term);
    params.set('retmode', DEFAULT_RETMODE);
    params.set('retmax', String(retmax));
    params.set('sort', 'relevance');
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${params.toString()}`;
    const result = await requestJson(url);
    for (const id of result.esearchresult?.idlist || []) {
      const pmcid = `PMC${id}`;
      if (seen.has(pmcid)) continue;
      seen.add(pmcid);
      ids.push(pmcid);
    }
    sleep(delayMs);
  }
  return ids;
};

const parseOaRecord = (xml) => {
  const recordMatch = xml.match(/<record\b([^>]*)>([\s\S]*?)<\/record>/i);
  if (!recordMatch) return null;
  const attrs = recordMatch[1];
  const body = recordMatch[2];
  const attr = (name) => decodeXml(attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] || '');
  const links = [...body.matchAll(/<link\b([^>]*)\/>/gi)].map((match) => {
    const linkAttrs = match[1];
    const linkAttr = (name) => decodeXml(linkAttrs.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] || '');
    return {
      format: linkAttr('format'),
      href: linkAttr('href'),
      updated: linkAttr('updated'),
    };
  });
  return {
    id: attr('id'),
    citation: attr('citation'),
    license: attr('license'),
    retracted: attr('retracted'),
    links,
  };
};

const getOaRecord = async (pmcid) => {
  const url = `https://www.ncbi.nlm.nih.gov/pmc/utils/oa/oa.fcgi?id=${encodeURIComponent(pmcid)}`;
  const xml = await requestText(url);
  return parseOaRecord(xml);
};

const licenseAllowed = (license) => {
  const normalized = normalize(license);
  if (!normalized) return false;
  if (commercialOnly && normalized.includes('nc')) return false;
  return normalized.includes('cc') || normalized.includes('public domain');
};

const downloadFile = (url, outputPath) => {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) return;
  const normalizedUrl = url.replace(/^ftp:\/\/ftp\.ncbi\.nlm\.nih\.gov\//i, 'https://ftp.ncbi.nlm.nih.gov/');
  const fallbackUrl = normalizedUrl.replace('/pub/pmc/oa_package/', '/pub/pmc/deprecated/oa_package/');
  const urls = [...new Set([normalizedUrl, fallbackUrl])];
  const errors = [];
  for (const candidateUrl of urls) {
    const result = spawnSync('curl', ['-fsSL', '--connect-timeout', '12', '--max-time', '90', '-o', outputPath, candidateUrl], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    if (result.status === 0) return;
    errors.push(`${candidateUrl}: ${result.stderr || result.stdout || `curl exited ${result.status}`}`);
  }
  throw new Error(errors.join('\n'));
};

const extractTarball = (tarballPath) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pmc-oa-'));
  const result = spawnSync('tar', ['-xzf', tarballPath, '-C', tempDir], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `tar exited ${result.status}`);
  return tempDir;
};

const walkFiles = (directory) => {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      if (entry.isFile()) files.push(fullPath);
    }
  };
  walk(directory);
  return files;
};

const stripTags = (value) => normalize(decodeXml(value).replace(/<[^>]+>/g, ' '));

const parseFigures = (xml, extractedFiles) => {
  const byStem = new Map();
  for (const filePath of extractedFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) continue;
    byStem.set(path.basename(filePath, ext), filePath);
  }

  return [...xml.matchAll(/<fig\b[\s\S]*?<\/fig>/gi)]
    .map((match, index) => {
      const figXml = match[0];
      const label = stripTags(figXml.match(/<label\b[^>]*>([\s\S]*?)<\/label>/i)?.[1] || `Figure ${index + 1}`);
      const caption = stripTags(figXml.match(/<caption\b[^>]*>([\s\S]*?)<\/caption>/i)?.[1] || '');
      const graphicIds = [...figXml.matchAll(/<graphic\b[^>]*(?:xlink:href|href)="([^"]+)"/gi)].map((graphic) => decodeXml(graphic[1]));
      const files = graphicIds
        .map((id) => byStem.get(id) || [...byStem.entries()].find(([stem]) => stem.includes(id) || id.includes(stem))?.[1])
        .filter(Boolean);
      return { label, caption, graphicIds, files };
    })
    .filter((fig) => fig.files.length > 0);
};

const scoreFigure = (target, figure) => {
  const text = normalize(`${figure.label} ${figure.caption} ${figure.graphicIds.join(' ')}`);
  const matchedEntity = target.entityTokens.filter((token) => text.includes(token));
  const matchedFigure = target.figureTokens.filter((token) => text.includes(token));
  const stainBonus = normalize(target.expectedStain)
    .split(/\s+/)
    .filter((token) => token.length > 1 && text.includes(token)).length;
  const diagnosticBonus = ['histolog', 'cytolog', 'immunohistochemistry', 'immunostain', 'hematoxylin', 'eosin', 'papanicolaou', 'wright', 'giemsa'].filter((token) =>
    text.includes(token)
  ).length;
  const rareEntity = matchedEntity.some((token) => token.length >= 6);
  if (matchedEntity.length === 0 || !rareEntity) return 0;
  return matchedEntity.length * 6 + matchedFigure.length * 2 + stainBonus * 3 + diagnosticBonus;
};

const findNxml = (files) => files.find((filePath) => path.extname(filePath).toLowerCase() === '.nxml') || files.find((filePath) => filePath.endsWith('.xml'));

const copyFigureToTarget = (sourcePath, targetPath) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const sourceExt = path.extname(sourcePath).toLowerCase();
  const targetExt = path.extname(targetPath).toLowerCase();
  const targetIsJpeg = ['.jpg', '.jpeg'].includes(targetExt);
  const needsConversion = sourceExt !== targetExt && CONVERTIBLE_EXTENSIONS.has(sourceExt) && CONVERTIBLE_EXTENSIONS.has(targetExt);
  if (needsConversion) {
    const format = targetIsJpeg ? 'jpeg' : targetExt.slice(1);
    const result = spawnSync('sips', ['-s', 'format', format, sourcePath, '--out', targetPath], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || `sips exited ${result.status}`);
    return;
  }
  fs.copyFileSync(sourcePath, targetPath);
};

const updateCurriculumProvenance = (target, result) => {
  const data = readJson(target.curriculumFilePath);
  const item = (data.cases || []).find((candidate) => candidate.id === target.caseId);
  if (!item?.image) return;
  item.image.sourceUrl = `https://pmc.ncbi.nlm.nih.gov/articles/${result.pmcid}/`;
  item.image.sourceArticle = {
    acquisitionMethod: 'pmc-open-access-figure-caption-match',
    pmcid: result.pmcid,
    citation: result.record?.citation || '',
    license: result.record?.license || '',
    figureLabel: result.figure?.label || '',
    figureCaption: result.figure?.caption || '',
    figureScore: result.figure?.score || 0,
    packageUrl: result.tgzUrl || '',
    acquiredAt: new Date().toISOString(),
  };
  fs.writeFileSync(target.curriculumFilePath, `${JSON.stringify(data, null, 2)}\n`);
};

const processArticle = async (target, pmcid) => {
  const record = await getOaRecord(pmcid);
  if (!record) return { status: 'no-oa-record', pmcid };
  if (record.retracted === 'yes') return { status: 'retracted', pmcid, record };
  if (!licenseAllowed(record.license)) return { status: 'license-not-allowed', pmcid, record };

  const tgzLink = record.links.find((link) => link.format === 'tgz' && link.href);
  if (!tgzLink) return { status: 'no-tgz', pmcid, record };

  const tarballPath = path.join(ARTICLE_CACHE_DIR, `${pmcid}.tar.gz`);
  if (!dryRun) downloadFile(tgzLink.href, tarballPath);
  if (dryRun && !fs.existsSync(tarballPath)) return { status: 'dry-run-no-cache', pmcid, record, tgzUrl: tgzLink.href };

  const extractedDir = extractTarball(tarballPath);
  const files = walkFiles(extractedDir);
  const nxmlPath = findNxml(files);
  if (!nxmlPath) return { status: 'no-nxml', pmcid, record };
  const xml = fs.readFileSync(nxmlPath, 'utf8');
  const parsedFigures = parseFigures(xml, files);
  const figures = parsedFigures
    .map((figure) => ({ ...figure, score: scoreFigure(target, figure) }))
    .sort((a, b) => b.score - a.score);

  const best = figures.find((figure) => figure.score > 0);
  if (!best) {
    return {
      status: 'no-matching-figure',
      pmcid,
      record,
      totalFigures: parsedFigures.length,
      topFigures: figures.slice(0, 5).map((figure) => ({
        label: figure.label,
        caption: figure.caption.slice(0, 360),
        score: figure.score,
        graphicIds: figure.graphicIds,
      })),
    };
  }

  const sourcePath = best.files.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
  if (!dryRun) copyFigureToTarget(sourcePath, target.outputPath);
  return {
    status: dryRun ? 'would-import' : 'imported',
    pmcid,
    record,
    sourcePath,
    outputPath: path.relative(ROOT, target.outputPath),
    figure: {
      label: best.label,
      caption: best.caption,
      score: best.score,
      graphicIds: best.graphicIds,
    },
    tgzUrl: tgzLink.href,
  };
};

const run = async () => {
  const targets = buildTargets();
  const report = {
    generatedAt: new Date().toISOString(),
    mode: planOnly ? 'plan-only' : dryRun ? 'dry-run' : 'import',
    retrievalPolicy: {
      database: 'PMC',
      filters: ['open access[filter]'],
      commercialOnly,
      note: 'Only PMC Open Access package links returned by the PMC OA Web Service are eligible for import.',
    },
    targets: targets.map((target) => ({
      caseId: target.caseId,
      title: target.title,
      specialty: target.specialty,
      localPath: target.localPath,
      searchTerm: target.searchTerm,
      searchTerms: target.searchTerms,
      entityTokens: target.entityTokens,
      figureTokens: target.figureTokens,
    })),
    imports: [],
    skipped: [],
    failures: [],
  };

  if (planOnly) {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ output: path.relative(ROOT, REPORT_PATH), targets: targets.length, mode: 'plan-only' }, null, 2));
    return;
  }

  for (const [index, target] of targets.entries()) {
    console.error(`SEARCH ${index + 1}/${targets.length}: ${target.caseId}`);
    try {
      const pmcids = await searchPmc(target);
      sleep(delayMs);
      if (pmcids.length === 0) {
        report.skipped.push({ caseId: target.caseId, status: 'no-pmc-results', searchTerm: target.searchTerm });
        continue;
      }
      let imported = null;
      const attempts = [];
      for (const pmcid of pmcids.slice(0, maxArticles)) {
        const result = await processArticle(target, pmcid);
        attempts.push(result);
        sleep(delayMs);
        if (['imported', 'would-import'].includes(result.status)) {
          imported = result;
          break;
        }
      }
      if (imported) {
        if (imported.status === 'imported' && !dryRun) updateCurriculumProvenance(target, imported);
        report.imports.push({ caseId: target.caseId, title: target.title, ...imported });
      } else {
        report.skipped.push({ caseId: target.caseId, title: target.title, status: 'no-usable-figure', attempts });
      }
    } catch (error) {
      report.failures.push({ caseId: target.caseId, title: target.title, error: error.message });
    }
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        output: path.relative(ROOT, REPORT_PATH),
        targets: targets.length,
        imports: report.imports.length,
        skipped: report.skipped.length,
        failures: report.failures.length,
        dryRun,
      },
      null,
      2
    )
  );
  if (report.failures.length > 0 || report.skipped.length > 0) process.exitCode = 1;
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
