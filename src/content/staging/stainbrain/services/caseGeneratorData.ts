import type { CaseImages, HistologicFamily, SpecimenType, PrimarySite } from '../types';

export interface DiagnosisData {
    name: string;
    histologicFamily: HistologicFamily;
    specimenType: SpecimenType;
    primarySite: PrimarySite;
    ageRange: [number, number];
    sizeRange: [number, number];
    commonSites: string[];
    ihc: {
        positive: string[];
        negative: string[];
    };
    images?: CaseImages;
}

export type GeneratorData = Record<string, DiagnosisData>;

export const BST_GENERATOR_DATA: GeneratorData = {
    wdlps: {
        name: "Well-Differentiated Liposarcoma",
        histologicFamily: "adipocytic",
        specimenType: "Soft tissue, excision/resection",
        primarySite: "Retroperitoneum",
        ageRange: [50, 80],
        sizeRange: [10, 30],
        commonSites: ["retroperitoneum", "thigh", "inguinal region"],
        ihc: {
            positive: ["MDM2", "CDK4", "p16"],
            negative: ["CD34 (variable)", "S100 (in stromal cells)"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Well-differentiated_liposarcoma_with_lipoblasts_and_hyperchromatic_stromal_cells.jpg/1024px-Well-differentiated_liposarcoma_with_lipoblasts_and_hyperchromatic_stromal_cells.jpg"]
        }
    },
    sft: {
        name: "Solitary Fibrous Tumor",
        histologicFamily: "sft",
        specimenType: "Soft tissue, excision/resection",
        primarySite: "Extremity/Trunk",
        ageRange: [40, 70],
        sizeRange: [3, 15],
        commonSites: ["thigh", "pleura", "head/neck"],
        ihc: {
            positive: ["STAT6 (nuclear)", "CD34", "BCL2", "CD99"],
            negative: ["S100", "Desmin", "Keratin"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Solitary_fibrous_tumour_--_high_mag.jpg/1024px-Solitary_fibrous_tumour_--_high_mag.jpg"]
        }
    },
    ups: {
        name: "Undifferentiated Pleomorphic Sarcoma",
        histologicFamily: "fibrohistiocytic",
        specimenType: "Soft tissue, excision/resection",
        primarySite: "Extremity/Trunk",
        ageRange: [60, 85],
        sizeRange: [5, 20],
        commonSites: ["thigh", "buttock", "retroperitoneum"],
        ihc: {
            positive: ["Vimentin", "CD68 (non-specific)", "SMA (focal)"],
            negative: ["Pan-Keratin", "S100", "Desmin", "MDM2 (amplification)"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Undifferentiated_pleomorphic_sarcoma_1_--_high_mag.jpg/1024px-Undifferentiated_pleomorphic_sarcoma_1_--_high_mag.jpg"]
        }
    },
    myxoid_lps: {
        name: "Myxoid Liposarcoma",
        histologicFamily: "adipocytic",
        specimenType: "Soft tissue, excision/resection",
        primarySite: "Extremity/Trunk",
        ageRange: [30, 60],
        sizeRange: [5, 15],
        commonSites: ["thigh", "popliteal fossa"],
        ihc: {
            positive: ["S100 (lipoblasts)", "NY-ESO-1"],
            negative: ["MDM2", "CDK4"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Myxoid_liposarcoma_2_--_high_mag.jpg/1024px-Myxoid_liposarcoma_2_--_high_mag.jpg"]
        }
    },
    synovial_sarcoma: {
        name: "Synovial Sarcoma",
        histologicFamily: "uncertain",
        specimenType: "Soft tissue, excision/resection",
        primarySite: "Extremity/Trunk",
        ageRange: [15, 40],
        sizeRange: [4, 12],
        commonSites: ["knee", "ankle", "foot"],
        ihc: {
            positive: ["TLE1 (nuclear)", "Keratin (focal)", "EMA (focal)", "CD99"],
            negative: ["S100", "CD34"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Synovial_sarcoma_1_--_high_mag.jpg/1024px-Synovial_sarcoma_1_--_high_mag.jpg"]
        }
    }
};

export const DERMPATH_GENERATOR_DATA: GeneratorData = {
    bcc: {
        name: "Basal Cell Carcinoma",
        histologicFamily: "basaloid",
        specimenType: "Skin, excision",
        primarySite: "Head/Neck",
        ageRange: [40, 80],
        sizeRange: [0.5, 3],
        commonSites: ["face", "nose", "ear"],
        ihc: {
            positive: ["Ber-EP4", "Bcl-2", "p63"],
            negative: ["EMA", "CK20"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Basal_cell_carcinoma_--_high_mag.jpg/1024px-Basal_cell_carcinoma_--_high_mag.jpg"]
        }
    },
    scc: {
        name: "Squamous Cell Carcinoma",
        histologicFamily: "squamous",
        specimenType: "Skin, excision",
        primarySite: "Head/Neck",
        ageRange: [50, 90],
        sizeRange: [1, 5],
        commonSites: ["hand", "scalp", "face"],
        ihc: {
            positive: ["p40", "p63", "CK5/6", "EMA"],
            negative: ["Ber-EP4", "S100", "CD10"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Squamous_cell_carcinoma_of_the_skin_-_high_mag.jpg/1024px-Squamous_cell_carcinoma_of_the_skin_-_high_mag.jpg"]
        }
    },
    melanoma: {
        name: "Malignant Melanoma",
        histologicFamily: "melanocytic",
        specimenType: "Skin, excision",
        primarySite: "Extremity/Trunk",
        ageRange: [30, 80],
        sizeRange: [0.5, 4],
        commonSites: ["back", "leg", "arm"],
        ihc: {
            positive: ["S100", "SOX10", "Melan-A", "HMB-45", "PRAME"],
            negative: ["Keratin", "CD45", "Desmin"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Nodular_melanoma_-_high_mag.jpg/1024px-Nodular_melanoma_-_high_mag.jpg"]
        }
    },
    afx: {
        name: "Atypical Fibroxanthoma",
        histologicFamily: "histiocytic_dendritic",
        specimenType: "Skin, excision",
        primarySite: "Head/Neck",
        ageRange: [70, 95],
        sizeRange: [1, 3],
        commonSites: ["scalp", "ear", "face"],
        ihc: {
            positive: ["CD10", "Procollagen-1", "CD68"],
            negative: ["p63", "S100", "Desmin", "Pan-Keratin"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Atypical_fibroxanthoma_--_high_mag.jpg/1024px-Atypical_fibroxanthoma_--_high_mag.jpg"]
        }
    },
    merkel: {
        name: "Merkel Cell Carcinoma",
        histologicFamily: "neuroendocrine",
        specimenType: "Skin, excision",
        primarySite: "Head/Neck",
        ageRange: [65, 90],
        sizeRange: [1, 4],
        commonSites: ["head", "neck", "arm"],
        ihc: {
            positive: ["CK20 (dot-like)", "Synaptophysin", "Chromogranin", "INSM1"],
            negative: ["TTF-1", "LCA", "CK7"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Merkel_cell_carcinoma_--_very_high_mag.jpg/1024px-Merkel_cell_carcinoma_--_very_high_mag.jpg"]
        }
    }
};

export const GYN_GENERATOR_DATA: GeneratorData = {
    hgsc: {
        name: "High-Grade Serous Carcinoma",
        histologicFamily: "epithelial_gyn",
        specimenType: "Ovary, biopsy/resection",
        primarySite: "Visceral",
        ageRange: [50, 75],
        sizeRange: [5, 15],
        commonSites: ["ovary", "omentum", "fallopian tube"],
        ihc: {
            positive: ["PAX8", "WT1", "p53 (mutant pattern)", "p16 (block)"],
            negative: ["ER (variable)", "Napsin A"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/High-grade_serous_carcinoma_of_the_ovary_-_high_mag.jpg/1024px-High-grade_serous_carcinoma_of_the_ovary_-_high_mag.jpg"]
        }
    },
    endometrioid_ca: {
        name: "Endometrioid Adenocarcinoma (FIGO Grade 1)",
        histologicFamily: "epithelial_gyn",
        specimenType: "Uterus, biopsy/curettage",
        primarySite: "Visceral",
        ageRange: [45, 65],
        sizeRange: [2, 8],
        commonSites: ["endometrium"],
        ihc: {
            positive: ["PAX8", "ER", "PR", "Vimentin"],
            negative: ["p16 (patchy)", "CEA"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Endometrioid_adenocarcinoma_of_endometrium_--_high_mag.jpg/1024px-Endometrioid_adenocarcinoma_of_endometrium_--_high_mag.jpg"]
        }
    },
    leiomyosarcoma_gyn: {
        name: "Uterine Leiomyosarcoma",
        histologicFamily: "mesenchymal_gyn",
        specimenType: "Uterus, hysterectomy",
        primarySite: "Visceral",
        ageRange: [45, 65],
        sizeRange: [8, 15],
        commonSites: ["uterus"],
        ihc: {
            positive: ["SMA", "Desmin", "p16 (diffuse)", "p53 (mutant)"],
            negative: ["ER (often negative)", "PR"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Leiomyosarcoma_1_--_high_mag.jpg/1024px-Leiomyosarcoma_1_--_high_mag.jpg"]
        }
    },
    granulosa_cell: {
        name: "Adult Granulosa Cell Tumor",
        histologicFamily: "sex_cord",
        specimenType: "Ovary, biopsy/resection",
        primarySite: "Visceral",
        ageRange: [40, 60],
        sizeRange: [5, 12],
        commonSites: ["ovary"],
        ihc: {
            positive: ["Inhibin", "Calretinin", "FOXL2"],
            negative: ["EMA", "CK7"]
        },
        images: {
            histologyHE: ["https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Adult_granulosa_cell_tumor_-_high_mag.jpg/1024px-Adult_granulosa_cell_tumor_-_high_mag.jpg"]
        }
    }
};