
// ===============================
// 1) TYPES — upgraded, UI-wirable
// ===============================

export interface LectureSlide {
  type: "intro" | "anatomy" | "network" | "algorithm" | "summary";
  title: string;
  content: string; // Markdown supported
  config?: {
    system?: string; // For Anatomy
    nodeId?: string; // For Galaxy focus
    algorithmId?: string; // For Algorithm
    startNodeId?: string; // Optional start node for algorithm
    highlightGroup?: string; // For Galaxy filtering

    // ✅ NEW: Bind structured content to slide renderers
    entityRefs?: string[]; // Drives DxEntityCard panel(s)
    showPrognosisPanel?: boolean; // UI toggle
    showPitfallPanel?: boolean; // UI toggle
  };
}

export interface Lecture {
  id: string;
  title: string;
  category: string;
  description: string;
  slides: LectureSlide[];

  // ✅ NEW: Local “knowledge pack” for this lecture
  entityCards?: DxEntityCard[];

  // ✅ NEW: Full text transcript for accessibility/audio
  transcript?: string;
}

export type PrognosisTier =
  | "Benign/Indolent"
  | "Generally Favorable"
  | "Intermediate/Variable"
  | "Aggressive"
  | "Highly Aggressive"
  | "Contextual";

export interface DxPearl {
  type: "pitfall" | "discriminator" | "workflow" | "reporting";
  text: string; // markdown ok
}

export interface PrognosticDriver {
  name: string; // e.g., "Stage", "WHO/ISUP grade", "Sarcomatoid change", "i(12p)"
  effect: "favorable" | "unfavorable" | "contextual";
  notes?: string;
}

export interface DxEntityCard {
  entityId: string; // must match your graph node label
  summary: string;

  keyMorphology: string[];
  keyIHC: {
    positive: string[];
    negative?: string[];
    patterns?: string[]; // e.g., "CA9 box", "CA9 cup", "CK7 diffuse"
  };
  keyMolecular?: string[];

  criticalDifferential: string[]; // entityIds
  pearls: DxPearl[];

  prognosis: {
    tier: PrognosisTier;
    drivers: PrognosticDriver[];
    counseling: string[]; // high-level clinical meaning
  };

  managementImplications: string[]; // high-level, not prescriptive
}

// ===================================
// 2) ENTITY CARDS — Renal Mass lecture
// ===================================

const RENAL_ENTITY_CARDS: DxEntityCard[] = [
  {
    entityId: "Clear Cell RCC",
    summary:
      "VHL/HIF-driven renal carcinoma with classic clear cells + delicate vasculature; prognosis dominated by stage, grade, necrosis, and sarcomatoid/rhabdoid change.",
    keyMorphology: [
      "Nests/alveoli/sheets of optically clear cells (lipid/glycogen)",
      "Delicate ‘chicken-wire’ capillary network",
      "Look-for: tumor necrosis; venous invasion; sarcomatoid/rhabdoid foci; infiltrative edges"
    ],
    keyIHC: {
      positive: ["PAX8", "CA9", "CD10", "Vimentin"],
      negative: ["CK7 (usually negative or patchy)"],
      patterns: ["CA9 diffuse membranous ‘box’ pattern"]
    },
    keyMolecular: ["3p loss; VHL alteration (core pathway)"],
    criticalDifferential: ["Clear Cell Papillary", "Translocation RCC", "Papillary RCC"],
    pearls: [
      {
        type: "discriminator",
        text:
          "**CA9 ‘box’ vs ‘cup’ saves patients.** Box → favors CCRCC; Cup (basolateral) → favors Clear Cell Papillary."
      },
      {
        type: "workflow",
        text:
          "If **young age**, papillary architecture, psammoma bodies, or atypical IHC pattern → **add MiT family (TFE3/TFEB) workup** and consider confirmatory testing."
      },
      {
        type: "reporting",
        text:
          "Always comment on **necrosis**, **sarcomatoid/rhabdoid differentiation**, and **vascular invasion**, because these materially shift risk."
      },
      {
        type: "pitfall",
        text:
          "Avoid reflexively calling every clear tumor ‘CCRCC’—misclassifying an indolent mimic can drive overtreatment."
      }
    ],
    prognosis: {
      tier: "Intermediate/Variable",
      drivers: [
        { name: "Pathologic stage (pT/pN)", effect: "unfavorable", notes: "Strongest overall driver of outcome." },
        { name: "WHO/ISUP grade", effect: "unfavorable", notes: "Grade 4 features are high-risk regardless of ‘average’ grade." },
        { name: "Tumor necrosis", effect: "unfavorable" },
        { name: "Sarcomatoid/rhabdoid differentiation", effect: "unfavorable" },
        { name: "Venous invasion", effect: "unfavorable" }
      ],
      counseling: [
        "Risk ranges from indolent (low stage/grade) to highly aggressive (advanced stage or grade 4 features).",
        "Accurate subtyping prevents both under- and overtreatment."
      ]
    },
    managementImplications: [
      "Overcalling indolent mimics → unnecessary aggressive surveillance/surgery decisions.",
      "Missing sarcomatoid/rhabdoid/venous invasion → underestimation of relapse risk."
    ]
  },
  {
    entityId: "Clear Cell Papillary",
    summary:
      "Indolent clear cell renal tumor with CK7-diffuse and CA9 ‘cup’ pattern; key harm is overtreatment if miscalled as CCRCC.",
    keyMorphology: [
      "Bland clear cells; often tubulopapillary architecture",
      "Subnuclear vacuolization (‘piano-key’ nuclear alignment)",
      "Typically lacks destructive invasion/necrosis in classic cases"
    ],
    keyIHC: {
      positive: ["PAX8", "CK7"],
      patterns: ["CA9 ‘cup’ (basolateral) pattern", "CK7 diffuse strong"]
    },
    keyMolecular: ["Not VHL/3p-driven in classic pattern (avoid assuming CCRCC biology)."],
    criticalDifferential: ["Clear Cell RCC", "Papillary RCC", "Translocation RCC"],
    pearls: [
      { type: "discriminator", text: "**CK7 diffuse + CA9 cup** is the signature pattern." },
      { type: "pitfall", text: "Calling this CCRCC is a classic source of **overtreatment and over-surveillance**." },
      { type: "workflow", text: "If CA9 looks diffuse ‘boxy’ or morphology is atypical → re-cut, re-review, and widen the panel." }
    ],
    prognosis: {
      tier: "Benign/Indolent",
      drivers: [
        { name: "Correct classification", effect: "contextual", notes: "Main risk is diagnostic error, not biology." }
      ],
      counseling: [
        "Behavior is typically indolent; correct naming reduces unnecessary anxiety and follow-up intensity."
      ]
    },
    managementImplications: ["Primary harm is overtreatment if misclassified as CCRCC."]
  },
  {
    entityId: "Chromophobe RCC",
    summary:
      "Eosinophilic/pale renal carcinoma with plant-like borders and perinuclear halos; generally favorable but worsens with advanced stage or sarcomatoid change.",
    keyMorphology: [
      "Plant-like cell borders; perinuclear halos",
      "Raisinoid nuclei; pale to eosinophilic cytoplasm",
      "Solid/trabecular growth; evaluate necrosis and sarcomatoid change"
    ],
    keyIHC: {
      positive: ["CK7 (diffuse)", "CD117"],
      patterns: ["CK7 diffuse strong favors chromophobe over oncocytoma"]
    },
    keyMolecular: ["Multiple chromosomal losses (conceptual)"],
    criticalDifferential: ["Oncocytoma", "Clear Cell RCC"],
    pearls: [
      { type: "discriminator", text: "**CK7 diffuse** is a major splitter from oncocytoma (CK7 negative/scattered)." },
      { type: "reporting", text: "Chromophobe RCC is generally **not WHO/ISUP graded**; emphasize stage + adverse features." },
      { type: "pitfall", text: "Eosinophilic chromophobe can mimic oncocytoma—avoid single-marker diagnosis." }
    ],
    prognosis: {
      tier: "Generally Favorable",
      drivers: [
        { name: "Pathologic stage", effect: "unfavorable" },
        { name: "Sarcomatoid transformation", effect: "unfavorable" },
        { name: "Tumor necrosis", effect: "unfavorable" }
      ],
      counseling: [
        "Often better prognosis than CCRCC at comparable stage, but adverse histology and stage escalation meaningfully worsen risk."
      ]
    },
    managementImplications: ["Correct separation from oncocytoma prevents unnecessary ‘malignancy’ labeling, while correct malignant diagnosis ensures appropriate staging follow-up."]
  },
  {
    entityId: "Oncocytoma",
    summary:
      "Benign renal oncocytic neoplasm; core goal is avoiding overcall as chromophobe RCC or other eosinophilic malignancy.",
    keyMorphology: [
      "Nested/solid oncocytic cells with abundant granular eosinophilic cytoplasm",
      "Round nuclei; degenerative atypia can occur (don’t over-interpret)",
      "Often central scar grossly (not required)"
    ],
    keyIHC: {
      positive: ["CD117 (often)"],
      negative: ["CK7 (negative or scattered)"],
      patterns: ["CK7 scattered single cells (classic)"]
    },
    criticalDifferential: ["Chromophobe RCC"],
    pearls: [
      { type: "discriminator", text: "**CK7 scattered** + classic morphology supports oncocytoma; **CK7 diffuse** pushes chromophobe." },
      { type: "pitfall", text: "Degenerative atypia can look alarming—anchor to architecture + CK7 pattern." },
      { type: "workflow", text: "If hybrid features exist, document uncertainty and integrate with imaging/gross (multifocality, bilateral disease, syndromic context)." }
    ],
    prognosis: {
      tier: "Benign/Indolent",
      drivers: [{ name: "Diagnostic accuracy", effect: "contextual" }],
      counseling: ["Classic oncocytoma behaves benignly; the dominant ‘risk’ is misclassification."]
    },
    managementImplications: ["Avoiding an erroneous malignant label reduces overtreatment and intensive surveillance."]
  },
  {
    entityId: "Papillary RCC",
    summary:
      "Papillary renal carcinoma spectrum; prognosis varies—avoid confusing papillary architecture in CCRCC or MiT tumors as true papillary RCC.",
    keyMorphology: [
      "Papillae with fibrovascular cores; often foamy macrophages",
      "May show psammoma bodies (not exclusive)",
      "Evaluate grade, necrosis, and invasive pattern"
    ],
    keyIHC: {
      positive: ["PAX8", "CK7 (often)", "AMACR (often)"],
      patterns: ["CA9 usually not diffuse ‘box’ (if it is, reconsider CCRCC)"]
    },
    keyMolecular: ["Commonly associated with chromosomal gains (conceptual); MET alterations in subsets."],
    criticalDifferential: ["Clear Cell RCC", "Translocation RCC", "Clear Cell Papillary"],
    pearls: [
      { type: "workflow", text: "If papillary architecture + clear cells + odd IHC → broaden differential (CCRCC papillary areas, MiT RCC)." },
      { type: "reporting", text: "Report **grade (WHO/ISUP applies)** and adverse features; quantify necrosis if present." }
    ],
    prognosis: {
      tier: "Intermediate/Variable",
      drivers: [
        { name: "Stage", effect: "unfavorable" },
        { name: "WHO/ISUP grade", effect: "unfavorable" },
        { name: "Necrosis", effect: "unfavorable" }
      ],
      counseling: ["Outcomes vary widely; correct entity assignment prevents inappropriate risk assumptions."]
    },
    managementImplications: ["Correct subtyping and grading informs surveillance intensity and systemic risk framing."]
  },
  {
    entityId: "Translocation RCC",
    summary:
      "MiT family RCC (TFE3/TFEB) often mimics clear cell and papillary tumors; behavior variable—classification impacts risk and eligibility for targeted approaches/trials.",
    keyMorphology: [
      "Clear and/or eosinophilic cells; often papillary architecture",
      "Psammoma bodies may be present",
      "May show high-grade cytology in discordance with architecture"
    ],
    keyIHC: {
      positive: ["PAX8"],
      patterns: ["TFE3/TFEB supportive but requires correlation/confirmation"]
    },
    keyMolecular: ["TFE3 or TFEB rearrangements (confirmatory testing often required)."],
    criticalDifferential: ["Clear Cell RCC", "Papillary RCC", "Clear Cell Papillary"],
    pearls: [
      { type: "workflow", text: "When suspicion is high, **confirm with appropriate molecular methods** rather than relying on morphology alone." },
      { type: "pitfall", text: "Do not ‘force’ into CCRCC or papillary RCC when clinical age/pattern is discordant." }
    ],
    prognosis: {
      tier: "Intermediate/Variable",
      drivers: [
        { name: "Subtype (TFE3 vs TFEB) + stage", effect: "contextual" },
        { name: "Grade/cytologic aggressiveness", effect: "unfavorable" }
      ],
      counseling: ["Some behave indolently; others aggressive—correct labeling changes how clinicians frame risk."]
    },
    managementImplications: ["Correct classification avoids false reassurance or unnecessary escalation; supports appropriate additional testing."]
  },
  {
    entityId: "Collecting Duct Carcinoma",
    summary:
      "High-grade medullary-based carcinoma with desmoplasia and infiltrative growth; typically aggressive with poor prognosis.",
    keyMorphology: [
      "Infiltrative duct-like/tubulopapillary carcinoma",
      "Prominent desmoplastic stroma",
      "High-grade cytology; necrosis common"
    ],
    keyIHC: { positive: ["PAX8 (often)"], patterns: ["Broad high-grade carcinoma immunoprofile; integrate with location + morphology"] },
    criticalDifferential: ["Renal Medullary Carcinoma", "Urothelial Carcinoma"],
    pearls: [
      { type: "workflow", text: "Anchor diagnosis to **medullary location + infiltrative desmoplasia + high-grade cytology**; exclude urothelial carcinoma when pelvis involvement is suspected." },
      { type: "reporting", text: "Emphasize aggressive biology; document extent and invasion." }
    ],
    prognosis: {
      tier: "Highly Aggressive",
      drivers: [{ name: "Advanced stage at presentation", effect: "unfavorable" }],
      counseling: ["Usually aggressive with high metastatic potential; classification is a red-alert communication."]
    },
    managementImplications: ["Correct identification drives urgent staging/oncology involvement and avoids under-treatment."]
  },
  {
    entityId: "Renal Medullary Carcinoma",
    summary:
      "Sickle cell trait–associated, highly aggressive medullary carcinoma; diagnosis is a clinical-pathologic emergency signal.",
    keyMorphology: [
      "Medullary-centered infiltrative high-grade carcinoma",
      "Rhabdoid/sarcomatoid-like areas can occur",
      "Necrosis and hemorrhage may be prominent"
    ],
    keyIHC: { positive: ["PAX8 (often)"], patterns: ["Integrate with clinical context (sickle trait)"] },
    criticalDifferential: ["Collecting Duct Carcinoma"],
    pearls: [
      { type: "discriminator", text: "**Clinical correlation is mandatory:** ask/confirm **sickle cell trait/disease** context when suspected." },
      { type: "reporting", text: "Use urgent, explicit language about aggressiveness and recommend prompt clinical correlation and staging workup." }
    ],
    prognosis: {
      tier: "Highly Aggressive",
      drivers: [{ name: "Intrinsic tumor biology + stage", effect: "unfavorable" }],
      counseling: ["Extremely aggressive course; correct naming changes urgency and patient counseling."]
    },
    managementImplications: ["Avoids mislabeling as generic RCC and prevents dangerous underestimation of risk."]
  }
];

// ===================================
// 3) ENTITY CARDS — Testis Mass lecture
// ===================================

const TESTIS_ENTITY_CARDS: DxEntityCard[] = [
  {
    entityId: "Seminoma",
    summary:
      "Most common pure GCT with excellent prognosis; key harm is missing a non-seminomatous component and undertreating.",
    keyMorphology: [
      "Sheets/nests of large uniform cells with clear cytoplasm (‘fried egg’)",
      "Fibrous septa with lymphocytes",
      "Granulomas may be present (pitfall)"
    ],
    keyIHC: {
      positive: ["OCT4", "SALL4", "CD117", "PLAP", "D2-40"],
      negative: ["CD30 (typically)", "Cytokeratin (usually negative or focal dot-like)"]
    },
    keyMolecular: ["i(12p)/12p amplification in postpubertal malignant pathway"],
    criticalDifferential: ["Embryonal Carcinoma", "Spermatocytic Tumor"],
    pearls: [
      { type: "discriminator", text: "**CD117+ / CD30−** is the classic split from embryonal carcinoma." },
      { type: "pitfall", text: "Do not call ‘pure seminoma’ if any area looks ‘ugly’—sample heavily and hunt for mixed components." },
      { type: "reporting", text: "If mixed tumor: **quantify components**; this affects risk and therapy planning." }
    ],
    prognosis: {
      tier: "Generally Favorable",
      drivers: [
        { name: "Stage", effect: "unfavorable" },
        { name: "Presence of NSGCT components", effect: "unfavorable", notes: "Mixed histology alters management." }
      ],
      counseling: ["Often curable; accurate classification prevents undertreatment of mixed/NSGCT tumors."]
    },
    managementImplications: ["Misclassifying mixed tumor as seminoma can change chemo/surgery decisions."]
  },
  {
    entityId: "GCNIS",
    summary:
      "In-situ precursor for most postpubertal GCTs; indicates field effect and contralateral risk context.",
    keyMorphology: [
      "Atypical germ cells along basement membrane within seminiferous tubules",
      "Often decreased/absent spermatogenesis in involved tubules"
    ],
    keyIHC: { positive: ["OCT4", "CD117", "PLAP"] },
    keyMolecular: ["Associated with postpubertal malignant GCT pathway"],
    criticalDifferential: ["Seminoma"],
    pearls: [
      { type: "workflow", text: "Documenting GCNIS supports postpubertal pathway and informs contralateral surveillance considerations." }
    ],
    prognosis: {
      tier: "Contextual",
      drivers: [{ name: "Presence indicates malignant pathway", effect: "contextual" }],
      counseling: ["Not a metastatic lesion itself, but prognostically meaningful as a precursor and risk marker."]
    },
    managementImplications: ["Improves clinical understanding of pathway and future risk framing."]
  },
  {
    entityId: "Embryonal Carcinoma",
    summary:
      "Aggressive NSGCT component; high-grade cytology and necrosis; missing it is a common high-stakes error.",
    keyMorphology: [
      "Solid/glandular/papillary growth with crowded pleomorphic nuclei",
      "Frequent mitoses and necrosis (‘ugly’)",
      "Infiltrative destructive pattern"
    ],
    keyIHC: {
      positive: ["CD30", "OCT4", "Cytokeratin (often)"],
      negative: ["CD117 (typically)"]
    },
    keyMolecular: ["i(12p)/12p amplification in postpubertal pathway"],
    criticalDifferential: ["Seminoma"],
    pearls: [
      { type: "discriminator", text: "**CD30+ / CD117−** is the inverse of seminoma." },
      { type: "reporting", text: "Quantify component percentage in mixed tumors—this can influence risk and response expectations." }
    ],
    prognosis: {
      tier: "Aggressive",
      drivers: [
        { name: "Stage", effect: "unfavorable" },
        { name: "Tumor burden in mixed GCT", effect: "contextual" }
      ],
      counseling: ["More aggressive than seminoma; correct identification prevents undertreatment."]
    },
    managementImplications: ["Missing embryonal component can misroute therapy strategy."]
  },
  {
    entityId: "Yolk Sac Tumor",
    summary:
      "AFP/Glypican-3 positive NSGCT component; prepubertal vs postpubertal context strongly modifies meaning and risk.",
    keyMorphology: [
      "Reticular/microcystic (‘lace-like’) pattern",
      "Schiller–Duval bodies (when present)",
      "Hyaline globules"
    ],
    keyIHC: { positive: ["AFP", "Glypican-3", "SALL4"] },
    keyMolecular: ["Postpubertal component usually within i(12p) malignant pathway"],
    criticalDifferential: ["Embryonal Carcinoma"],
    pearls: [
      { type: "workflow", text: "Always integrate **serum AFP** and age context; AFP is both diagnostic and monitoring marker." }
    ],
    prognosis: {
      tier: "Intermediate/Variable",
      drivers: [
        { name: "Prepubertal vs postpubertal context", effect: "contextual" },
        { name: "Stage", effect: "unfavorable" }
      ],
      counseling: ["Biology and implications differ by developmental context; correct framing prevents incorrect risk assumptions."]
    },
    managementImplications: ["Accurate component identification supports correct marker interpretation and follow-up logic."]
  },
  {
    entityId: "Choriocarcinoma",
    summary:
      "Highly aggressive trophoblastic GCT component with hemorrhage and very high hCG; small primaries can have massive metastases.",
    keyMorphology: [
      "Biphasic: cytotrophoblasts + syncytiotrophoblasts",
      "Marked hemorrhage and necrosis (‘blood bath’)"
    ],
    keyIHC: { positive: ["hCG"] },
    keyMolecular: ["i(12p)/12p amplification in postpubertal pathway"],
    criticalDifferential: ["Embryonal Carcinoma"],
    pearls: [
      { type: "reporting", text: "Explicitly communicate aggressive biology; correlate with serum hCG." }
    ],
    prognosis: {
      tier: "Highly Aggressive",
      drivers: [{ name: "Early hematogenous spread propensity", effect: "unfavorable" }],
      counseling: ["Often aggressive with early metastasis; prompt staging and systemic therapy planning context."]
    },
    managementImplications: ["Avoids underestimation when tumor is small but biologically high-risk."]
  },
  {
    entityId: "Teratoma",
    summary:
      "Chemo-resistant component; postpubertal teratoma is malignant by context (metastatic potential) regardless of ‘mature’ appearance.",
    keyMorphology: [
      "Somatic tissues from ≥1 germ layer (cartilage, glands, neural, squamous, etc.)",
      "‘Fruitcake’ heterogeneity"
    ],
    keyIHC: { positive: ["(Variable by tissue type)"] },
    keyMolecular: ["Postpubertal malignant pathway association; behavior driven by context"],
    criticalDifferential: ["Mixed Germ Cell Tumor"],
    pearls: [
      { type: "discriminator", text: "**Postpubertal teratoma ≠ benign** (context-dependent malignancy)." },
      { type: "reporting", text: "Quantify % teratoma in mixed GCT; highlight chemo resistance explicitly." }
    ],
    prognosis: {
      tier: "Intermediate/Variable",
      drivers: [
        { name: "Postpubertal context", effect: "unfavorable", notes: "Metastatic potential exists." },
        { name: "Resectability / residual disease", effect: "contextual" }
      ],
      counseling: ["Clinically important because it can persist after chemotherapy and require surgical management."]
    },
    managementImplications: ["Ensures clinicians don’t assume chemo will eradicate teratomatous disease."]
  },
  {
    entityId: "Mixed Germ Cell Tumor",
    summary:
      "Rule, not exception; prognosis and therapy are driven by component percentages—reporting is prognostication.",
    keyMorphology: [
      "Composite of seminoma + one or more NSGCT elements",
      "Component-specific patterns coexist in different regions"
    ],
    keyIHC: { positive: ["Component-dependent; use targeted panels per region"] },
    keyMolecular: ["Usually i(12p)/12p amplification in postpubertal pathway"],
    criticalDifferential: ["Seminoma", "Embryonal Carcinoma", "Teratoma"],
    pearls: [
      { type: "workflow", text: "Sample generously; if any region looks different, stain it separately." },
      { type: "reporting", text: "Report **each component and %** (especially teratoma) because therapy response differs." },
      { type: "pitfall", text: "Avoid single-block ‘one-marker’ diagnosis; mixed tumors punish shortcuts." }
    ],
    prognosis: {
      tier: "Intermediate/Variable",
      drivers: [
        { name: "Stage", effect: "unfavorable" },
        { name: "Component biology (teratoma, choriocarcinoma, embryonal)", effect: "unfavorable" }
      ],
      counseling: ["Risk varies; percentages meaningfully influence expected response and relapse risk framing."]
    },
    managementImplications: ["Directly impacts chemo expectations and surgical planning."]
  },
  {
    entityId: "Testicular Lymphoma",
    summary:
      "Most common testicular malignancy in older men; systemic disease implications—do not miss in >60.",
    keyMorphology: [
      "Diffuse interstitial infiltrate between tubules",
      "Often spares tubules early; may be bilateral"
    ],
    keyIHC: { positive: ["CD45"] },
    criticalDifferential: ["Seminoma"],
    pearls: [
      { type: "discriminator", text: "In men **>60**, rule out lymphoma early—CD45 gate is high yield." }
    ],
    prognosis: {
      tier: "Aggressive",
      drivers: [{ name: "Systemic disease behavior", effect: "unfavorable" }],
      counseling: ["Behavior reflects systemic lymphoma patterns; correct diagnosis changes staging and therapy entirely."]
    },
    managementImplications: ["Prevents misrouting into GCT management pathways."]
  },
  {
    entityId: "Spermatocytic Tumor",
    summary:
      "Indolent tumor of older men; lacks i(12p) and lacks GCNIS; avoid confusing with seminoma.",
    keyMorphology: [
      "Distinct cytology compared to seminoma (often mixed cell populations in classic teaching)",
      "Typically lacks prominent lymphoid septa"
    ],
    keyIHC: { positive: ["(Variable; use exclusion + context)"] },
    keyMolecular: ["Lacks i(12p); not derived from GCNIS"],
    criticalDifferential: ["Seminoma"],
    pearls: [
      { type: "workflow", text: "Use **age + absence of GCNIS** logic to avoid overcalling seminoma." }
    ],
    prognosis: {
      tier: "Generally Favorable",
      drivers: [{ name: "Correct classification", effect: "favorable" }],
      counseling: ["Typically indolent; correct naming avoids overtreatment."]
    },
    managementImplications: ["Avoids unnecessary aggressive therapy aligned to malignant GCT pathways."]
  },
  {
    entityId: "Leydig Cell Tumor",
    summary:
      "Sex cord–stromal tumor with endocrine effects; mostly benign, but adverse features should be communicated for risk framing.",
    keyMorphology: [
      "Sheets/nests of polygonal cells with abundant eosinophilic cytoplasm",
      "Reinke crystals (supportive; not required)",
      "Assess necrosis, vascular invasion, high mitotic activity, marked atypia"
    ],
    keyIHC: { positive: ["Inhibin", "Calretinin", "Melan-A"] },
    criticalDifferential: ["Sertoli Cell Tumor"],
    pearls: [
      { type: "reporting", text: "Comment on adverse features (size, necrosis, vascular invasion, mitotic rate, atypia) to guide malignancy risk discussions." }
    ],
    prognosis: {
      tier: "Generally Favorable",
      drivers: [{ name: "Adverse histologic features", effect: "contextual" }],
      counseling: ["Most behave benignly; a minority behave aggressively—risk is feature-driven."]
    },
    managementImplications: ["Improves counseling and follow-up intensity decisions."]
  },
  {
    entityId: "Sertoli Cell Tumor",
    summary:
      "Sex cord tumor with tubule formation; syndromic associations exist; prognosis usually favorable but feature-dependent.",
    keyMorphology: [
      "Tubules/cords of Sertoli-like cells",
      "Evaluate for atypia, necrosis, invasion, mitotic rate"
    ],
    keyIHC: { positive: ["Inhibin", "Calretinin"] },
    criticalDifferential: ["Leydig Cell Tumor"],
    pearls: [
      { type: "workflow", text: "Consider syndromic context (e.g., Peutz–Jeghers, Carney complex) when clinically suggested." }
    ],
    prognosis: {
      tier: "Generally Favorable",
      drivers: [{ name: "Adverse features and stage", effect: "contextual" }],
      counseling: ["Typically favorable; correct classification supports appropriate genetic/clinical correlation when relevant."]
    },
    managementImplications: ["Ensures right downstream clinical correlation without over-escalating."]
  }
];

// ==================================================
// 4) LECTURES — now wired with refs + formatting + Case Studies
// ==================================================

export const LECTURES: Lecture[] = [
  {
    id: "renal_mass_eval",
    title: "Renal Mass Evaluation",
    category: "GU Pathology",
    description: "A comprehensive journey from anatomy to molecular classification of kidney tumors.",
    entityCards: RENAL_ENTITY_CARDS,
    transcript: `
## Renal Mass Evaluation: Full Transcript

**Introduction**
Welcome to the comprehensive guide on Renal Mass Evaluation. In this session, we will navigate the complex landscape of kidney tumors, which range from benign entities like Oncocytoma to highly aggressive cancers such as Renal Medullary Carcinoma. Our primary goal is to shift your thinking from simple labeling to a risk-stratification mindset. We will learn to connect the anatomic location—cortex versus medulla—to the likely diagnosis, use a morphology-first triage system to categorize tumors as "Clear," "Pink," or "Papillary," and integrate molecular drivers like VHL and MiT family alterations into your diagnostic logic. Most importantly, we will focus on preventing clinical harm: avoiding the overtreatment of indolent mimics and ensuring aggressive tumors are not under-called.

**Anatomic Context**
Anatomy is the foundation of staging. The renal cortex is the birthplace of most common RCC subtypes, whereas the medulla is a "red-alert" zone. Tumors centered here, such as Collecting Duct Carcinoma or Renal Medullary Carcinoma, are often high-grade and aggressive. Always verify the tumor's relationship to the capsule, perinephric fat, and renal vein, as these are critical staging parameters that define patient prognosis.

**The Universe of Renal Tumors**
The WHO classification groups renal tumors by a combination of morphology and molecular drivers. exist in distinct clusters. The clear cell lineage is dominated by VHL/HIF pathway alterations. The papillary spectrum is heterogeneous. The eosinophilic group presents the classic challenge of distinguishing benign Oncocytoma from malignant Chromophobe RCC. We also have specific "traps" like the Clear Cell Papillary Renal Cell Tumor, an indolent mimic that must not be confused with aggressive clear cell carcinoma. Remember your gatekeeper stains: PAX8 confirms renal origin, while CA9 and CK7 patterning helps split the difficult differentials.

**Diagnostic Algorithm**
When approaching a renal mass, follow a disciplined sequence. First, check the location: is it medullary or cortical? Second, assess the dominant cytoplasmic quality. precise triage. For clear cells, the default is Clear Cell RCC, but stop if you see diffuse CK7 positivity or "cup-like" CA9 staining. For eosinophilic tumors, use CK7 to separate the scattered pattern of Oncocytoma from the diffuse pattern of Chromophobe RCC. Finally, never finalize a case without a prognostic audit: check for necrosis, sarcomatoid or rhabdoid differentiation, and venous invasion.

**Deep Dive: Clear Cell RCC**
Clear Cell RCC is the most common subtype, driven by 3p loss and VHL mutations. It presents with a classic delicate vascular network. The essential IHC profile is PAX8 positive, Vimentin positive, and the hallmark CA9 "box" pattern—diffuse membranous staining. If you see a "cup" pattern (basolateral only), stop; you are likely dealing with a mimic. Prognosis here is driven by stage and grade. Remember, Grade 4 is defined by extreme pleomorphism or sarcomatoid/rhabdoid change—features that override any "average" grade.

**Critical Differential: The Clear Mimics**
Clear Cell Papillary Renal Cell Tumor is a critical entity to recognize because it is indolent. Mislabeling it as conventional Clear Cell RCC leads to unnecessary cancer anxiety and surveillance. Morphologically, look for "piano-key" nuclei and tubulopapillary architecture. The IHC signature is the "flip": CK7 diffuse positive and CA9 "cup-like" positive. This contrasts sharply with the CK7 negative/patchy and CA9 "box" pattern of conventional Clear Cell RCC.

**Deep Dive: The Pink Tumors**
The distinction between Chromophobe RCC and Oncocytoma is a classic pathology dilemma. Oncocytoma is benign; Chromophobe RCC is malignant. Oncocytomas typically have scattered CK7 staining and may show central scars. Chromophobe RCCs often have "plant-like" cell borders, perinuclear halos, and show diffuse CK7 positivity. Getting this wrong matters: calling an oncocytoma malignant causes overtreatment, while calling a chromophobe benign can lead to under-staging.

**Summary**
To wrap up: Renal mass evaluation requires integrating morphology, anatomy, and molecular surrogates. Use PAX8 to anchor lineage. Use CA9 and CK7 patterns to split the mimics. And always, always report the adverse prognostic features—necrosis, grade 4 change, and invasion—that truly determine the patient's future.
    `,
    slides: [
      {
        type: "intro",
        title: "Welcome",
        content: `
## Approach to the Renal Mass

Kidney tumors range from benign entities like [[Oncocytoma]] to highly aggressive carcinomas like [[Renal Medullary Carcinoma]].

**Learning Objectives**
- **Anatomy:** Relate location (cortex vs medulla vs pelvis) to likely subtype and staging implications.
- **Morphology-first triage:** “Clear” vs “Pink/Oncocytic” vs “Blue/Basophilic/Papillary.”
- **Prognostic thinking:** Stage + grade + necrosis + sarcomatoid/rhabdoid features drive outcomes (not just the label).
- **Molecular logic:** Connect phenotype to pathways (e.g., VHL/HIF; MiT family).

---

### Clinical-risk mindset (what hurts patients if you’re wrong)
- **Overcall indolent mimics** → overtreatment + excessive surveillance.
- **Undercall aggressive patterns** (sarcomatoid/rhabdoid/venous invasion) → underestimated relapse risk.
- **Miss medullary high-grade tumors** → dangerous under-triage of urgency.
        `,
        config: {
          showPrognosisPanel: true,
          showPitfallPanel: true
        }
      },
      {
        type: "anatomy",
        title: "Anatomic Context",
        config: { system: "gu" },
        content: `
## The Genitourinary System

Anatomic layering is staging logic:

- **Cortex:** Typical origin of major RCC subtypes.
- **Medulla:** Red-alert origin zone for high-grade entities (e.g., [[Collecting Duct Carcinoma]], [[Renal Medullary Carcinoma]]).
- **Pelvis:** Think [[Urothelial Carcinoma]] (different staging + marker logic).
- **Capsule/Perinephric fat/Renal vein:** Where pT escalation happens.

**High-stakes gross correlation**
- Confirm relationship to capsule and perinephric fat.
- Identify and sample renal sinus fat and renal vein margins.
- Map tumor to medulla vs cortex if borderline—this can change the diagnostic universe.
        `
      },
      {
        type: "network",
        title: "The Universe of Renal Tumors",
        config: {
          nodeId: "Clear Cell RCC",
          highlightGroup: "Kidney",
          entityRefs: [
            "Clear Cell RCC",
            "Papillary RCC",
            "Chromophobe RCC",
            "Oncocytoma",
            "Clear Cell Papillary",
            "Translocation RCC",
            "Collecting Duct Carcinoma",
            "Renal Medullary Carcinoma"
          ],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## Galaxy View: Renal Epithelial Tumors

WHO5 renal tumors are defined by **morphology + molecular drivers**.

**Key clusters (with prognostic tone)**
- **Clear cell lineage (VHL/HIF):** [[Clear Cell RCC]] — variable risk; stage/grade dominate.
- **Papillary spectrum:** [[Papillary RCC]] — heterogeneous; avoid “papillary pattern = papillary RCC” thinking.
- **Eosinophilic / oncocytic:** [[Chromophobe RCC]] vs [[Oncocytoma]] — major harm is mislabeling benign lesions as malignant (or vice versa).
- **Indolent mimic:** [[Clear Cell Papillary]] — classic overtreatment trap.
- **MiT family:** [[Translocation RCC]] — variable behavior; demands suspicion-based confirmation.
- **Medullary high-grade:** [[Collecting Duct Carcinoma]] / [[Renal Medullary Carcinoma]] — urgent aggressive biology signals.

**Gatekeepers**
- [[PAX8]] confirms renal lineage; does **not** subtype.
- [[CA9]] patterning is biologic (HIF signaling): **Box vs Cup**.
- [[CK7]] patterning splits multiple branches (oncocytic and clear-cell mimics).
        `
      },
      {
        type: "algorithm",
        title: "Diagnostic Algorithm",
        config: {
          algorithmId: "algo_renal",
          entityRefs: [
            "Clear Cell RCC",
            "Clear Cell Papillary",
            "Translocation RCC",
            "Papillary RCC",
            "Oncocytoma",
            "Chromophobe RCC",
            "Collecting Duct Carcinoma",
            "Renal Medullary Carcinoma"
          ],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## Algorithmic Triage (morphology → discriminators → prognosis)

### Step 0: “Where is it?” (cortex vs medulla vs pelvis)
- Medullary-centered + high grade → prioritize **CDC/RMC** differential; urgency and prognosis differ dramatically.

### Step 1: Dominant cytoplasm
1) **Clear**
- Default: [[Clear Cell RCC]]
- Stop signs: CK7 diffuse, CA9 cup, young age, papillary architecture, psammoma bodies → consider [[Clear Cell Papillary]] or [[Translocation RCC]].

2) **Eosinophilic / oncocytic**
- Default split: [[Oncocytoma]] vs [[Chromophobe RCC]]
- Core discriminator: CK7 **scattered** (oncocytoma) vs **diffuse** (chromophobe).

3) **Basophilic / papillary**
- Consider [[Papillary RCC]] but **prove it** (exclude CCRCC with papillary areas and MiT RCC).

### Step 2: Prognostic capture (don’t wait until the end)
- Stage cues: renal sinus fat, renal vein, perinephric fat.
- Grade cues (CCRCC/Papillary): nucleolar prominence; **grade 4 features override averages**.
- Adverse histology: necrosis, sarcomatoid/rhabdoid, venous invasion.
        `
      },
      {
        type: "algorithm",
        title: "Mechanism-First Tree",
        config: {
          algorithmId: "algo_renal_mechanism",
          entityRefs: [
            "Clear Cell RCC",
            "Papillary RCC",
            "Chromophobe RCC",
            "Oncocytoma",
            "Translocation RCC",
            "Renal Medullary Carcinoma",
            "Collecting Duct Carcinoma"
          ],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## Mechanism-First Decision Tree

**Concept:** Instead of just looking at the cells, ask *what biochemical system is broken?*

This tree guides you from molecular programs to specific diagnoses:
1.  **Renal Epithelial Lineage** (PAX8/WT1)
2.  **Oxygen Sensing & Hypoxia** (VHL-HIF axis)
3.  **Metabolic Reprogramming** (Krebs cycle, Lipid metabolism)
4.  **Lysosomal Program** (MiT family)
5.  **Distal Nephron Biology** (Mitochondria-rich)
        `
      },
      {
        type: "network",
        title: "Deep Dive: Clear Cell RCC",
        config: {
          nodeId: "Clear Cell RCC",
          entityRefs: ["Clear Cell RCC", "Clear Cell Papillary", "Translocation RCC"],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## [[Clear Cell RCC]] (CCRCC)

**Identity:** VHL/HIF-driven carcinoma; classic vascular pattern.

### Diagnostic Triad
1) **Morphology**
- Clear cytoplasm + delicate capillary network
- Audit: necrosis, venous invasion, sarcomatoid/rhabdoid

2) **IHC**
- [[PAX8]]+ confirms renal lineage
- [[CA9]]+ **diffuse “box”** (membranous all-around)
- [[CD10]]+, [[Vimentin]]+

3) **Molecular**
- [[VHL Mutation]] / 3p loss pathway

---

### High-stakes discriminator (do not skip)
- **CA9 Box = CCRCC**
- **CA9 Cup + CK7 diffuse = stop → consider [[Clear Cell Papillary]]**

---

### Prognostic lens (what changes the future)
- Stage dominates.
- WHO/ISUP grade matters (grade 4 features are high risk).
- Necrosis + sarcomatoid/rhabdoid + venous invasion escalate risk materially.

**If you call this wrong, what harm happens?**
- Calling [[Clear Cell Papillary]] as CCRCC → overtreatment.
- Missing sarcomatoid/rhabdoid/venous invasion → underestimation of relapse risk.
        `
      },
      {
        type: "network",
        title: "Critical Differential: The “Clear” Mimics",
        config: {
          nodeId: "Clear Cell Papillary",
          entityRefs: ["Clear Cell Papillary", "Clear Cell RCC", "Translocation RCC"],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## The Indolent Mimic: [[Clear Cell Papillary]] (CCPRCT)

### Why it matters
This is an **overtreatment trap**. The pathologist’s job is to prevent harm from mislabeling.

### Morphology
- Bland clear cells, often tubulopapillary
- Subnuclear vacuoles (“piano key” nuclei)

### IHC flip (signature)
- [[CK7]] **diffuse strong**
- [[CA9]] **cup-like (basolateral)**

### Contrast with CCRCC
- [[Clear Cell RCC]]: CK7 usually negative/patchy + CA9 **box**
- CCPRCT: CK7 diffuse + CA9 **cup**

**If you call this wrong, what harm happens?**
- Unnecessary aggressive surveillance, anxiety, and potentially more extensive treatment decision-making.
        `
      },
      {
        type: "network",
        title: "Case Challenge: The \"Clear\" Trap",
        config: {
          nodeId: "Clear Cell Papillary",
          entityRefs: ["Clear Cell Papillary", "Clear Cell RCC"],
          showPrognosisPanel: false,
          showPitfallPanel: false
        },
        content: `
## Case Challenge: The Incidental Finding

**Scenario:** 42F with a 2.0 cm renal mass found during gallbladder workup.
**Microscopy:** Nests of clear cells. The resident calls it "Clear Cell RCC, Grade 1".

**The Twist:** You order markers. [[CA9]] shows a **"cup-like"** pattern (basolateral). [[CK7]] is **diffuse positive**.

**The Pivot:** Does this profile fit the resident's diagnosis?

**Resolution:** No. This is **[[Clear Cell Papillary]]** Renal Cell Tumor.

**Why it matters:** This tumor is indolent. Assigning a "Grade" implies malignancy potential that doesn't exist. You saved the patient from "Cancer" anxiety and surveillance.
        `
      },
      {
        type: "network",
        title: "Deep Dive: The Pink Tumors",
        config: {
          nodeId: "Chromophobe RCC",
          entityRefs: ["Chromophobe RCC", "Oncocytoma"],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## [[Chromophobe RCC]] vs [[Oncocytoma]] (Eosinophilic renal mass)

### [[Chromophobe RCC]]
- **Morphology:** plant-like borders, perinuclear halos, raisinoid nuclei
- **IHC:** [[CK7]] **diffuse**, [[CD117]]+
- **Reporting:** Not typically WHO/ISUP graded; stage + adverse features carry prognostic weight

### [[Oncocytoma]]
- **Morphology:** uniform round nuclei, nests in loose stroma, often central scar
- **IHC:** [[CK7]] negative or scattered; [[CD117]]+

---

### The discriminator that saves you
- **CK7 diffuse → chromophobe**
- **CK7 scattered/negative → oncocytoma**

**If you call this wrong, what harm happens?**
- Oncocytoma mislabeled malignant → overtreatment + anxiety.
- Chromophobe mislabeled benign → under-treatment/staging underappreciation.
        `
      },
      {
        type: "network",
        title: "Case Challenge: The \"Pink\" Trap",
        config: {
          nodeId: "Chromophobe RCC",
          entityRefs: ["Chromophobe RCC", "Oncocytoma"],
          showPrognosisPanel: false,
          showPitfallPanel: false
        },
        content: `
## Case Challenge: The Mahogany Tumor

**Scenario:** 55M with a 6cm brown solid mass.
**Microscopy:** Sheets of eosinophilic cells. No perinuclear halos visible.

**The Twist:** You suspect [[Oncocytoma]]. You order [[CK7]]. It comes back **diffuse strong positive**.

**The Pivot:** Can Oncocytoma be diffuse CK7+?

**Resolution:** Rarely. This pattern strongly favors **[[Chromophobe RCC]]** (Eosinophilic variant).

**Why it matters:** Oncocytoma is benign. Chromophobe is malignant (though indolent). The follow-up protocols differ entirely.
        `
      },
      {
        type: "summary",
        title: "Prognosis: WHO/ISUP Grading",
        config: { entityRefs: ["Clear Cell RCC", "Papillary RCC"], showPrognosisPanel: true },
        content: `
## WHO/ISUP Grading (CCRCC + Papillary RCC)

We grade based on **nucleolar prominence** (not Fuhrman).

- **Grade 1:** nucleoli inconspicuous at 400×
- **Grade 2:** visible at 400×, not at 100×
- **Grade 3:** visible at 100×
- **Grade 4:** extreme pleomorphism OR **sarcomatoid/rhabdoid differentiation**

### Expert rule
**Grade 4 is feature-based.** You cannot “average it away.”
        `
      },
      {
        type: "summary",
        title: "Lecture Complete",
        config: {
          entityRefs: [
            "Clear Cell RCC",
            "Clear Cell Papillary",
            "Chromophobe RCC",
            "Oncocytoma",
            "Papillary RCC",
            "Translocation RCC",
            "Collecting Duct Carcinoma",
            "Renal Medullary Carcinoma"
          ]
        },
        content: `
## Summary: Renal Mass Evaluation

**Core flow**
- Start with morphology (Clear vs Pink vs Blue) **and** anatomic location.
- Use **PAX8** to confirm renal lineage.
- Use **CA9 pattern** (Box vs Cup) + **CK7 pattern** (Diffuse vs Scattered) to avoid the classic traps.
- Integrate prognostic features early: **stage + grade + necrosis + sarcomatoid/rhabdoid + venous invasion**.

**Red-alert zone**
- Medullary-based high-grade tumors (CDC/RMC) demand urgency and clinical correlation.
        `
      }
    ]
  },

  {
    id: "testicular_mass_eval",
    title: "Testicular Mass Evaluation",
    category: "GU Pathology",
    description:
      "Master the diagnostic workup of testicular neoplasms, from Germ Cell Tumors to Sex Cord-Stromal entities.",
    entityCards: TESTIS_ENTITY_CARDS,
    transcript: `
## Testicular Mass Evaluation: Full Transcript

**Introduction**
Welcome to the evaluation of Testicular Masses. The vast majority of tumors you will encounter here are Germ Cell Tumors (GCTs). Your diagnostic workup must always be anchored in clinical data: the patient's age is the single most powerful discriminator. Ideally, you will also have serum markers—AFP, beta-hCG, and LDH—which serve as both diagnostic clues and monitoring tools.
Biologically, the key concept to frame your thinking is the "postpubertal malignant pathway," defined by the presence of isochromosome 12p. This pathway drives the common malignancies like Seminoma, Embryonal Carcinoma, and postpubertal Teratoma.

**Anatomic Context**
Understanding the anatomy is straightforward but vital for staging. Tumors arise from the tubules (GCTs, Sertoli tumors) or the interstitium (Leydig tumors, Lymphoma). Documenting invasion into the rete testis, tunica albuginea, or spermatic cord is critical, as these are the checkpoints that escalate the pT stage.

**Diagnostic Algorithm**
Our diagnostic logic proceeds in steps.
Step 1: Age. In a prepubertal child, a teratoma is often benign. In a postpubertal male, it is assumed malignant. In a man over 60, your first thought should be Lymphoma.
Step 2: Lineage. Is it a Germ Cell Tumor (SALL4+, OCT4+) or a Sex Cord-Stromal Tumor (Inhibin+, Calretinin+)?
Step 3: Subtyping GCTs. This is the high-stakes work. You must distinguish Seminoma (CD117 positive, CD30 negative) from Embryonal Carcinoma (CD30 positive, CD117 negative).
Step 4: Mixed Tumors. Pure tumors are less common than you think. Assume heterogeneity. You must quantify every component, especially Teratoma, because it is chemo-resistant and requires surgical management.

**Deep Dive: Seminoma and Precursors**
Classical Seminoma is the most common pure GCT. Histologically, look for sheets of uniform cells with clear cytoplasm, distinct borders, and fibrous septa containing lymphocytes. The immunoprofile is distinct: OCT4+, SALL4+, and CD117+, but crucially CD30 negative.
Its precursor, Germ Cell Neoplasia In Situ (GCNIS), shares this profile and is found in the adjacent tubules. Identifying GCNIS confirms you are dealing with a postpubertal pathway tumor, which is helpful context.
Seminomas generally have an excellent prognosis, but the trap is missing a small component of non-seminomatous tumor (NSGCT), which would require a more aggressive treatment regimen.

**Deep Dive: Non-Seminomatous GCTs (NSGCT)**
These are the aggressive players.
Embryonal Carcinoma is high-grade, "ugly," and necrotic. It stains with CD30.
Yolk Sac Tumor shows reticular or microcystic patterns and is positive for AFP and Glypican-3.
Choriocarcinoma consists of biphasic trophoblasts, is often hemorrhagic, and is marked by high hCG.
Teratoma, in the postpubertal setting, is malignant. It can contain cartilage, glands, or neural tissue. Its chemo-resistance makes accurate quantification essential for surgical planning.

**Special Scenarios**
Beware the "Bilateral Trap." If you see a bilateral testicular mass in an elderly man (over 60), do not default to Seminoma. Stain for CD45. This is often Testicular Lymphoma, a systemic disease treated with chemotherapy, not orchiectomy alone.
Another pitfall is the "Serologic Mismatch." If your slides show only Seminoma, but the patient's serum AFP is elevated, you have missed a Yolk Sac or Embryonal component (or it is in the block you didn't print). You cannot call it pure Seminoma; it must be managed as a Mixed Germ Cell Tumor.

**Summary**
In summary: Age is destiny in testicular pathology. Never let a single marker override morphology. Use CD117 vs CD30 to split the main GCT types. Quantify all components in mixed tumors. And always keep a high index of suspicion for lymphoma in older patients. Accurate diagnosis here directly dictates whether a patient gets surveillance, radiation, chemotherapy, or surgery.
    `,
    slides: [
      {
        type: "intro",
        title: "Introduction to Testicular Pathology",
        config: { showPrognosisPanel: true, showPitfallPanel: true },
        content: `
## Evaluation of the Testicular Mass

Most testicular tumors are **Germ Cell Tumors (GCTs)**.

### High-yield clinical anchors
- **Age:** the most powerful first discriminator.
- **Serum markers:** AFP, β-hCG, LDH.
- **Ultrasound:** solid intratesticular mass = malignant until proven otherwise.

---

### The prognostic superstructure (hidden skeleton)
- **Postpubertal malignant GCTs** are defined by **i(12p)/12p amplification**.
- **Seminoma** generally has excellent prognosis and radiosensitivity.
- **NSGCT components** (embryonal, yolk sac, choriocarcinoma, teratoma) change biology and management.
- **Teratoma** is clinically critical: **chemo-resistant**; postpubertal context = malignant potential.

**If you call this wrong, what harm happens?**
- Missing NSGCT components can lead to undertreatment.
- Calling lymphoma as GCT in older men can misroute care entirely.
        `
      },
      {
        type: "anatomy",
        title: "Anatomic Context",
        config: { system: "gu" },
        content: `
## Testicular Anatomy

- **Tubules:** origin of most GCTs and Sertoli tumors.
- **Interstitium:** Leydig tumors and lymphoma.
- **Rete testis / Tunica albuginea:** staging relevance; breach changes T-stage.

**Sampling logic**
- If mixed tumor suspected: sample broadly; heterogeneity is the rule.
        `
      },
      {
        type: "algorithm",
        title: "Diagnostic Algorithm",
        config: {
          algorithmId: "algo_testis",
          entityRefs: [
            "Seminoma",
            "GCNIS",
            "Embryonal Carcinoma",
            "Yolk Sac Tumor",
            "Choriocarcinoma",
            "Teratoma",
            "Mixed Germ Cell Tumor",
            "Testicular Lymphoma",
            "Spermatocytic Tumor",
            "Leydig Cell Tumor",
            "Sertoli Cell Tumor"
          ],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## The Diagnostic Chain of Thought (diagnosis + prognosis together)

### Step 1: Age Context (prognosis encoded)
- **Prepubertal:** pure yolk sac tumor or teratoma patterns have different implications.
- **Postpubertal:** malignant GCT pathway (think i(12p)).
- **Elderly (>60):** rule out **[[Testicular Lymphoma]]** early; also consider **[[Spermatocytic Tumor]]**.

### Step 2: Germ cell vs sex cord–stromal
- **GCT:** [[SALL4]]+, [[OCT4]]+ (context-dependent)
- **Sex cord:** [[Inhibin]]+, [[Calretinin]]+

### Step 3: Seminoma vs NSGCT splitter (high-stakes)
- **Seminoma:** [[CD117]]+ / [[CD30]]-
- **Embryonal:** [[CD30]]+ / [[CD117]]-

### Step 4: Mixed tumors (default assumption)
- Quantify **every component**; highlight teratoma (chemo-resistant).
        `
      },
      {
        type: "network",
        title: "Galaxy of Testicular Tumors",
        config: {
          nodeId: "Seminoma",
          highlightGroup: "Testis",
          entityRefs: ["Seminoma", "Embryonal Carcinoma", "Yolk Sac Tumor", "Teratoma", "Testicular Lymphoma", "Spermatocytic Tumor"],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## Visualizing Relationships

**Key hubs**
- **[[i(12p)]] / 12p amplification:** postpubertal malignant GCT backbone.
- **[[SALL4]] & [[OCT4]]:** pan-germ cell logic (interpret with context).
- **[[Inhibin]]:** sex cord–stromal bridge.
- **[[CD45]]:** lymphoma branch.

**Expert note**
Entities cluster by shared markers, but diagnosis requires **architecture + cytology + context**—not marker-only thinking.
        `
      },
      {
        type: "network",
        title: "Deep Dive: Seminoma",
        config: { nodeId: "Seminoma", entityRefs: ["Seminoma", "Embryonal Carcinoma", "Mixed Germ Cell Tumor"], showPrognosisPanel: true, showPitfallPanel: true },
        content: `
## Classic Seminoma

### Histology
- Sheets of uniform large cells with clear cytoplasm
- Distinct borders, prominent nucleoli
- Fibrous septa with lymphocytes

### IHC
- **Positive:** [[OCT4]], [[SALL4]], [[CD117]], [[PLAP]], [[D2-40]]
- **Negative:** [[CD30]] (key), cytokeratin usually negative or focal dot-like

### Prognostic meaning
- Typically excellent prognosis and treatment responsiveness.
- **High-stakes pitfall:** missing a NSGCT component → undertreatment.

**Single discriminator that saves you**
- **CD117 vs CD30** split, plus aggressive morphology sampling.
        `
      },
      {
        type: "network",
        title: "The Precursor: GCNIS",
        config: { nodeId: "GCNIS", entityRefs: ["GCNIS", "Seminoma"], showPrognosisPanel: true },
        content: `
## Germ Cell Neoplasia In Situ (GCNIS)

### Appearance
- Atypical germ cells within tubules, along basement membrane
- Often absent spermatogenesis in affected tubules

### IHC
- Mirrors seminoma: [[OCT4]]+, [[CD117]]+, [[PLAP]]+

### Why it matters (prognostic context)
- Confirms postpubertal GCT pathway and supports contralateral risk framing.
        `
      },
      {
        type: "network",
        title: "Case Challenge: The Serologic Mismatch",
        config: {
          nodeId: "Seminoma",
          entityRefs: ["Seminoma", "Yolk Sac Tumor", "Embryonal Carcinoma"],
          showPrognosisPanel: false,
          showPitfallPanel: false
        },
        content: `
## Case Challenge: The Serologic Mismatch

**Scenario:** 28M, testicular mass. Serum **AFP is 800 ng/mL**.
**Microscopy:** You see 10 slides of classic **[[Seminoma]]** (lymphocytes, fried-egg cells).

**The Cognitive Conflict:** Can pure Seminoma make AFP?

**The Pivot:** Never. Pure Seminoma is AFP negative.

**Resolution:** There is a missed **[[Yolk Sac Tumor]]** or **[[Embryonal Carcinoma]]** component hiding in the block you didn't submit, or it represents "burned out" tumor.

**Action:** Submit more tissue. If negative, report as "Mixed Germ Cell Tumor" based on serology.
        `
      },
      {
        type: "network",
        title: "Deep Dive: Non-Seminomatous GCTs",
        config: { nodeId: "Embryonal Carcinoma", entityRefs: ["Embryonal Carcinoma", "Yolk Sac Tumor", "Choriocarcinoma", "Teratoma", "Mixed Germ Cell Tumor"], showPrognosisPanel: true, showPitfallPanel: true },
        content: `
## Non-Seminomatous GCTs (NSGCT)

### 1) [[Embryonal Carcinoma]]
- “Ugly” high-grade stem-cell phenotype
- Necrosis + high mitoses
- **IHC:** [[CD30]]+, [[OCT4]]+, [[CD117]]-

### 2) [[Yolk Sac Tumor]]
- Reticular/microcystic patterns; Schiller–Duval bodies
- **IHC:** [[AFP]]+, [[Glypican-3]]+, [[SALL4]]+
- Serum AFP often elevated (diagnostic + monitoring)

### 3) [[Choriocarcinoma]]
- Biphasic trophoblasts; hemorrhagic/necrotic
- **IHC:** [[hCG]]+; serum hCG often very high
- High propensity for early hematogenous spread

### 4) [[Teratoma]]
- Chemo-resistant; postpubertal context = malignant potential
- Must be quantified in mixed tumors

**If you call this wrong, what harm happens?**
- Mislabeling as seminoma can misroute therapy.
- Missing teratoma can mislead expectations of chemo response.
        `
      },
      {
        type: "network",
        title: "Reality Check: Mixed Tumors",
        config: { nodeId: "Teratoma", entityRefs: ["Mixed Germ Cell Tumor", "Teratoma", "Embryonal Carcinoma", "Seminoma", "Yolk Sac Tumor"], showPrognosisPanel: true, showPitfallPanel: true },
        content: `
## Mixed Germ Cell Tumors (the default reality)

### Why it matters
Reporting is prognostication and therapy guidance.

### Component logic
- Teratoma: chemo-resistant → surgical relevance
- Embryonal/choriocarcinoma: aggressive biology
- Seminoma: treatment-sensitive component

### Reporting rule
- Estimate % of each component (don’t round away the small but critical ones).
        `
      },
      {
        type: "network",
        title: "Deep Dive: Sex Cord-Stromal Tumors",
        config: { nodeId: "Leydig Cell Tumor", entityRefs: ["Leydig Cell Tumor", "Sertoli Cell Tumor"], showPrognosisPanel: true, showPitfallPanel: true },
        content: `
## Sex Cord–Stromal Tumors

### [[Leydig Cell Tumor]]
- Endocrine active (androgen/estrogen), may cause gynecomastia
- **Reinke crystals** supportive (not required)
- **IHC:** [[Inhibin]]+, [[Calretinin]]+, [[Melan-A]]+
- Prognosis usually favorable; **risk is feature-based** (size, necrosis, vascular invasion, mitoses, atypia)

### [[Sertoli Cell Tumor]]
- Tubule formation
- Syndromic associations can exist
- **IHC:** [[Inhibin]]+, [[Calretinin]]+
- Prognosis usually favorable; adverse features modify risk
        `
      },
      {
        type: "network",
        title: "Case Challenge: The Elderly Patient",
        config: {
          nodeId: "Testicular Lymphoma",
          entityRefs: ["Testicular Lymphoma", "Seminoma"],
          showPrognosisPanel: false,
          showPitfallPanel: false
        },
        content: `
## Case Challenge: The "Bilateral" Trap

**Scenario:** 78-year-old male presents with bilateral testicular enlargement.
**Microscopy:** Diffuse sheets of atypical cells crushing tubules.

**The Instinct:** "It looks like Seminoma."

**The Pivot:** Look at the age. Primary GCT in a 78-year-old is exceedingly rare. Bilaterality is a red flag.

**Test:** **[[CD45]]**.

**Resolution:** Positive. This is **[[Testicular Lymphoma]]**.

**Why it matters:** Staging is systemic (chemo), not surgical (orchiectomy alone is insufficient).
        `
      },
      {
        type: "summary",
        title: "Lecture Complete",
        config: {
          entityRefs: [
            "Seminoma",
            "GCNIS",
            "Embryonal Carcinoma",
            "Yolk Sac Tumor",
            "Choriocarcinoma",
            "Teratoma",
            "Mixed Germ Cell Tumor",
            "Testicular Lymphoma",
            "Spermatocytic Tumor",
            "Leydig Cell Tumor",
            "Sertoli Cell Tumor"
          ],
          showPrognosisPanel: true,
          showPitfallPanel: true
        },
        content: `
## Summary: Testicular Mass

**Core takeaways**
1) **Age is destiny** (prepubertal vs postpubertal vs >60).
2) **Markers must match morphology** (don’t let one stain decide the case).
3) **CD117 vs CD30** is a high-yield split (seminoma vs embryonal).
4) **Mixed tumors are common**: quantify components; highlight teratoma chemo resistance.
5) **Older men**: rule out lymphoma early (CD45 gate).

**If you call this wrong, what harm happens?**
- Undertreating mixed/NSGCT.
- Misrouting lymphoma into GCT pathway.
- Overcalling indolent entities into aggressive frameworks.
        `
      }
    ]
  }
];
