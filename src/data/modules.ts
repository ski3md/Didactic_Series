import { ModuleData } from '../types.ts';
export const CDN_BASE_URL = "https://storage.googleapis.com/granuloma-lecture-bucket";
export const IMAGE_PATHS = {
  granulomas: `${CDN_BASE_URL}/`,
};

export const modules: ModuleData[] = [
  // Granulomatosis with Polyangiitis (GPA)
  {
    topic: "Granulomatosis with Polyangiitis (GPA)",
    case_tutorial: {
      title: "Granulomatosis with Polyangiitis (GPA)",
      clinicalVignette: "A 55-year-old man presents with chronic sinusitis, intermittent hemoptysis, and a rising creatinine level. A chest CT reveals bilateral, cavitating pulmonary nodules. A lung biopsy is performed.",
      objective: "Differentiate the necrotizing granulomas of GPA from infectious mimics (like Tuberculosis) based on the *type* of necrosis, and correlate with the classic clinical and serologic findings.",
      caseDiscussion: "This case presents the classic clinical triad of GPA: 1) Upper respiratory tract (sinusitis), 2) Lower respiratory tract (hemoptysis, nodules), and 3) Renal (rising creatinine, suggestive of glomerulonephritis). The histologic finding is the key differentiator. Both GPA and TB cause necrotizing granulomas, but the *quality* of the necrosis is different. TB features 'clean' caseous necrosis, which is acellular and eosinophilic. GPA features 'dirty' geographic necrosis, which is filled with acute inflammation (neutrophils) and fragmented nuclear debris (karyorrhexis). This is often accompanied by a necrotizing vasculitis of small vessels and capillaritis. The diagnosis is confirmed by serology, which would be positive for c-ANCA (anti-PR3).",
      teachingPoints: [
        "GPA is defined by a clinical triad: Upper respiratory (sinusitis), Lower respiratory (nodules), and Renal (pauci-immune glomerulonephritis).",
        "The key serologic marker is **c-ANCA** (cytoplasmic antineutrophil cytoplasmic antibody), with antibodies targeting **PR3** (proteinase 3).",
        "The pathognomonic H&E finding is **\"dirty\" geographic necrosis** (neutrophilic debris), which must be differentiated from the \"clean\" caseous necrosis of TB.",
        "The granulomas are often 'palisaded' (histiocytes lined up) around the necrosis.",
        "A necrotizing vasculitis of small-to-medium vessels is the underlying pathology.",
        "Always perform AFB and GMS stains to definitively rule out infectious mimics (TB and Fungi)."
      ],
      references: [
        "Robbins Pathologic Basis of Disease, 10th Ed.",
        "American College of Rheumatology (ACR) Guidelines for Vasculitis",
        "Henry's Clinical Diagnosis and Management by Laboratory Methods, 24th Ed."
      ],
      histologyImage: {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Wegener%27s_granulomatosis_-b-_intermed_mag.jpg/1200px-Wegener%27s_granulomatosis_-b-_intermed_mag.jpg',
        alt: 'Granulomatosis with Polyangiitis showing necrotizing vasculitis and geographic dirty necrosis',
        caption: 'Granulomatosis with Polyangiitis – necrotizing granulomatous inflammation with vasculitis.'
      },
      goldStandardReport: {
        finalDiagnosis: "LUNG, WEDGE BIOPSY:\n- NECROTIZING GRANULOMATOUS INFLAMMATION WITH VASCULITIS, CONSISTENT WITH GRANULOMATOSIS WITH POLYANGIITIS (GPA).\n- NEGATIVE FOR FUNGAL ORGANISMS (GMS STAIN).\n- NEGATIVE FOR ACID-FAST BACILLI (AFB STAIN).",
        microscopicDescription: "Sections show lung parenchyma with geographic, basophilic necrosis containing abundant neutrophilic debris and karyorrhexis ('dirty necrosis'). The necrosis is surrounded by palisading histiocytes and associated with a mixed inflammatory infiltrate including lymphocytes, plasma cells, and neutrophils. A necrotizing vasculitis involving small to medium-sized vessels is identified. No viral inclusions, fungal organisms, or mycobacteria are seen on special stains.",
        comment: "The histologic findings, in the provided clinical context of sinusitis, pulmonary nodules, and renal dysfunction, are characteristic of Granulomatosis with Polyangiitis (GPA). Correlation with c-ANCA/anti-PR3 serology is recommended for definitive diagnosis."
      }
    },
    mcqs: [
      {
        topic: "Granulomatosis with Polyangiitis (GPA)",
        question: "A patient with chronic sinusitis and hematuria has a lung biopsy showing necrotizing granulomas. The necrotic centers are filled with neutrophils and nuclear debris. Which serologic test is most likely to be positive?",
        choices: [
          "c-ANCA (anti-PR3)",
          "p-ANCA (anti-MPO)",
          "anti-dsDNA",
          "Serum ACE"
        ],
        answer: "c-ANCA (anti-PR3)",
        rationale: "The clinical triad (sinus, lung, kidney) combined with 'dirty' neutrophilic necrosis is classic for GPA. This condition is strongly associated with c-ANCA (anti-PR3). p-ANCA (anti-MPO) is associated with EGPA or microscopic polyangiitis. Serum ACE is associated with sarcoidosis."
      }
    ],
    flashcards: [
      { front: "What is the classic clinical triad of GPA?", back: "Upper respiratory tract (sinusitis), Lower respiratory tract (lung nodules), and Renal (glomerulonephritis).", tag: "Diagnosis" },
      { front: "What is the pathognomonic serologic marker for GPA?", back: "c-ANCA (cytoplasmic ANCA) with antibodies to PR3 (proteinase 3).", tag: "Lab Principle" },
    ],
    status: "complete"
  },
  // Histoplasmosis
  {
    topic: "Histoplasmosis",
    case_tutorial: {
      title: "Histoplasmosis",
      clinicalVignette: "A 45-year-old man, an avid spelunker, presents with a 3-week history of low-grade fever, non-productive cough, and malaise. He lives in Ohio. A chest X-ray reveals bilateral hilar adenopathy and small, miliary nodules. A transbronchial biopsy is performed.",
      objective: "Differentiate pulmonary histoplasmosis from its primary mimic, tuberculosis, using ancillary stains and understanding its histomorphology.",
      caseDiscussion: "The clinical presentation is classic: a patient from an endemic area (Ohio River Valley) with a high-risk exposure (spelunking - bat guano) and caseating granulomas. This presentation is a direct mimic of primary tuberculosis (TB). Both show caseating granulomas, and the diagnosis *cannot* be made on H&E alone. The key differentiator is ancillary testing. An Acid-Fast Bacilli (AFB) stain would be required to rule out TB. Concurrently, a fungal stain is mandatory. The GMS (Gomori Methenamine-Silver) or PAS stain will highlight the causative organisms. In this case, the GMS stain would reveal small (2-5 µm), oval, budding yeasts, which are often clustered within the cytoplasm of histiocytes (macrophages). This finding confirms Histoplasmosis and rules out TB, which would be positive on AFB.",
      teachingPoints: [
        "Histoplasmosis is a primary mimic of Tuberculosis (TB) because both are classic causes of *caseating* granulomas.",
        "The diagnosis is made by *visualizing the organism* on special stains, not by the H&E granuloma pattern alone.",
        "Always order both AFB (for TB) and GMS/PAS (for fungi) on any caseating granuloma biopsy.",
        "Histoplasma capsulatum appears as small (2-5 µm), oval, budding yeasts, often found intracellularly within macrophages.",
        "Geographic history (Ohio/Mississippi River Valleys) or exposure history (caves, bird/bat guano) is a critical clinical clue."
      ],
      references: ["Robbins Pathologic Basis of Disease, 10th Ed.", "Centers for Disease Control and Prevention (CDC): Fungal Diseases - Histoplasmosis"],
      histologyImage: {
        src: 'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/histoplasmosis/GMS/histoplasmosis_histoplasmosis_06.jpg',
        alt: 'Histoplasmosis demonstrating numerous GMS-positive intracellular yeasts within macrophages',
        caption: 'Histoplasmosis – GMS stain highlighting clustered 2–5 µm intracellular yeasts.'
      },
      goldStandardReport: {
        finalDiagnosis: "LUNG, TRANSBRONCHIAL BIOPSY:\n- NECROTIZING GRANULOMATOUS INFLAMMATION.\n- GMS STAIN IS POSITIVE FOR NUMEROUS SMALL, BUDDING YEASTS, MORPHOLOGICALLY CONSISTENT WITH HISTOPLASMA SPECIES.\n- AFB STAIN IS NEGATIVE FOR ACID-FAST BACILLI.",
        microscopicDescription: "Sections show fragments of lung parenchyma with multiple well-formed granulomas with central caseous-type necrosis. Within the cytoplasm of histiocytes and giant cells, there are numerous small (2-5 micron), oval yeast forms. These organisms are highlighted by the GMS special stain.",
        comment: "The findings are diagnostic of pulmonary histoplasmosis. Given that the morphology on H&E can mimic tuberculosis, a negative AFB stain provides important negative information. Clinical correlation with serology and/or urine antigen testing is recommended."
      }
    },
    mcqs: [
      { topic: "Histoplasmosis", question: "A lung biopsy from a patient in Indiana shows caseating granulomas. The GMS stain reveals small, 2-5µm oval yeasts clustered within macrophages. What is the most likely diagnosis?", choices: ["Tuberculosis", "Sarcoidosis", "Histoplasmosis", "Cryptococcosis"], answer: "Histoplasmosis", rationale: "Caseating granulomas can be seen in TB or Fungal infections, but not typically sarcoidosis. The GMS finding of small, intracellular yeasts is the definitive feature of Histoplasmosis. Cryptococcus would show larger, encapsulated, narrow-based budding yeasts, and TB would be positive on an AFB stain." }
    ],
    flashcards: [
      { front: "What is the primary disease mimicked by Histoplasmosis on H&E?", back: "Tuberculosis (both cause caseating granulomas).", tag: "Diagnosis" },
      { front: "What is the key special stain for *Histoplasma*?", back: "GMS (Gomori Methenamine-Silver) or PAS.", tag: "Lab Principle" }
    ],
    status: "complete"
  },
   // Chronic Beryllium Disease
  {
    topic: "Chronic Beryllium Disease",
    case_tutorial: {
      title: "Chronic Beryllium Disease",
      clinicalVignette: "A 68-year-old retired aerospace engineer presents with a two-year history of progressive dyspnea and dry cough. A chest CT shows bilateral hilar adenopathy and micronodules. A transbronchial biopsy is performed, which reveals well-formed, non-caseating granulomas. Stains for fungi (GMS) and mycobacteria (AFB) are negative.",
      objective: "Evaluate the key differentiating test for Chronic Beryllium Disease (CBD) in a patient whose clinical, radiological, and histologic findings are otherwise indistinguishable from sarcoidosis.",
      caseDiscussion: "The presentation of non-caseating granulomas with hilar adenopathy is the classic picture for sarcoidosis, which is a diagnosis of exclusion. However, the patient's occupational history in aerospace engineering is a critical piece of data that demands a workup for CBD. CBD is a Type IV (T-cell mediated) hypersensitivity reaction to beryllium exposure. Histologically and radiologically, it is a perfect mimic of sarcoidosis. The gold standard is the Beryllium Lymphocyte Proliferation Test (BeLPT), which challenges the patient's lymphocytes with beryllium salts in vitro. A positive proliferation response confirms sensitization and, in this clinical context, diagnoses CBD.",
      teachingPoints: ["Chronic Beryllium Disease (CBD) is histologically and radiologically *indistinguishable* from sarcoidosis.", "The diagnosis is entirely dependent on 1) A history of beryllium exposure (aerospace, electronics) and 2) A positive Beryllium Lymphocyte Proliferation Test (BeLPT).", "CBD is a cell-mediated (Type IV) hypersensitivity, not a pneumoconiosis in the traditional sense.", "Standard stains (AFB, GMS) are crucial to rule out infectious mimics."],
      references: ["Robbins Pathologic Basis of Disease, 10th Ed.", "American Thoracic Society (ATS) Clinical Practice Guideline: Diagnosis and Management of Beryllium Sensitivity and Chronic Beryllium Disease."],
      histologyImage: {
        src: 'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/sarcoidosis/Unclassified/sarcoidosis_sarcoidosis_60.jpg',
        alt: 'Chronic Beryllium Disease with well-formed non-necrotizing granulomas',
        caption: 'Chronic Beryllium Disease – tight non-caseating granulomas indistinguishable from sarcoidosis.'
      },
      goldStandardReport: {
        finalDiagnosis: "LUNG, TRANSBRONCHIAL BIOPSY:\n- NON-NECROTIZING GRANULOMATOUS INFLAMMATION.\n- NEGATIVE FOR FUNGAL ORGANISMS (GMS STAIN).\n- NEGATIVE FOR ACID-FAST BACILLI (AFB STAIN).",
        microscopicDescription: "Sections show multiple, well-circumscribed, non-necrotizing granulomas composed of epithelioid histiocytes, multinucleated giant cells, and a rim of lymphocytes. There is no evidence of necrosis. Special stains for microorganisms are negative.",
        comment: "The histologic findings are those of non-necrotizing granulomatous inflammation. The differential diagnosis includes sarcoidosis and chronic beryllium disease. Given the patient's occupational history in the aerospace industry, correlation with a Beryllium Lymphocyte Proliferation Test (BeLPT) is required to differentiate these two entities. Sarcoidosis remains a diagnosis of exclusion."
      }
    },
    mcqs: [
      { topic: "Chronic Beryllium Disease", question: "A 70-year-old male with a 40-year career in electronics manufacturing presents with dyspnea. A lung biopsy shows numerous non-caseating granulomas identical to sarcoidosis. Which of the following is the most definitive test to establish the correct diagnosis?", choices: ["Serum Angiotensin-Converting Enzyme (ACE) level", "Beryllium Lymphocyte Proliferation Test (BeLPT)", "GMS and AFB special stains", "Serum c-ANCA level"], answer: "Beryllium Lymphocyte Proliferation Test (BeLPT)", rationale: "Both CBD and sarcoidosis present with non-caseating granulomas and can have elevated ACE. The BeLPT is the gold standard test that detects T-cell sensitization to beryllium, which is specific for CBD. GMS/AFB are necessary to rule out infection but do not differentiate CBD from sarcoidosis." }
    ],
    flashcards: [
       { front: "What is the key histologic finding in Chronic Beryllium Disease (CBD)?", back: "Well-formed, non-caseating granulomas, which are histologically indistinguishable from sarcoidosis.", tag: "Diagnosis" },
      { front: "What is the gold standard diagnostic test for CBD?", back: "The Beryllium Lymphocyte Proliferation Test (BeLPT).", tag: "Lab Principle" }
    ],
    status: "complete"
  }
];
