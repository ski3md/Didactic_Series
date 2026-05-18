#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const childProcess = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..");
const AP_TOPICS_PATH = path.join(REPO_ROOT, "src/content/syllabus/parsed_topics_v3.raw.json");
const TUTORIAL_PATHS = [
  path.join(REPO_ROOT, "src/content/tutorials/tutorials.normalized.json"),
  path.join(REPO_ROOT, "src/content/downloads_imports/normalized/tutorials.normalized.json"),
  path.join(REPO_ROOT, "src/content/tutorials/clinicalPathInteractiveTutorials.json"),
];
const LABEL_VALIDATION_PATH = path.join(REPO_ROOT, "reports/tutorial_label_validation.json");
const CP_PDF_PATH = "/Volumes/DB_External/Content Specifications ABPath - Clinical Pathology.pdf";
const CP_TEXT_PATH = path.join(REPO_ROOT, "tmp/pdfs/abpath_cp_spec.txt");
const OUT_JSON = path.join(REPO_ROOT, "src/content/tutorials/tutorialAbpathSpecCrosswalk.json");
const OUT_REPORT = path.join(REPO_ROOT, "reports/tutorial_abpath_spec_crosswalk.md");
const OUT_CSV = path.join(REPO_ROOT, "reports/tutorial_abpath_spec_crosswalk.csv");
const OUT_COVERAGE = path.join(REPO_ROOT, "reports/tutorial_abpath_spec_coverage.json");

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "case", "cases", "clinical",
  "content", "disease", "diseases", "disorder", "disorders", "for", "from", "general",
  "high", "in", "into", "is", "key", "lab", "laboratory", "management", "of", "on",
  "or", "pathology", "patient", "patients", "pattern", "points", "review", "section",
  "specific", "specimen", "study", "teaching", "test", "tests", "the", "therapy",
  "to", "treatment", "tutorial", "tumor", "tumors", "with",
]);

const DOMAIN_ROOT_HINTS = {
  AP: {
    "ap_breast": "Breast",
    "ap_cv": "Cardiovascular",
    "ap_cyto": "Cytopathology",
    "ap_dermpath": "Dermatopathology",
    "ap_endo": "Endocrine",
    "ap_forensic": "Forensic Pathology",
    "ap_gi": "Gastrointestinal",
    "ap_gu": "Genitourinary",
    "ap_hn": "Head and Neck",
    "ap_male_repro": "Male Reproductive",
    "ap_neuro": "Neuropathology",
    "ap_pediatric": "Pediatric Pathology",
    "ap_placenta": "Placental Pathology",
    "ap_resp": "Pulmonary",
    "ap_soft": "Bone and Soft Tissue",
  },
  CP: {
    bb: "Blood Banking/Transfusion Medicine",
    cp: "Chemical Pathology",
    hp: "Hematopathology for Clinical Pathology",
    mb: "Medical Microbiology",
    mi: "Management and Informatics",
  },
};

const ALIASES = new Map([
  ["aiha", ["autoimmune", "hemolytic", "anemia"]],
  ["all", ["acute", "lymphoblastic", "leukemia"]],
  ["aml", ["acute", "myeloid", "leukemia"]],
  ["aabb", ["blood", "banking", "transfusion"]],
  ["abg", ["blood", "gas"]],
  ["adh", ["atypical", "ductal", "hyperplasia"]],
  ["alh", ["atypical", "lobular", "hyperplasia"]],
  ["alp", ["alkaline", "phosphatase"]],
  ["alt", ["alanine", "aminotransferase"]],
  ["aptt", ["activated", "partial", "thromboplastin"]],
  ["ast", ["aspartate", "aminotransferase"]],
  ["bnp", ["natriuretic", "peptide"]],
  ["cci", ["corrected", "count", "increment"]],
  ["cll", ["chronic", "lymphocytic", "leukemia"]],
  ["cml", ["chronic", "myeloid", "leukemia"]],
  ["cmml", ["chronic", "myelomonocytic", "leukemia"]],
  ["dcis", ["ductal", "carcinoma", "in", "situ"]],
  ["dic", ["disseminated", "intravascular", "coagulation"]],
  ["dlbcl", ["diffuse", "large", "b", "cell", "lymphoma"]],
  ["ebv", ["epstein", "barr", "virus"]],
  ["ffpe", ["formalin", "fixed", "paraffin"]],
  ["ggt", ["gamma", "glutamyl", "transferase"]],
  ["hla", ["human", "leukocyte", "antigen"]],
  ["hpa", ["human", "platelet", "antigen"]],
  ["hpv", ["human", "papillomavirus"]],
  ["hit", ["heparin", "induced", "thrombocytopenia"]],
  ["hus", ["hemolytic", "uremic", "syndrome"]],
  ["ife", ["immunofixation", "electrophoresis"]],
  ["ihc", ["immunohistochemistry", "immunostain"]],
  ["itp", ["immune", "thrombocytopenia"]],
  ["lcis", ["lobular", "carcinoma", "in", "situ"]],
  ["malt", ["mucosa", "associated", "lymphoid", "tissue"]],
  ["mds", ["myelodysplastic", "syndrome"]],
  ["mpn", ["myeloproliferative", "neoplasm"]],
  ["naat", ["nucleic", "acid", "amplification"]],
  ["pnh", ["paroxysmal", "nocturnal", "hemoglobinuria"]],
  ["pt", ["prothrombin", "time"]],
  ["spep", ["serum", "protein", "electrophoresis"]],
  ["taco", ["transfusion", "associated", "circulatory", "overload"]],
  ["tdm", ["therapeutic", "drug", "monitoring"]],
  ["tpe", ["therapeutic", "plasma", "exchange"]],
  ["trali", ["transfusion", "related", "acute", "lung", "injury"]],
  ["ttp", ["thrombotic", "thrombocytopenic", "purpura"]],
  ["udh", ["usual", "ductal", "hyperplasia"]],
  ["vwd", ["von", "willebrand", "disease"]],
]);

const AP_ROOT_INDEX = rootDomainIndex("AP");
const CP_ROOT_INDEX = rootDomainIndex("CP");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, " ")
    .toLowerCase()
    .replace(/([a-z])\/([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const raw = normalizeText(value).split(" ").filter(Boolean);
  const expanded = [];
  for (const token of raw) {
    expanded.push(token);
    if (ALIASES.has(token)) expanded.push(...ALIASES.get(token));
  }
  return expanded
    .map((token) => token.replace(/s$/, ""))
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function tokenSet(value) {
  return new Set(tokenize(value));
}

function loadTutorials() {
  const labelReport = fs.existsSync(LABEL_VALIDATION_PATH) ? readJson(LABEL_VALIDATION_PATH) : { validations: [] };
  const labelsByKey = new Map();
  for (const validation of labelReport.validations || []) {
    labelsByKey.set(`${validation.file}::${validation.id}`, validation);
    labelsByKey.set(validation.id, validation);
  }

  const tutorials = [];
  for (const filePath of TUTORIAL_PATHS) {
    const relative = path.relative(REPO_ROOT, filePath);
    for (const tutorial of readJson(filePath)) {
      const label = labelsByKey.get(`${relative}::${tutorial.id}`) || labelsByKey.get(tutorial.id) || {};
      const body = String(tutorial.body || "").slice(0, 9000);
      const tutorialRecord = {
        key: `${relative}::${tutorial.id}`,
        id: tutorial.id,
        file: relative,
        title: tutorial.title || tutorial.id,
        category: tutorial.category || "",
        summary: tutorial.summary || "",
        body,
        tags: tutorial.tags || [],
        sourceRepo: tutorial.sourceRepo || "",
        sourcePath: tutorial.sourcePath || "",
        track: label.track || inferTrack(tutorial),
        trackLabel: label.trackLabel || inferTrackLabel(tutorial),
        lane: label.lane || "",
        labelConfidence: label.confidence || "",
        labelEvidenceTerms: label.evidenceTerms || [],
      };
      if (tutorial.cpGovernance?.abpathRootTopic) {
        tutorialRecord.declaredCpGovernanceRoot = tutorial.cpGovernance.abpathRootTopic;
      }
      if (tutorial.cpGovernance?.abpathPrimaryPath) {
        tutorialRecord.declaredCpGovernancePrimaryPath = tutorial.cpGovernance.abpathPrimaryPath;
      }
      if (Array.isArray(tutorial.cpGovernance?.abpathAnchorSet)) {
        tutorialRecord.declaredCpGovernanceAnchorSet = tutorial.cpGovernance.abpathAnchorSet.slice();
      }
      tutorialRecord.scoringText = [
        tutorialRecord.id,
        tutorialRecord.title,
        tutorialRecord.category,
        tutorialRecord.summary,
        tutorialRecord.tags.join(" "),
        tutorialRecord.labelEvidenceTerms.join(" "),
        tutorialRecord.body,
      ].join(" ");
      tutorialRecord.scoringTokens = tokenSet(tutorialRecord.scoringText);
      tutorialRecord.titleTokens = tokenSet(`${tutorialRecord.title} ${tutorialRecord.tags.join(" ")}`);
      tutorialRecord.normalizedScoringText = normalizeText(tutorialRecord.scoringText);
      tutorialRecord.hintText = normalizeText(`${tutorialRecord.id} ${tutorialRecord.title} ${tutorialRecord.category} ${tutorialRecord.summary} ${tutorialRecord.tags.join(" ")} ${tutorialRecord.sourcePath}`);
      tutorialRecord.expectedRoots = unique([
        ...expectedRoots(tutorialRecord.hintText),
        tutorialRecord.declaredCpGovernanceRoot,
      ]);
      tutorials.push(tutorialRecord);
    }
  }
  return tutorials;
}

function inferTrack(tutorial) {
  if (tutorial.track) return tutorial.track;
  const haystack = normalizeText([
    tutorial.id,
    tutorial.title,
    tutorial.sourceRepo,
    tutorial.sourcePath,
    tutorial.category,
    (tutorial.tags || []).join(" "),
  ].join(" "));
  if (/\b(blood|coag|transfusion|chemistry|microbiology|hematology|laboratory|platelet|anemia|electrolyte|toxicology)\b/.test(haystack)) return "clinical-path";
  return "surgical-path";
}

function inferTrackLabel(tutorial) {
  if (tutorial.track === "clinical-path") return "Clinical Pathology";
  if (tutorial.track === "cross-cutting") return "Cross-Cutting";
  return inferTrack(tutorial) === "clinical-path" ? "Clinical Pathology" : "Surgical Pathology";
}

function loadApSpecNodes() {
  const topics = readJson(AP_TOPICS_PATH).filter((topic) => topic.is_valid_topic !== false);
  return topics.map((topic) => {
    const pathContext = topic.path_context || [topic.clean_title || topic.title];
    const root = DOMAIN_ROOT_HINTS.AP[topic.category_id] || pathContext[0] || "Anatomic Pathology";
    const title = topic.clean_title || topic.title;
    return makeSpecNode({
      id: `ap-${topic.category_id || "topic"}-${topic.topic_id || slugify(pathContext.join("-"))}`,
      domain: "AP",
      root,
      path: pathContext,
      title,
      difficulty: topic.difficulty || "",
      level: topic.level || pathContext.length,
      source: "ABPath Anatomic Pathology Content Specifications",
      sourceLine: topic.source_line || null,
      categoryId: topic.category_id || "",
    });
  });
}

function readCpText() {
  if (fs.existsSync(CP_TEXT_PATH)) return fs.readFileSync(CP_TEXT_PATH, "utf8");
  if (!fs.existsSync(CP_PDF_PATH)) {
    throw new Error(`Missing CP spec text and PDF. Expected ${CP_TEXT_PATH} or ${CP_PDF_PATH}`);
  }
  const tmpFile = path.join(os.tmpdir(), `abpath-cp-spec-${Date.now()}.txt`);
  childProcess.execFileSync("pdftotext", ["-layout", CP_PDF_PATH, tmpFile], { stdio: "pipe" });
  return fs.readFileSync(tmpFile, "utf8");
}

function parseCpSpecNodes() {
  const text = readCpText();
  const lines = text.split(/\r?\n/);
  const roots = [
    "Blood Banking/Transfusion Medicine",
    "Chemical Pathology",
    "Hematopathology for Clinical Pathology",
    "Medical Microbiology",
    "Management and Informatics",
  ];
  const rootSet = new Set(roots);
  const firstRootIndex = lines.findIndex((line, index) => index > 100 && line.trim() === roots[0]);
  const usefulLines = firstRootIndex >= 0 ? lines.slice(firstRootIndex) : lines;
  const nodes = [];
  let currentRoot = "";
  let currentRootSlug = "";
  const stack = [];

  for (let lineNumber = 0; lineNumber < usefulLines.length; lineNumber += 1) {
    const rawLine = usefulLines[lineNumber].replace(/\f/g, "");
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (/^American Board of Pathology\b/.test(trimmed) || /^\d+$/.test(trimmed)) continue;
    if (/^Table of Contents\b/.test(trimmed)) continue;

    if (rootSet.has(trimmed)) {
      currentRoot = trimmed;
      currentRootSlug = cpRootCode(trimmed);
      stack.length = 0;
      nodes.push(makeSpecNode({
        id: `cp-${currentRootSlug}`,
        domain: "CP",
        root: currentRoot,
        path: [currentRoot],
        title: currentRoot,
        difficulty: "",
        level: 0,
        source: "ABPath Clinical Pathology Content Specifications 04/10/2026",
        sourceLine: firstRootIndex + lineNumber + 1,
        categoryId: currentRootSlug,
      }));
      continue;
    }
    if (!currentRoot) continue;

    const parsed = parseCpSpecLine(rawLine);
    if (!parsed) continue;
    const depth = parsed.depth;
    stack[depth] = parsed.title;
    stack.length = depth + 1;
    const specPath = [currentRoot, ...stack.filter(Boolean)];
    nodes.push(makeSpecNode({
      id: `cp-${currentRootSlug}-${slugify(specPath.slice(1).join("-"))}`,
      domain: "CP",
      root: currentRoot,
      path: specPath,
      title: parsed.title,
      difficulty: parsed.difficulty,
      level: depth + 1,
      source: "ABPath Clinical Pathology Content Specifications 04/10/2026",
      sourceLine: firstRootIndex + lineNumber + 1,
      categoryId: currentRootSlug,
    }));
  }

  const deduped = new Map();
  for (const node of nodes) deduped.set(node.id, node);
  return Array.from(deduped.values());
}

function cpRootCode(root) {
  if (root === "Blood Banking/Transfusion Medicine") return "bb";
  if (root === "Chemical Pathology") return "cp";
  if (root === "Hematopathology for Clinical Pathology") return "hp";
  if (root === "Medical Microbiology") return "mb";
  if (root === "Management and Informatics") return "mi";
  return slugify(root);
}

function parseCpSpecLine(rawLine) {
  let line = rawLine.replace(/\s+/g, " ").trimEnd();
  const difficultyMatch = line.match(/\s+(C|AR|F|F\/AP)\s*$/);
  const difficulty = difficultyMatch ? difficultyMatch[1] : "";
  if (difficultyMatch) line = line.slice(0, difficultyMatch.index).trimEnd();
  line = line.trim();
  if (!line || line.length < 2) return null;
  if (/^\d+\s*$/.test(line)) return null;
  if (/\.{4,}/.test(line)) return null;

  const marker = line.match(/^((?:\d+|[a-z]|[ivxlcdm]+)\.)\s+(.+)$/i);
  if (!marker) return null;
  const symbol = marker[1].replace(".", "");
  const title = marker[2].trim();
  if (!title || /^American Board/.test(title)) return null;

  let depth = 1;
  if (/^\d+$/.test(symbol)) depth = rawLine.search(/\S/) > 12 ? 4 : 1;
  else if (/^[a-z]$/i.test(symbol)) depth = rawLine.search(/\S/) > 18 ? 5 : 2;
  else depth = rawLine.search(/\S/) > 18 ? 4 : 3;
  return { title, difficulty, depth };
}

function makeSpecNode(input) {
  const pathText = input.path.join(" ");
  const tokens = tokenSet(`${input.title} ${pathText} ${input.root}`);
  return {
    id: input.id,
    domain: input.domain,
    root: input.root,
    path: input.path,
    title: input.title,
    difficulty: input.difficulty,
    level: input.level,
    source: input.source,
    sourceLine: input.sourceLine,
    categoryId: input.categoryId,
    tokenCount: tokens.size,
    tokens,
    tokenArray: Array.from(tokens),
    normalizedPath: normalizeText(pathText),
    normalizedTitle: normalizeText(input.title),
    normalizedPathFragments: input.path.map(normalizeText).filter((part) => part.length >= 6),
  };
}

function preferredDomains(tutorial) {
  if (tutorial.track === "clinical-path") return ["CP", "AP"];
  if (tutorial.track === "surgical-path") return ["AP", "CP"];
  return ["AP", "CP"];
}

function scoreCandidate(tutorial, candidate, idf) {
  const shared = [];
  let weightedOverlap = 0;
  for (const token of candidate.tokens) {
    if (tutorial.scoringTokens.has(token)) {
      shared.push(token);
      weightedOverlap += idf.get(token) || 1;
    }
  }
  const effectiveCandidateWeight = candidate.idfWeight || candidate.tokenArray.reduce((sum, token) => sum + (idf.get(token) || 1), 0);
  let score = effectiveCandidateWeight ? weightedOverlap / effectiveCandidateWeight : 0;

  if (candidate.normalizedTitle && tutorial.normalizedScoringText.includes(candidate.normalizedTitle)) score += 0.25;
  const matchedPathParts = candidate.normalizedPathFragments.filter((part) => tutorial.normalizedScoringText.includes(part)).length;
  score += Math.min(0.24, matchedPathParts * 0.06);

  const titleShared = shared.filter((token) => tutorial.titleTokens.has(token)).length;
  score += Math.min(0.2, titleShared * 0.025);
  score += domainBoost(tutorial, candidate);
  score += rootBoost(tutorial, candidate);
  score += expectedRootAdjustment(tutorial, candidate);

  return {
    score: Number(score.toFixed(4)),
    sharedTokens: shared.slice(0, 14),
  };
}

function domainBoost(tutorial, candidate) {
  const order = preferredDomains(tutorial);
  if (order[0] === candidate.domain) return 0.16;
  if (tutorial.track === "cross-cutting") return 0.08;
  return -0.04;
}

function rootBoost(tutorial, candidate) {
  const hints = {
    Breast: ["breast", "ductal", "lobular", "dcis", "lcis"],
    Cardiovascular: ["heart", "cardiac", "vascular", "vasculitis", "atherosclerosis"],
    Cytopathology: ["cyto", "pap", "effusion", "aspiration"],
    Dermatopathology: ["skin", "derm", "melanoma", "nevus", "cutaneous"],
    Endocrine: ["thyroid", "parathyroid", "adrenal", "pituitary", "endocrine"],
    "Forensic Pathology": ["forensic", "autopsy", "injury", "death"],
    Gastrointestinal: ["gi", "colon", "stomach", "liver", "pancreas", "biliary", "esophagus"],
    Genitourinary: ["kidney", "renal", "bladder", "prostate", "testis", "urothelial"],
    "Head and Neck": ["salivary", "oral", "head", "neck", "larynx"],
    "Male Reproductive": ["prostate", "testis", "penile", "male"],
    Neuropathology: ["brain", "neuro", "glial", "meningioma"],
    "Pediatric Pathology": ["pediatric", "child", "neonatal", "congenital"],
    "Placental Pathology": ["placenta", "placental", "pregnancy"],
    Pulmonary: ["lung", "pulmonary", "pleura", "respiratory"],
    "Bone and Soft Tissue": ["bone", "soft", "sarcoma", "cartilage", "osteosarcoma"],
    "Blood Banking/Transfusion Medicine": ["blood", "transfusion", "coagulation", "platelet", "hemolytic", "hemostasis"],
    "Chemical Pathology": ["chemistry", "electrolyte", "toxicology", "enzyme", "endocrine", "protein"],
    "Hematopathology for Clinical Pathology": ["hematology", "leukemia", "lymphoma", "anemia", "myeloid", "lymphoid"],
    "Medical Microbiology": ["microbiology", "bacteria", "virus", "fungi", "parasite", "infection"],
    "Management and Informatics": ["informatics", "quality", "safety", "finance", "billing", "ethics", "management"],
  };
  return (hints[candidate.root] || []).some((hint) => tutorial.hintText.includes(hint)) ? 0.12 : 0;
}

function expectedRootAdjustment(tutorial, candidate) {
  const expected = tutorial.expectedRoots || [];
  if (!expected.length) return 0;
  if (expected.includes(candidate.root)) return 0.46;
  if (candidate.domain === "AP" && expected.some((root) => root in AP_ROOT_INDEX)) return -0.16;
  if (candidate.domain === "CP" && expected.some((root) => root in CP_ROOT_INDEX)) return -0.1;
  return 0;
}

function rootDomainIndex(domain) {
  const roots = domain === "AP" ? Object.values(DOMAIN_ROOT_HINTS.AP) : Object.values(DOMAIN_ROOT_HINTS.CP);
  return Object.fromEntries(roots.map((root) => [root, true]));
}

function expectedRoots(haystack) {
  const rules = [
    [/(\blung\b|\bpulmonary\b|\bpleura\b|\bmediastinum\b|\brespiratory\b)/, "Pulmonary"],
    [/(\bbreast\b|\bductal\b|\blobular\b|\bdcis\b|\blcis\b|\badh\b|\balh\b)/, "Breast"],
    [/(\bcolon\b|\bcolorectal\b|\bstomach\b|\bgastric\b|\besophagus\b|\bliver\b|\bpancrea|\bbiliary\b|\bgi\b)/, "Gastrointestinal"],
    [/(\brenal\b|\bkidney\b|\bbladder\b|\burothelial\b|\bprostate\b|\btestis\b|\bgu\b)/, "Genitourinary"],
    [/(\bprostate\b|\btestis\b|\bpenile\b|\bmale\b)/, "Male Reproductive"],
    [/(\bbrain\b|\bglial\b|\bmeningioma\b|\bneuro\b)/, "Neuropathology"],
    [/(\bskin\b|\bderm|\bmelanoma\b|\bnevus\b|\bcutaneous\b)/, "Dermatopathology"],
    [/(\bthyroid\b|\bparathyroid\b|\badrenal\b|\bpituitary\b|\bendocrine\b)/, "Endocrine"],
    [/(\bheart\b|\bcardiac\b|\bvascular\b|\bvasculitis\b)/, "Cardiovascular"],
    [/(\bbone\b|\bsoft\b|\bsarcoma\b|\bosteosarcoma\b|\bchondrosarcoma\b)/, "Bone and Soft Tissue"],
    [/(\bplacenta\b|\bplacental\b|\bpregnancy\b)/, "Placental Pathology"],
    [/(\bchild\b|\bpediatric\b|\bneonatal\b|\bcongenital\b)/, "Pediatric Pathology"],
    [/(\btransfusion\b|\bcoagulation\b|\bhemostasis\b|\bplatelet\b|\bwarfarin\b|\bpt\b|\baptt\b|\bhemolytic\b|\bblood banking\b)/, "Blood Banking/Transfusion Medicine"],
    [/(\bchemistry\b|\bclinical chemistry\b|\belectrolyte\b|\btoxicology\b|\benzyme\b|\bprotein electrophoresis\b|\btherapeutic drug\b|\bendocrine\b|\bmetabolic\b|\blipid\b|\bquality control\b|\bqc\b|\blinearity\b|\bcarryover\b|\bamr\b)/, "Chemical Pathology"],
    [/(\bleukemia\b|\blymphoma\b|\bmyeloid\b|\blymphoid\b|\bplasma cell\b|\bhematology\b|\bhematopathology\b|\blaboratory hematology\b|\bflow cytometry\b|\bbone marrow\b|\bperipheral blood\b|\banemia\b|\bhemolysis\b)/, "Hematopathology for Clinical Pathology"],
    [/(\bbacteria\b|\bvirus\b|\bfungi\b|\bparasite\b|\bmicrobiology\b|\bmycobacter\b|\bbacteriology\b|\bmycology\b|\bvirology\b|\bparasitology\b|\bast\b|\bmaldi\b|\bculture\b)/, "Medical Microbiology"],
    [/(\binformatics\b|\bquality\b|\bsafety\b|\bbilling\b|\bethics\b|\bfinance\b)/, "Management and Informatics"],
  ];
  return unique(rules.filter(([pattern]) => pattern.test(haystack)).map(([, root]) => root));
}

function buildIdf(specNodes) {
  const docFreq = new Map();
  for (const node of specNodes) {
    for (const token of node.tokens) docFreq.set(token, (docFreq.get(token) || 0) + 1);
  }
  const total = specNodes.length || 1;
  const idf = new Map();
  for (const [token, count] of docFreq.entries()) {
    idf.set(token, 1 + Math.log(total / (1 + count)));
  }
  return idf;
}

function confidenceFor(score) {
  if (score >= 0.58) return "high";
  if (score >= 0.34) return "medium";
  return "low";
}

function normalizeSpecPath(value) {
  return normalizeText(String(value || "").replace(/\s*>\s*/g, " "));
}

function findGovernedSpecMatches(tutorial, specNodes) {
  const results = [];
  const seen = new Set();
  const primaryPath = normalizeSpecPath(tutorial.declaredCpGovernancePrimaryPath);
  const anchorPaths = unique(tutorial.declaredCpGovernanceAnchorSet || []).map(normalizeSpecPath);
  const desiredPaths = unique([primaryPath, ...anchorPaths]).filter(Boolean);

  for (const desiredPath of desiredPaths) {
    const node = specNodes.find((candidate) => candidate.domain === "CP" && candidate.normalizedPath === desiredPath);
    if (!node || seen.has(node.id)) continue;
    seen.add(node.id);
    const evidenceTerms = node.tokenArray.filter((token) => tutorial.scoringTokens.has(token)).slice(0, 14);
    results.push({
      node,
      score: desiredPath === primaryPath ? 1 : 0.96,
      sharedTokens: evidenceTerms,
      governed: true,
    });
  }

  return results;
}

function mapTutorials(tutorials, specNodes) {
  const idf = buildIdf(specNodes);
  for (const node of specNodes) {
    node.idfWeight = node.tokenArray.reduce((sum, token) => sum + (idf.get(token) || 1), 0);
  }
  const nodeById = new Map(specNodes.map((node) => [node.id, node]));
  const nodesByToken = new Map();
  for (const node of specNodes) {
    for (const token of node.tokens) {
      const bucket = nodesByToken.get(token) || [];
      bucket.push(node.id);
      nodesByToken.set(token, bucket);
    }
  }
  return tutorials.map((tutorial) => {
    const domains = preferredDomains(tutorial);
    const candidateScores = new Map();
    for (const token of tutorial.scoringTokens) {
      const weight = idf.get(token) || 1;
      for (const nodeId of nodesByToken.get(token) || []) {
        candidateScores.set(nodeId, (candidateScores.get(nodeId) || 0) + weight);
      }
    }
    const candidateNodes = Array.from(candidateScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 900)
      .map(([nodeId]) => nodeById.get(nodeId))
      .filter(Boolean);
    const domainCandidateNodes = candidateNodes.length ? candidateNodes : specNodes;
    const scored = domainCandidateNodes
      .filter((node) => domains.includes(node.domain))
      .map((node) => {
        const result = scoreCandidate(tutorial, node, idf);
        return { node, ...result };
      })
      .filter((candidate) => candidate.score > 0.08 || candidate.sharedTokens.length >= 2)
      .sort((a, b) => b.score - a.score);
    const governedMatches = findGovernedSpecMatches(tutorial, specNodes);
    const governedIds = new Set(governedMatches.map((candidate) => candidate.node.id));
    const mergedScored = [
      ...governedMatches,
      ...scored.filter((candidate) => !governedIds.has(candidate.node.id)),
    ];
    const primary = mergedScored[0] || { node: specNodes[0], score: 0, sharedTokens: [] };
    const alternates = mergedScored
      .slice(1)
      .filter((candidate) => candidate.node.domain !== primary.node.domain || candidate.score >= primary.score * 0.72)
      .slice(0, 5);
    const mappings = [primary, ...alternates].slice(0, 6).map((candidate, index) => ({
      rank: index + 1,
      specId: candidate.node.id,
      domain: candidate.node.domain,
      root: candidate.node.root,
      path: candidate.node.path,
      title: candidate.node.title,
      difficulty: candidate.node.difficulty,
      level: candidate.node.level,
      score: candidate.score,
      confidence: confidenceFor(candidate.score),
      evidenceTerms: candidate.sharedTokens,
      sourceLine: candidate.node.sourceLine,
    }));
    return {
      tutorial: {
        key: tutorial.key,
        id: tutorial.id,
        file: tutorial.file,
        title: tutorial.title,
        sourceRepo: tutorial.sourceRepo,
        sourcePath: tutorial.sourcePath,
        track: tutorial.track,
        trackLabel: tutorial.trackLabel,
        lane: tutorial.lane,
      },
      primaryMapping: mappings[0],
      alternateMappings: mappings.slice(1),
      status: mappings[0].confidence === "low" ? "mapped-review" : "mapped",
    };
  });
}

function buildCoverage(crosswalk, specNodes) {
  const covered = new Map();
  for (const item of crosswalk) {
    for (const mapping of [item.primaryMapping, ...item.alternateMappings]) {
      if (!mapping) continue;
      const value = covered.get(mapping.specId) || { count: 0, tutorials: [] };
      value.count += mapping.rank === 1 ? 1 : 0.25;
      if (mapping.rank === 1) value.tutorials.push(item.tutorial.id);
      covered.set(mapping.specId, value);
    }
  }

  const byRoot = {};
  for (const node of specNodes) {
    const rootKey = `${node.domain}:${node.root}`;
    if (!byRoot[rootKey]) {
      byRoot[rootKey] = { domain: node.domain, root: node.root, specNodeCount: 0, coveredNodeCount: 0, primaryTutorialCount: 0 };
    }
    byRoot[rootKey].specNodeCount += 1;
    const coverage = covered.get(node.id);
    if (coverage) {
      byRoot[rootKey].coveredNodeCount += 1;
      byRoot[rootKey].primaryTutorialCount += coverage.tutorials.length;
    }
  }
  return {
    byRoot: Object.values(byRoot).sort((a, b) => a.domain.localeCompare(b.domain) || a.root.localeCompare(b.root)),
    weakMappings: crosswalk.filter((item) => item.status === "mapped-review").map((item) => ({
      id: item.tutorial.id,
      title: item.tutorial.title,
      trackLabel: item.tutorial.trackLabel,
      primary: item.primaryMapping,
    })),
    uncoveredRepresentativeNodes: specNodes
      .filter((node) => !covered.has(node.id) && node.level <= 2)
      .slice(0, 250)
      .map((node) => ({ id: node.id, domain: node.domain, root: node.root, path: node.path, difficulty: node.difficulty })),
  };
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join(" > ") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeOutputs({ tutorials, specNodes, crosswalk, coverage }) {
  const metadata = {
    version: 1,
    generatedAt: new Date().toISOString(),
    rule: "Tutorials are scored against ABPath AP and CP content specification topic/subtopic nodes using track-aware token, phrase, root, and acronym evidence. Every tutorial must have at least one primary mapping.",
    sources: {
      ap: path.relative(REPO_ROOT, AP_TOPICS_PATH),
      cp: CP_PDF_PATH,
      cpExtractedText: fs.existsSync(CP_TEXT_PATH) ? path.relative(REPO_ROOT, CP_TEXT_PATH) : "generated at runtime with pdftotext",
      tutorials: TUTORIAL_PATHS.map((filePath) => path.relative(REPO_ROOT, filePath)),
      labels: path.relative(REPO_ROOT, LABEL_VALIDATION_PATH),
    },
    counts: {
      tutorials: tutorials.length,
      specNodes: specNodes.length,
      apSpecNodes: specNodes.filter((node) => node.domain === "AP").length,
      cpSpecNodes: specNodes.filter((node) => node.domain === "CP").length,
      mapped: crosswalk.filter((item) => item.status === "mapped").length,
      review: crosswalk.filter((item) => item.status === "mapped-review").length,
    },
  };

  ensureDir(OUT_JSON);
  fs.writeFileSync(OUT_JSON, JSON.stringify({ ...metadata, crosswalk }, null, 2) + "\n");
  fs.writeFileSync(OUT_COVERAGE, JSON.stringify({ ...metadata, coverage }, null, 2) + "\n");

  const rows = [["tutorial_id", "tutorial_title", "file", "track", "rank", "domain", "root", "spec_path", "difficulty", "score", "confidence", "evidence_terms", "source_line"]];
  for (const item of crosswalk) {
    for (const mapping of [item.primaryMapping, ...item.alternateMappings]) {
      rows.push([
        item.tutorial.id,
        item.tutorial.title,
        item.tutorial.file,
        item.tutorial.trackLabel,
        mapping.rank,
        mapping.domain,
        mapping.root,
        mapping.path,
        mapping.difficulty,
        mapping.score,
        mapping.confidence,
        mapping.evidenceTerms.join("; "),
        mapping.sourceLine || "",
      ]);
    }
  }
  fs.writeFileSync(OUT_CSV, rows.map((row) => row.map(csvEscape).join(",")).join("\n") + "\n");

  const domainRows = coverage.byRoot.map((row) => `| ${row.domain} | ${row.root} | ${row.specNodeCount} | ${row.coveredNodeCount} | ${row.primaryTutorialCount} |`).join("\n");
  const weakRows = coverage.weakMappings.length
    ? coverage.weakMappings.slice(0, 40).map((item) => `| ${item.id} | ${item.title} | ${item.trackLabel} | ${item.primary.domain} > ${item.primary.path.join(" > ")} | ${item.primary.score} |`).join("\n")
    : "| None | - | - | - | - |";
  const md = `# Tutorial to ABPath Content Specification Crosswalk

Generated: ${metadata.generatedAt}

This report maps every normalized tutorial to AP and CP ABPath content specification topics and subtopics using deterministic, track-aware evidence. Primary mappings are intended for routing and coverage review; alternates are retained when they are plausible enough to support cross-domain or adjacent-topic teaching use.

## Counts

- Tutorials mapped: ${metadata.counts.tutorials}
- Specification nodes: ${metadata.counts.specNodes} (${metadata.counts.apSpecNodes} AP, ${metadata.counts.cpSpecNodes} CP)
- Strong or medium primary mappings: ${metadata.counts.mapped}
- Low-confidence review mappings: ${metadata.counts.review}

## Coverage by ABPath Root

| Domain | Root topic | Spec nodes | Nodes with tutorial coverage | Primary tutorial mappings |
| --- | --- | ---: | ---: | ---: |
${domainRows}

## Review Queue

| Tutorial ID | Title | Track | Primary mapping | Score |
| --- | --- | --- | --- | ---: |
${weakRows}

## Acceptance Criteria

- Every tutorial has one primary ABPath AP or CP topic/subtopic mapping.
- Every mapping contains domain, root topic, full path, ABPath difficulty level when available, score, confidence, and evidence terms.
- CP mappings are derived from the current ABPath Clinical Pathology content specification text; AP mappings are derived from the normalized ABPath Anatomic Pathology topic table.
- Low-confidence mappings remain visible in the review queue rather than being silently treated as definitive.
`;
  fs.writeFileSync(OUT_REPORT, md);
}

function validate(crosswalk, specNodes) {
  const specIds = new Set(specNodes.map((node) => node.id));
  const failures = [];
  for (const item of crosswalk) {
    if (!item.primaryMapping) failures.push(`${item.tutorial.id}: missing primary mapping`);
    if (item.primaryMapping && !specIds.has(item.primaryMapping.specId)) failures.push(`${item.tutorial.id}: invalid spec id ${item.primaryMapping.specId}`);
    if (item.primaryMapping && !item.primaryMapping.domain) failures.push(`${item.tutorial.id}: missing domain`);
    if (item.primaryMapping && !item.primaryMapping.path?.length) failures.push(`${item.tutorial.id}: missing path`);
  }
  if (failures.length) {
    console.error(failures.slice(0, 20).join("\n"));
    throw new Error(`ABPath tutorial crosswalk validation failed with ${failures.length} issue(s).`);
  }
}

function main() {
  const tutorials = loadTutorials();
  const specNodes = [...loadApSpecNodes(), ...parseCpSpecNodes()];
  const crosswalk = mapTutorials(tutorials, specNodes);
  validate(crosswalk, specNodes);
  const coverage = buildCoverage(crosswalk, specNodes);
  writeOutputs({ tutorials, specNodes, crosswalk, coverage });
  const reviewCount = crosswalk.filter((item) => item.status === "mapped-review").length;
  console.log(`Mapped ${tutorials.length} tutorials to ${specNodes.length} ABPath spec nodes.`);
  console.log(`Review queue: ${reviewCount}`);
  console.log(`Wrote ${path.relative(REPO_ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(REPO_ROOT, OUT_REPORT)}`);
  console.log(`Wrote ${path.relative(REPO_ROOT, OUT_CSV)}`);
  console.log(`Wrote ${path.relative(REPO_ROOT, OUT_COVERAGE)}`);
}

main();
